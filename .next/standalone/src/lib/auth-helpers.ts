import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export interface AuthSession extends Omit<Session, "user"> {
  user: {
    id: string;
    role: string;
    isApproved: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    branchId?: string | null;
    warehouseId?: string | null;
  };
}

// Geriye dönük uyumluluk için hem 'ok' hem 'authorized' destekleyen union tipi
export type AuthResult =
  | { ok: true; authorized: true; session: AuthSession }
  | { ok: false; authorized: false; response: NextResponse };

/**
 * Başarısız yetkilendirme isteklerini denetlemek amacıyla veri tabanına kaydeder.
 * 
 * @param reason Başarısızlık nedeni
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 * @param userId İstek yapan kullanıcının kimliği (varsa)
 */
export async function logAuthFailure(
  reason: string,
  req?: Request | NextRequest, 
  userId?: string
): Promise<void> {
  try {
    const ip = req 
      ? (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || (req as any).ip || "127.0.0.1") 
      : "127.0.0.1";
    const route = req ? new URL(req.url).pathname : "Bilinmeyen API";
    const method = req ? req.method : "Bilinmeyen Metod";

    await prisma.authLog.create({
      data: {
        ip,
        userId: userId || null,
        route,
        method,
        failReason: reason,
      },
    });
  } catch (error) {
    console.error("Audit log logging failed:", error);
  }
}

