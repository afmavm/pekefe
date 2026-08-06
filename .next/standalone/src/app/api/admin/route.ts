import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

// Sistem İstatistikleri ve Güvenlik Denetim Logları (Sadece Admin)
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      // Toplam kullanıcı sayısı, onay bekleyen kullanıcılar
      const totalUsers = await prisma.user.count();
      const pendingUsers = await prisma.user.count({ where: { isApproved: false, role: 'USER' } });
      const totalDealers = await prisma.currentAccount.count();

      // En son başarısız giriş/yetkilendirme denemeleri
      const recentAuthFailures = await prisma.authLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({
        stats: {
          totalUsers,
          pendingUsers,
          totalDealers,
        },
        recentAuthFailures,
      });
    } catch (error) {
      console.error('Error fetching admin system dashboard data:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Güvenlik Denetim Loglarını Temizleme (Sadece Admin)
export const DELETE = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      await prisma.authLog.deleteMany();
      return NextResponse.json({ success: true, message: 'Tüm güvenlik denetim logları temizlendi.' });
    } catch (error) {
      console.error('Error clearing auth logs:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
