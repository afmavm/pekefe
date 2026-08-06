import { PrismaClient } from "../generated-client";
import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  companyId: string;
  role: string;
  userId: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

const globalForPrisma = global as unknown as { prisma: any };

const createPrismaClient = () => {
  let dbUrl = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/pekefe_db";
  
  if (dbUrl.startsWith("file:") || dbUrl.includes(".db")) {
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

          // 1. Tenant İzolasyonu (Sıfır sub-query, direkt filtre ekleme)
          if (tenant && tenantIsolatedModels.includes(model)) {
            if (role !== "SUPER_ADMIN") {
              const anyArgs = args as any;

              // Read, Update & Delete Operations
              if (["findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy", "update", "delete", "updateMany", "deleteMany"].includes(operation)) {
                anyArgs.where = anyArgs.where || {};
                if (companyId) {
                  anyArgs.where.companyId = companyId;
                }
              }

              // Create Operations (skip user since companyId might be empty or custom)
              if (operation === "create" && model !== "User") {
                anyArgs.data = anyArgs.data || {};
                if (companyId) {
                  anyArgs.data.companyId = companyId;
                }
              }

              if (operation === "createMany" && model !== "User") {
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data = anyArgs.data.map((item: any) => ({
                    ...item,
                    ...(companyId ? { companyId } : {}),
                  }));
                } else if (anyArgs.data && companyId) {
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
            const anyArgs = args as any;
            
            // Ana işlemi doğrudan ve beklemeden çalıştır (sıfır kilitlenme)
            const result = await query(args);

            const resAny = result as any;
            const recordId = String(resAny?.id || anyArgs?.where?.id || "unknown");
            const action = operation.toUpperCase();

            // Non-blocking log kaydı yaz (ana akışı bekletmeden arka planda çalıştır)
            basePrisma.systemAuditLog.create({
              data: {
                tableName: model,
                recordId,
                action,
                newData: result ? JSON.parse(JSON.stringify(result)) : undefined,
                userId,
                companyId,
              }
            }).catch(() => {});

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
