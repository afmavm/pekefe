import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession, requireOwnership } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { readLocalOrders } from '@/lib/jsonOrderDb';
import bcrypt from 'bcryptjs';

// Kullanıcı Kendi Bilgilerini Getirir
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      // Güvenlik: userId query param'a bakmak yerine her zaman session.user.id kullan
      const targetUserId = session.user.id;

      // requireOwnership kontrolü: Ya admin ya da targetUserId sahibi
      const ownership = await requireOwnership(req, targetUserId);
      if (!ownership.ok) return ownership.response;

      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          image: true,
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      }

      // Bağlı olduğu cari hesabı bulalım
      const currentAccount = await prisma.currentAccount.findFirst({
        where: { email: user.email || "" }
      });

      // Siparişlerden kazanılan sadakat puanlarını hesapla (1 TL = 1 PTS)
      const localOrders = readLocalOrders();
      const userEmail = (user.email || "").toLowerCase();
      const userName = (user.name || "").toLowerCase();
      const userOrders = localOrders.filter(
        (o) => (o.email && o.email.toLowerCase() === userEmail) ||
               (o.client && o.client.toLowerCase() === userName) ||
               (o.customerName && o.customerName.toLowerCase() === userName)
      );
      const ordersPoints = userOrders.reduce((sum, o) => sum + Math.floor(Number(o.total || o.amount || 0)), 0);

      const calculatedLoyaltyPoints = Math.max(
        Number(currentAccount?.loyaltyPoints || 0),
        ordersPoints
      );

      const accountData = currentAccount
        ? { ...currentAccount, loyaltyPoints: calculatedLoyaltyPoints }
        : {
            id: `CARI-${targetUserId}`,
            name: user.name || "Pekefe Müşterisi",
            email: user.email,
            loyaltyPoints: calculatedLoyaltyPoints
          };

      return NextResponse.json({ user, currentAccount: accountData });
    } catch (error) {
      console.warn('[API USER WARNING] DB erişimi yok, yerel sipariş motorundan puan hesaplanıyor:', error);
      
      const localOrders = readLocalOrders();
      const userEmail = (session.user?.email || "").toLowerCase();
      const userName = (session.user?.name || "").toLowerCase();
      const userOrders = localOrders.filter(
        (o) => (o.email && o.email.toLowerCase() === userEmail) ||
               (o.client && o.client.toLowerCase() === userName) ||
               (o.customerName && o.customerName.toLowerCase() === userName)
      );
      const ordersPoints = userOrders.reduce((sum, o) => sum + Math.floor(Number(o.total || o.amount || 0)), 0);

      return NextResponse.json({
        user: {
          id: session.user?.id || "user-001",
          name: session.user?.name || "Muhammed AKÇELİK",
          email: session.user?.email || "afmavm@gmail.com",
          role: session.user?.role || "USER",
          isApproved: true,
          image: session.user?.image || ""
        },
        currentAccount: {
          id: "CARI-001",
          name: session.user?.name || "Muhammed AKÇELİK",
          email: session.user?.email || "afmavm@gmail.com",
          loyaltyPoints: ordersPoints
        }
      });
    }
  },
  { requireApproved: true }
);

// Kullanıcı Kendi Profilini Günceller
export const PATCH = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { name, password, image, phone } = body;

      // Güvenlik: body.userId'yi yok say, her zaman session.user.id kullan
      const targetUserId = session.user.id;

      // Sadece admin veya ilgili kullanıcının kendisi güncelleyebilir
      const ownership = await requireOwnership(req, targetUserId);
      if (!ownership.ok) return ownership.response;

      const existingUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });

      if (!existingUser) {
        return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (image) updateData.image = image;
      if (password) {
        if (password.length < 6) {
          return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 });
        }

        const currentPassword = body.currentPassword;
        if (!currentPassword) {
          return NextResponse.json({ error: 'Mevcut şifrenizi girmelisiniz.' }, { status: 400 });
        }

        if (existingUser.password) {
          const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
          if (!isMatch) {
            return NextResponse.json({ error: 'Mevcut şifreniz yanlış.' }, { status: 400 });
          }
        }

        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          image: true
        }
      });

      // Cari hesabını da güncelle (Varsa)
      if (existingUser.email) {
        const currentAccount = await prisma.currentAccount.findFirst({
          where: { email: existingUser.email }
        });

        if (currentAccount) {
          const accountUpdateData: any = {};
          if (name) {
            accountUpdateData.name = name;
            const nameParts = name.trim().split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";
            accountUpdateData.ad = firstName;
            accountUpdateData.soyad = lastName;
            accountUpdateData.yetkiliKisi = name;
          }
          if (phone !== undefined) {
            accountUpdateData.phone = phone || null;
          }

          await prisma.currentAccount.update({
            where: { id: currentAccount.id },
            data: accountUpdateData
          });
        }
      }

      return NextResponse.json(updatedUser);
    } catch (error) {
      console.error('Error updating user data:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { requireApproved: true }
);
