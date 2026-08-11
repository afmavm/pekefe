import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const BranchSchema = z.object({
  name: z.string().min(2, "Şube adı en az 2 karakter olmalıdır"),
  code: z.string().min(2, "Şube kodu gereklidir"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const branches = await prisma.branch.findMany({
      include: {
        warehouses: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    
    const result = BranchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Prevent duplicate Code
    const existing = await prisma.branch.findUnique({
      where: { code: data.code.toUpperCase() }
    });
    if (existing) {
      return NextResponse.json({ error: 'Bu Şube Kodu zaten kullanımda.' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address,
        phone: data.phone,
      }
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
