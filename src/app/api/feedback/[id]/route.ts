import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reply } = body;

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Geri bildirim bulunamadı' }, { status: 404 });
    }

    const updated = await prisma.feedback.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        reply: reply !== undefined ? reply : existing.reply,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    // Check if feedback exists
    const existing = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Geri bildirim bulunamadı' }, { status: 404 });
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Geri bildirim başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
