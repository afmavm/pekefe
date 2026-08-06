/**
 * POST /api/accounting/current-accounts/[id]/b2b-user
 *
 * B2B portal kullanıcısı oluştur veya güncelle.
 * - E-posta varsa: şifre ve aktiflik güncellenir
 * - E-posta yoksa: yeni User oluşturulur, cari hesaba bağlanır
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params;
    const body = await request.json();
    const { adSoyad, email, password, isActive } = body;

    if (!email) {
      return NextResponse.json({ error: "E-posta adresi zorunludur." }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    // Cari hesabı bul
    const account = await prisma.currentAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı." }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı var mı?
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existingUser) {
      // Güncelle
      user = await prisma.user.update({
        where: { email },
        data: {
          name: adSoyad || existingUser.name,
          password: hashedPassword,
          isApproved: isActive !== false,
          role: "USER",
        },
        select: { id: true, name: true, email: true, isApproved: true },
      });
    } else {
      // Yeni oluştur
      user = await prisma.user.create({
        data: {
          name: adSoyad || account.name,
          email,
          password: hashedPassword,
          role: "USER",
          isApproved: isActive !== false,
        },
        select: { id: true, name: true, email: true, isApproved: true },
      });
    }

    // Cari hesaba kullanıcı bilgilerini kaydet (entegrasyonHaritalama alanına)
    const currentMapping = (account.entegrasyonHaritalama as Record<string, string>) || {};
    await prisma.currentAccount.update({
      where: { id: accountId },
      data: {
        email: email, // Ana e-posta olarak da güncelle
        entegrasyonHaritalama: {
          ...currentMapping,
          b2bUserId: user.id,
          b2bEmail: email,
          b2bAdSoyad: adSoyad || account.name,
          b2bIsActive: String(isActive !== false),
          b2bCreatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: existingUser
        ? `B2B portal kullanıcısı güncellendi: ${email}`
        : `B2B portal kullanıcısı oluşturuldu: ${email}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isApproved,
      },
      isNew: !existingUser,
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
    const account = await prisma.currentAccount.findUnique({
      where: { id: accountId },
      select: { email: true, entegrasyonHaritalama: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Cari hesap bulunamadı." }, { status: 404 });
    }

    const mapping = (account.entegrasyonHaritalama as Record<string, string>) || {};
    const b2bEmail = mapping.b2bEmail || account.email;

    if (!b2bEmail) {
      return NextResponse.json({ exists: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: b2bEmail },
      select: { id: true, name: true, email: true, isApproved: true },
    });

    return NextResponse.json({
      exists: !!user,
      user: user || null,
      b2bData: {
        adSoyad: mapping.b2bAdSoyad || "",
        email: mapping.b2bEmail || "",
        isActive: mapping.b2bIsActive !== "false",
        createdAt: mapping.b2bCreatedAt || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
