/**
 * POST /api/accounting/current-accounts/[id]/b2b-user
 *
 * B2B portal kullanıcısı oluştur veya güncelle.
 * - E-posta varsa: şifre ve aktiflik güncellenir (hem yerel hem uzak DB)
 * - E-posta yoksa: yeni User oluşturulur, cari hesaba bağlanır
 */
import { NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { readLocalAccounts, updateLocalAccount } from "@/lib/jsonCurrentAccountsDb";
import { findLocalUser, upsertLocalUser } from "@/lib/jsonUserDb";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const { adSoyad, email, password, isActive } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "E-posta adresi zorunludur." }, { status: 400 });
    }
    if (!password || String(password).trim().length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Cari hesabı bul (Önce DB, sonra Yerel)
    let account: any = await withTimeout(
      prisma.currentAccount.findUnique({ where: { id: accountId } }),
      1500,
      null
    );

    if (!account) {
      const localAccounts = readLocalAccounts();
      account = localAccounts.find(a => a.id === accountId || a.cariKod === accountId) || null;
    }

    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı." }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(cleanPass, 10);
    const existingLocal = findLocalUser({ email: cleanEmail });
    const existingDbUser = await withTimeout(
      prisma.user.findUnique({ where: { email: cleanEmail } }),
      1500,
      null
    );

    const isExisting = Boolean(existingLocal || existingDbUser);
    const resolvedName = (adSoyad || existingLocal?.name || existingDbUser?.name || account.name || "Müşteri").trim();
    const resolvedRole = existingLocal?.role || existingDbUser?.role || (account.type === "BAYI" ? "DEALER" : "USER");

    // 1. Yerel Kullanıcı Veritabanına Kaydet
    const savedLocal = upsertLocalUser({
      id: existingLocal?.id || existingDbUser?.id,
      name: resolvedName,
      email: cleanEmail,
      phone: account.phone || existingLocal?.phone || "",
      role: resolvedRole,
      passwordHash: hashedPassword,
      status: isActive !== false ? "active" : "passive",
      customer_type: account.type === "BAYI" ? "b2b" : "b2c",
      isApproved: isActive !== false
    });

    // 2. Uzak Prisma Veritabanına Kaydet
    let userId = savedLocal.id;
    try {
      const dbUser = await withTimeout(
        prisma.user.upsert({
          where: { email: cleanEmail },
          update: {
            name: resolvedName,
            password: hashedPassword,
            isApproved: isActive !== false,
          },
          create: {
            name: resolvedName,
            email: cleanEmail,
            password: hashedPassword,
            role: resolvedRole,
            isApproved: isActive !== false,
            customer_type: account.type === "BAYI" ? "b2b" : "b2c"
          },
          select: { id: true, name: true, email: true, isApproved: true },
        }),
        2500,
        null
      );
      if (dbUser?.id) userId = dbUser.id;
    } catch (dbErr) {
      console.warn("[B2B USER DB SYNC WARN]:", dbErr);
    }

    // 3. Cari hesaba kullanıcı bilgilerini kaydet (Yerel + Uzak)
    const currentMapping = (account.entegrasyonHaritalama as Record<string, string>) || {};
    const updatedMapping = {
      ...currentMapping,
      b2bUserId: userId,
      b2bEmail: cleanEmail,
      b2bAdSoyad: resolvedName,
      b2bPassword: cleanPass,
      b2bIsActive: String(isActive !== false),
      b2bCreatedAt: currentMapping.b2bCreatedAt || new Date().toISOString(),
    };

    updateLocalAccount(account.id, {
      email: cleanEmail,
      entegrasyonHaritalama: updatedMapping
    });

    try {
      await withTimeout(
        prisma.currentAccount.update({
          where: { id: account.id },
          data: {
            email: cleanEmail,
            entegrasyonHaritalama: updatedMapping,
          },
        }),
        1500,
        null
      );
    } catch {}

    return NextResponse.json({
      success: true,
      message: isExisting
        ? `Portal kullanıcısı ve şifresi güncellenerek veritabanına kaydedildi: ${cleanEmail}`
        : `Portal kullanıcısı ve şifresi oluşturularak veritabanına kaydedildi: ${cleanEmail}`,
      user: {
        id: userId,
        name: resolvedName,
        email: cleanEmail,
        isActive: isActive !== false,
      },
      isNew: !isExisting,
    });
  } catch (error: any) {
    console.error("B2B user API error:", error);
    return NextResponse.json(
      { error: error.message || "B2B kullanıcısı oluşturulamadı." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    let account: any = await withTimeout(
      prisma.currentAccount.findUnique({
        where: { id: accountId },
        select: { email: true, entegrasyonHaritalama: true },
      }),
      1500,
      null
    );

    if (!account) {
      const localAccounts = readLocalAccounts();
      account = localAccounts.find(a => a.id === accountId || a.cariKod === accountId) || null;
    }

    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı." }, { status: 404 });
    }

    const mapping = (account.entegrasyonHaritalama as Record<string, string>) || {};
    const b2bEmail = (mapping.b2bEmail || account.email || "").trim().toLowerCase();

    if (!b2bEmail) {
      return NextResponse.json({ exists: false });
    }

    const localUser = findLocalUser({ email: b2bEmail });
    const dbUser = await withTimeout(
      prisma.user.findUnique({
        where: { email: b2bEmail },
        select: { id: true, name: true, email: true, isApproved: true },
      }),
      1500,
      null
    );

    const resolvedUser = dbUser || (localUser ? {
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      isApproved: localUser.status === "active"
    } : null);

    return NextResponse.json({
      exists: !!resolvedUser,
      user: resolvedUser,
      b2bData: {
        adSoyad: mapping.b2bAdSoyad || resolvedUser?.name || "",
        email: b2bEmail,
        isActive: mapping.b2bIsActive !== "false",
        createdAt: mapping.b2bCreatedAt || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
