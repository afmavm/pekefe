import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';

const BranchUpdateSchema = z.object({
  name: z.string().min(2, "Şube adı en az 2 karakter olmalıdır").optional(),
  code: z.string().min(2, "Şube kodu gereklidir").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const result = BranchUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const data = result.data;

    // Check if branch exists
    const existingBranch = await prisma.branch.findUnique({
      where: { id }
    });
    if (!existingBranch) {
      return NextResponse.json({ error: 'Şube bulunamadı.' }, { status: 404 });
    }

    // Check duplicate code if updated
    if (data.code && data.code.toUpperCase() !== existingBranch.code) {
      const duplicate = await prisma.branch.findUnique({
        where: { code: data.code.toUpperCase() }
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Bu Şube Kodu başka bir şube tarafından kullanılıyor.' }, { status: 400 });
      }
    }

    const updatedData: any = { ...data };
    if (data.code) updatedData.code = data.code.toUpperCase();

    const branch = await prisma.branch.update({
      where: { id },
      data: updatedData
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id }
    });
    if (!branch) {
      return NextResponse.json({ error: 'Şube bulunamadı.' }, { status: 404 });
    }

    // Check if it's the only branch left
    const branchCount = await prisma.branch.count();
    if (branchCount <= 1) {
      return NextResponse.json({ error: 'Sistemde en az bir şube bulunmalıdır.' }, { status: 400 });
    }

    await prisma.branch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
