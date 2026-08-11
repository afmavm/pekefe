import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        warehouseId: true,
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Kullanıcılar yüklenirken hata oluştu.' }, { status: 500 });
  }
}