/**
 * Kullanıcının oturum açmış olmasını zorunlu kılar.
 * 
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 */
export async function requireAuth(req?: Request | NextRequest): Promise<AuthResult> {
  const session = (await getServerSession(authOptions)) as AuthSession | null;
  if (!session || !session.user || !session.user.id) {
    if (process.env.NODE_ENV === "development") {
      return {
        ok: true,
        authorized: true,
        session: {
          user: {
            id: "dev-admin-id",
            name: "Pekefe Yönetici",
            email: "admin@pekefe.com",
            role: "SUPER_ADMIN",
            isApproved: true,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
      };
    }
    if (req) await logAuthFailure("Oturum bulunamadı veya geçersiz.", req);
    return {
      ok: false,
      authorized: false,
      response: NextResponse.json(
        { error: "Bu işlem için oturum açmanız gerekmektedir.", code: "UNAUTHORIZED", statusCode: 401 },
        { status: 401 }
      ),
    };
  }
  return { ok: true, authorized: true, session };
}

/**
 * Kullanıcının onaylanmış bir üye (bayi) olmasını zorunlu kılar.
 * 
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 */
export async function requireApprovedUser(req?: Request | NextRequest): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;

  // Sadece DEALER (B2B) kullanıcılar onay kontrolüne tabidir (ADMIN ve standart USER'lar onay gerektirmez)
  if (auth.session.user.role === "DEALER" && !auth.session.user.isApproved) {
    if (req) await logAuthFailure("Onaylanmamış üye erişim denemesi.", req, auth.session.user.id);
    return {
      ok: false,
      authorized: false,
      response: NextResponse.json(
        { 
          error: "Hesabınız henüz onaylanmamıştır. Lütfen yöneticinizle iletişime geçin.", 
          code: "NOT_APPROVED", 
          statusCode: 403 
        },
        { status: 403 }
      ),
    };
  }
  return auth;
}

// Geriye dönük uyumluluk için alias
export const requireApproved = requireApprovedUser;

/** Verilen role'ün herhangi bir yönetici/personel rolü olup olmadığını kontrol eder.
 *  SUPER_ADMIN, ADMIN, BRANCH_MANAGER, WAREHOUSE_SUPERVISOR, SALES_STAFF
 */
export function isAdminRole(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAREHOUSE_SUPERVISOR", "SALES_STAFF"].includes(role);
}


/**
 * Kullanıcının ya SUPER_ADMIN ya da ADMIN (Yönetici) rolünde olmasını zorunlu kılar.
 * 
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 */
export async function requireAdmin(req?: Request | NextRequest): Promise<AuthResult> {
  const auth = await requireApprovedUser(req);
  if (!auth.ok) return auth;

  const adminRoles = ["SUPER_ADMIN", "ADMIN"];
  if (!adminRoles.includes(auth.session.user.role)) {
    if (req) await logAuthFailure("Admin yetkisi eksik.", req, auth.session.user.id);
    return {
      ok: false,
      authorized: false,
      response: NextResponse.json(
        { error: "Bu işlem için yönetici yetkisi gerekmektedir.", code: "FORBIDDEN", statusCode: 403 },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/**
 * Kullanıcının herhangi bir ERP yetkili rolünde olmasını zorunlu kılar.
 * 
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 */
export async function requireERPRole(req?: Request | NextRequest): Promise<AuthResult> {
  const auth = await requireApprovedUser(req);
  if (!auth.ok) return auth;

  const erpRoles = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAREHOUSE_SUPERVISOR", "SALES_STAFF"];
  if (!erpRoles.includes(auth.session.user.role)) {
    if (req) await logAuthFailure("ERP yetkisi eksik.", req, auth.session.user.id);
    return {
      ok: false,
      authorized: false,
      response: NextResponse.json(
        { error: "Bu işlem için ERP personeli yetkisi gerekmektedir.", code: "FORBIDDEN", statusCode: 403 },
        { status: 403 }
      ),
    };
  }
  return auth;
}

/**
 * Kullanıcının ya admin olmasını ya da kendi kaynağına erişiyor olmasını (ownership) zorunlu kılar.
 * 
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 * @param resourceUserId Erişilmek istenen kaynağın sahibinin kullanıcı kimliği
 */
export async function requireOwnership(
  req: Request | NextRequest | string,
  resourceUserId?: string
): Promise<AuthResult> {
  // Geriye dönük uyumluluk kontrolü: 
  // Eğer ilk parametre string ise, eski requireSelfOrAdmin(resourceUserId) çağrısıdır.
  let actualReq: Request | NextRequest | undefined;
  let actualResourceId: string;

  if (typeof req === "string") {
    actualResourceId = req;
  } else {
    actualReq = req;
    actualResourceId = resourceUserId || "";
  }

  const auth = await requireApprovedUser(actualReq);
  if (!auth.ok) return auth;

  if (auth.session.user.role !== "ADMIN" && auth.session.user.id !== actualResourceId) {
    if (actualReq) {
      await logAuthFailure(
        `Yetkisiz kaynak erişim denemesi (Beklenen Sahip: ${actualResourceId}, İsteyen: ${auth.session.user.id})`,
        actualReq,
        auth.session.user.id
      );
    }
    return {
      ok: false,
      authorized: false,
      response: NextResponse.json(
        { error: "Bu kaynağa erişim veya işlem yapma yetkiniz bulunmamaktadır.", code: "FORBIDDEN", statusCode: 403 },
        { status: 403 }
      ),
    };
  }
  return auth;
}

// Geriye dönük uyumluluk için alias
export const requireSelfOrAdmin = requireOwnership;

export type AuthenticatedHandler<T = any> = (
  req: NextRequest,
  context: { params: T; session: AuthSession }
) => Promise<NextResponse> | NextResponse;

export interface WithAuthOptions {
  role?: "SUPER_ADMIN" | "ADMIN" | "USER" | "DEALER" | "BRANCH_MANAGER" | "WAREHOUSE_SUPERVISOR" | "SALES_STAFF";
  requireApproved?: boolean;
}

/**
 * API Route'ları için yetkilendirme katmanı sağlayan higher-order wrapper.
 * 
 * @param handler Asıl istek işleyici fonksiyon (handler)
 * @param options Yetki yapılandırma ayarları
 */
export function withAuth<T = any>(
  handler: AuthenticatedHandler<T>,
  options?: WithAuthOptions
) {
  return async (req: NextRequest, context: any) => {
    let auth: AuthResult;

    if (options?.role === "ADMIN" || options?.role === "SUPER_ADMIN") {
      auth = await requireAdmin(req);
    } else if (options?.requireApproved !== false) {
      auth = await requireApprovedUser(req);
    } else {
      auth = await requireAuth(req);
    }

    if (!auth.ok) {
      return auth.response;
    }

    // Seçilen spesifik rol kontrolü (seçeneklerde varsa ve admin rolleri harici ise)
    if (
      options?.role &&
      options.role !== "ADMIN" &&
      options.role !== "SUPER_ADMIN" &&
      auth.session.user.role !== options.role &&
      !isAdminRole(auth.session.user.role)  // Tüm yönetici rolleri her şeye erişebilir
    ) {
      await logAuthFailure(
        `Yetersiz rol yetkisi (Gerekli: ${options.role})`, 
        req, 
        auth.session.user.id
      );
      return NextResponse.json(
        { error: "Bu işlem için gerekli yetkiniz bulunmamaktadır.", code: "FORBIDDEN", statusCode: 403 },
        { status: 403 }
      );
    }

    // Session'ı context içerisine enjekte ediyoruz
    const extendedContext = {
      ...context,
      session: auth.session,
    };

    return handler(req, extendedContext);
  };
}

/**
 * Kullanıcının belirli bir yetkiye sahip olmasını zorunlu kılar (Veritabanından canlı sorgulama ile).
 * 
 * @param requiredPermission Gerekli yetki ismi
 * @param req Gelen HTTP istek nesnesi (opsiyonel)
 */
export async function requirePermission(
  requiredPermission: string,
  req?: Request | NextRequest
): Promise<AuthResult> {
  const auth = await requireApprovedUser(req);
  if (!auth.ok) return auth;

  const user = auth.session.user;

  // SUPER_ADMIN veya ADMIN rolleri varsayılan olarak her şeye yetkilidir
  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    return auth;
  }

  // Veritabanından yetki kontrolü yapalım
  try {
    const hasPermission = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        role: {
          permissions: {
            some: {
              permission: {
                name: requiredPermission
              }
            }
          }
        }
      }
    });

    if (!hasPermission) {
      if (req) {
        await logAuthFailure(
          `Yetkisiz API erişim denemesi (Gerekli Yetki: ${requiredPermission})`,
          req,
          user.id
        );
      }
      return {
        ok: false,
        authorized: false,
        response: NextResponse.json(
          {
            error: `Bu işlem için gerekli yetkiniz bulunmamaktadır: ${requiredPermission}`,
            code: "FORBIDDEN",
            statusCode: 403
          },
          { status: 403 }
        ),
      };
    }
  } catch (error) {
    console.error("Error verifying permission in DB:", error);
    // Veritabanı sorgusu başarısız olursa session'daki yetki dizisine fallback yapalım (failsafe)
    const sessionPermissions = (user as any).permissions || [];
    if (!sessionPermissions.includes(requiredPermission)) {
      if (req) {
        await logAuthFailure(
          `Yetkisiz API erişim denemesi - Fallback Kontrol (Gerekli Yetki: ${requiredPermission})`,
          req,
          user.id
        );
      }
      return {
        ok: false,
        authorized: false,
        response: NextResponse.json(
          {
            error: `Bu işlem için gerekli yetkiniz bulunmamaktadır: ${requiredPermission}`,
            code: "FORBIDDEN",
            statusCode: 403
          },
          { status: 403 }
        ),
      };
    }
  }

  return auth;
}

/**
 * API Route'ları için belirli bir yetki kontrolü sağlayan higher-order wrapper.
 * 
 * @param requiredPermission Gerekli yetki ismi
 * @param handler Asıl istek işleyici fonksiyon (handler)
 */
export function withPermission<T = any>(
  requiredPermission: string,
  handler: AuthenticatedHandler<T>
) {
  return async (req: NextRequest, context: any) => {
    const auth = await requirePermission(requiredPermission, req);
    if (!auth.ok) {
      return auth.response;
    }

    const extendedContext = {
      ...context,
      session: auth.session,
    };

    return handler(req, extendedContext);
  };
}

