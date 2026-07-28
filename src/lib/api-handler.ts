import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

// İsteğe bağlı: Hataları veritabanına yazmak için bir fonksiyon
async function logErrorToDB(error: Error, route: string, payload?: any) {
  try {
    // AuthLog tablonuzu kullanarak sistem hatalarını loglayabilirsiniz 
    // veya yeni bir SystemErrorLog tablosu açabilirsiniz.
    await prisma.authLog.create({
      data: {
        ip: "SYSTEM",
        route: route,
        method: "ERROR",
        failReason: error.message.substring(0, 200), // Sadece ilk 200 karakter
      }
    });
  } catch (e) {
    console.error("Hata loglanırken başka bir hata oluştu:", e);
  }
}

export async function apiHandler(
  req: Request, 
  routeIdentifier: string, 
  handler: () => Promise<NextResponse>
) {
  try {
    // 1. Session ve Tenant bilgilerini yükle (Dinamik import ile dairesel bağımlılık önlenir)
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("@/lib/authOptions");
    const { tenantStorage } = await import("@/lib/prisma");

    const session = (await getServerSession(authOptions)) as any;
    const companyId = session?.user?.companyId;
    const role = session?.user?.role;

    // 2. Tenant ID veya User ID varsa sorguları bu kapsamda çalıştır, yoksa normal devam et
    if (companyId || session?.user?.id) {
      return await tenantStorage.run(
        { 
          companyId: companyId || "", 
          role: role || "", 
          userId: session?.user?.id || "" 
        }, 
        () => handler()
      );
    }

    // Asıl API işlemini çalıştır
    return await handler();
  } catch (error: any) {
    console.error(`[API ERROR] ${routeIdentifier}:`, error);

    // 1. Zod Doğrulama Hatası (Kötü Payload)
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Geçersiz veri formatı", 
          details: (error as any).errors.map((e: any) => ({ alan: e.path.join('.'), mesaj: e.message })) 
        }, 
        { status: 400 }
      );
    }

    // 2. Prisma Veritabanı Hatası (Unique constraint vb.)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: "Bu kayıt zaten sistemde mevcut. (Benzersiz alan ihlali)" },
        { status: 409 }
      );
    }

    // 3. Bilinmeyen Kritik Sunucu Hatası
    // Üretim (Production) ortamında hatayı veritabanına yaz
    if (process.env.NODE_ENV === 'production') {
      await logErrorToDB(error, routeIdentifier);
    }

    return NextResponse.json(
      { success: false, error: "Sunucu tarafında beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}
