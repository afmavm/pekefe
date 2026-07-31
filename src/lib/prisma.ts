import { PrismaClient } from "../generated-client";
import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  companyId: string;
  role: string;
  userId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

const globalForPrisma = global as unknown as { prisma: any };

// Helper to execute out-of-band basePrisma queries safely without deadlocking active transactions in SQLite
const safeBaseQuery = async <T>(queryPromise: Promise<T>, timeoutMs = 250): Promise<T | null> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch {
    clearTimeout(timeoutId!);
    return null;
  }
};

const createPrismaClient = () => {
  let dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  
  if (dbUrl.includes(".db") || dbUrl.startsWith("file:")) {
    if (!dbUrl.includes("busy_timeout")) {
      const separator = dbUrl.includes("?") ? "&" : "?";
      dbUrl = `${dbUrl}${separator}connection_limit=1&busy_timeout=60000`;
    }
  }

  const basePrisma = new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  // Enable WAL mode for SQLite to support concurrent read/write locks
  if (dbUrl.includes(".db") || dbUrl.startsWith("file:")) {
    basePrisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch((err: any) => {
      console.warn("Failed to enable WAL mode:", err);
    });
  }

  const tenantIsolatedModels = [
    "Product",
    "Warehouse",
    "CurrentAccount",
    "Order",
    "Invoice",
    "StockTransaction",
    "ProductionOrder",
    "JournalEntry",
    "Expense",
    "Income",
    "User"
  ];

  const auditTargetModels = [
    "Invoice",
    "Product",
    "Order",
    "CurrentAccount",
    "StockTransaction",
    "JournalEntry"
  ];

  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenant = tenantStorage.getStore();
          const userId = tenant?.userId || null;
          const companyId = tenant?.companyId || null;
          const role = tenant?.role || null;

          // 1. Tenant İzolasyonu
          if (tenant && tenantIsolatedModels.includes(model)) {
            if (role !== "SUPER_ADMIN") {
              const anyArgs = args as any;

              // Read Operations
              if (["findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy"].includes(operation)) {
                anyArgs.where = anyArgs.where || {};
                anyArgs.where.companyId = companyId;
              }

              // Update & Delete Operations (Safe verification using findFirst to bypass Prisma unique validation constraints)
              if (["update", "delete"].includes(operation)) {
                if (anyArgs.where) {
                  const dbModelName = model.charAt(0).toLowerCase() + model.slice(1);
                  const record = await safeBaseQuery(
                    (basePrisma as any)[dbModelName].findFirst({
                      where: {
                        ...anyArgs.where,
                        companyId: companyId
                      },
                      select: { id: true }
                    })
                  );
                  if (tenant && !record) {
                    throw new Error(`Record to ${operation} not found in model ${model} or unauthorized access.`);
                  }
                }
              }

              if (["updateMany", "deleteMany"].includes(operation)) {
                anyArgs.where = anyArgs.where || {};
                anyArgs.where.companyId = companyId;
              }

              // Create Operations (skip user since companyId might be empty or custom)
              if (operation === "create" && model !== "User") {
                anyArgs.data = anyArgs.data || {};
                anyArgs.data.companyId = companyId;
              }

              if (operation === "createMany" && model !== "User") {
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data = anyArgs.data.map((item: any) => ({
                    ...item,
                    companyId: companyId,
                  }));
                } else if (anyArgs.data) {
                  anyArgs.data.companyId = companyId;
                }
              }
            }
          }

          // 2. Kara Kutu Denetim Günlüğü (System Audit Logging)
          // SystemAuditLog modelinin kendi işlemlerini loglamayı engelliyoruz (sonsuz döngü koruması)
          if (model === "SystemAuditLog") {
            return query(args);
          }

          if (auditTargetModels.includes(model) && ["create", "update", "delete", "upsert"].includes(operation)) {
            let action = "CREATE";
            let oldData: any = null;
            let recordId = "";

            // Güncelleme veya silme öncesi eski veriyi çekiyoruz (safeBaseQuery ile deadlock engellenir)
            if (operation === "update" || operation === "delete") {
              action = operation === "update" ? "UPDATE" : "DELETE";
              try {
                const anyArgs = args as any;
                if (anyArgs.where) {
                  const dbName = model.charAt(0).toLowerCase() + model.slice(1);
                  oldData = await safeBaseQuery(
                    (basePrisma as any)[dbName].findUnique({
                      where: anyArgs.where,
                    })
                  );
                  if (oldData) {
                    recordId = oldData.id || "";
                  } else if (anyArgs.where.id) {
                    recordId = String(anyArgs.where.id);
                  }
                }
              } catch (e) {
                console.error(`[AUDIT PRE-FETCH ERROR] Failed to fetch old state for ${model}:`, e);
              }
            }

            // Ana işlemi çalıştır
            const result = await query(args);

            // Kayıt ID'sini sonuçtan çözmeye çalış
            if (!recordId && result) {
              recordId = (result as any).id || "";
            }

            let newData: any = null;
            if (operation === "create" || operation === "update" || operation === "upsert") {
              newData = result;
              if (operation === "upsert") {
                action = oldData ? "UPDATE" : "CREATE";
              }
            }

            // Non-blocking log kaydı yaz (ana akışı bekletmeden arka planda çalıştır)
            basePrisma.systemAuditLog.create({
              data: {
                tableName: model,
                recordId: String(recordId || "unknown"),
                action,
                oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
                newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
                userId,
                companyId,
              }
            }).catch(err => {
              console.error("[AUDIT LOG ERROR] Failed to save audit entry:", err);
            });

            return result;
          }

          return query(args);
        },
      },
    },
  });
};

// Cast to PrismaClient to maintain static type compatibility across the codebase 
// while preserving the extended runtime middleware behavior.
export const prisma = (globalForPrisma.prisma || createPrismaClient()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Auto backup cron initialization — build sırasında başlatma
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
if (typeof window === 'undefined' && !isBuildPhase) {
  import('./backup-cron').then(({ initBackupCron }) => {
    initBackupCron();
  }).catch(err => {
    console.error('Failed to initialize backup cron:', err);
  });
}
