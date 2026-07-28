import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.code || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'Ad, kod, başlangıç ve bitiş tarihi zorunludur.' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        code: (body.code as string).toUpperCase(),
        type: body.type || 'percentage',
        value: Number(body.value) || 0,
        minOrder: Number(body.minOrder) || 0,
        maxUses: Number(body.maxUses) || 100,
        startDate: body.startDate,
        endDate: body.endDate,
        isActive: true,
        target: body.target || 'all',
        description: body.description || ''
      }
    });
    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Bu kupon kodu zaten kullanımda. Farklı bir kod deneyin.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Kampanya oluşturulamadı: ' + error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = (data.code as string).toUpperCase();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = Number(data.value);
    if (data.minOrder !== undefined) updateData.minOrder = Number(data.minOrder);
    if (data.maxUses !== undefined) updateData.maxUses = Number(data.maxUses);
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.target !== undefined) updateData.target = data.target;
    if (data.description !== undefined) updateData.description = data.description;

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Güncelleme başarısız: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Silme başarısız: ' + error.message }, { status: 500 });
  }
}
