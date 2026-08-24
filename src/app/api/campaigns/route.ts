import { NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const CAMPAIGNS_FILE = path.join(process.cwd(), 'data', 'campaigns.json');

function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getLocalCampaigns(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CAMPAIGNS_FILE)) {
      const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local campaigns:', err);
  }
  return [
    {
      id: "camp-pef-15",
      name: "%15 Genel Açılış İndirimi",
      code: "PEKEFE15",
      type: "percentage",
      value: 15,
      minOrder: 500,
      maxUses: 1000,
      usedCount: 14,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 84600 * 1000).toISOString().split('T')[0],
      isActive: true,
      target: "all",
      description: "Tüm İspir bal, dut pekmezi ve yöresel ürün siparişlerinde geçerli %15 genel açılış indirimi."
    },
    {
      id: "camp-kargo-2000",
      name: "2000 TL Üzeri Ücretsiz Kargo",
      code: "BEDAVAKARGO",
      type: "free_shipping",
      value: 0,
      minOrder: 2000,
      maxUses: 2000,
      usedCount: 42,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 84600 * 1000).toISOString().split('T')[0],
      isActive: true,
      target: "all",
      description: "2000 TL ve üzerindeki tüm siparişlerde kargo bedeli sistem tarafından karşılanır."
    }
  ];
}

function saveLocalCampaigns(campaigns: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local campaigns:', err);
  }
}

export async function GET() {
  try {
    const campaignsPromise = prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const campaigns = await withTimeout(campaignsPromise, 1500, null);

    if (campaigns && Array.isArray(campaigns) && campaigns.length > 0) {
      saveLocalCampaigns(campaigns);
      return NextResponse.json(campaigns);
    }
    return NextResponse.json(getLocalCampaigns());
  } catch (error) {
    console.error('Error fetching campaigns, using fallback:', error);
    return NextResponse.json(getLocalCampaigns());
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.code || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: 'Ad, kod, başlangıç ve bitiş tarihi zorunludur.' }, { status: 400 });
    }

    const newCampaign = {
      id: body.id || `camp-${Date.now()}`,
      name: body.name,
      code: (body.code as string).toUpperCase().replace(/\s+/g, ""),
      type: body.type || 'percentage',
      value: Number(body.value) || 0,
      minOrder: Number(body.minOrder) || 0,
      maxUses: Number(body.maxUses) || 100,
      usedCount: 0,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      target: body.target || 'all',
      description: body.description || ''
    };

    // Try save to Prisma
    try {
      const createdPromise = prisma.campaign.create({
        data: {
          name: newCampaign.name,
          code: newCampaign.code,
          type: newCampaign.type,
          value: newCampaign.value,
          minOrder: newCampaign.minOrder,
          maxUses: newCampaign.maxUses,
          startDate: newCampaign.startDate,
          endDate: newCampaign.endDate,
          isActive: newCampaign.isActive,
          target: newCampaign.target,
          description: newCampaign.description
        }
      });
      const dbCampaign = await withTimeout(createdPromise, 1500, null);
      if (dbCampaign) {
        const local = getLocalCampaigns();
        saveLocalCampaigns([dbCampaign, ...local.filter(c => c.id !== dbCampaign.id && c.code !== dbCampaign.code)]);
        return NextResponse.json(dbCampaign);
      }
    } catch (dbErr: any) {
      console.warn('Prisma create campaign failed, falling back to JSON:', dbErr?.message);
    }

    // Save to local JSON
    const local = getLocalCampaigns();
    if (local.some(c => c.code === newCampaign.code)) {
      return NextResponse.json({ error: 'Bu kupon kodu zaten kullanımda. Farklı bir kod deneyin.' }, { status: 400 });
    }
    const updatedLocal = [newCampaign, ...local];
    saveLocalCampaigns(updatedLocal);

    return NextResponse.json(newCampaign);
  } catch (error: any) {
    console.error('Error creating campaign:', error);
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
    if (data.code !== undefined) updateData.code = (data.code as string).toUpperCase().replace(/\s+/g, "");
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = Number(data.value);
    if (data.minOrder !== undefined) updateData.minOrder = Number(data.minOrder);
    if (data.maxUses !== undefined) updateData.maxUses = Number(data.maxUses);
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.target !== undefined) updateData.target = data.target;
    if (data.description !== undefined) updateData.description = data.description;

    try {
      const updatePromise = prisma.campaign.update({
        where: { id },
        data: updateData
      });
      const dbUpdated = await withTimeout(updatePromise, 1500, null);
      if (dbUpdated) {
        const local = getLocalCampaigns();
        saveLocalCampaigns(local.map(c => c.id === id ? { ...c, ...dbUpdated } : c));
        return NextResponse.json(dbUpdated);
      }
    } catch (dbErr: any) {
      console.warn('Prisma update campaign failed, falling back to JSON:', dbErr?.message);
    }

    const local = getLocalCampaigns();
    let found = false;
    const updatedLocal = local.map(c => {
      if (c.id === id || c.code === updateData.code) {
        found = true;
        return { ...c, ...updateData };
      }
      return c;
    });

    if (found) {
      saveLocalCampaigns(updatedLocal);
      const resItem = updatedLocal.find(c => c.id === id || c.code === updateData.code);
      return NextResponse.json(resItem);
    }

    return NextResponse.json({ error: 'Kampanya bulunamadı.' }, { status: 404 });
  } catch (error: any) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Güncelleme başarısız: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    try {
      const deletePromise = prisma.campaign.delete({ where: { id } });
      await withTimeout(deletePromise, 1500, null);
    } catch (dbErr: any) {
      console.warn('Prisma delete campaign failed, falling back to JSON:', dbErr?.message);
    }

    const local = getLocalCampaigns();
    saveLocalCampaigns(local.filter(c => c.id !== id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Silme başarısız: ' + error.message }, { status: 500 });
  }
}
