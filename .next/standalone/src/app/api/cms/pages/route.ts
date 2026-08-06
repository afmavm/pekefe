import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Herkes sayfaları listeleyebilir (Vitrin için gerekli olabilir)
export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, "apiLimit");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const pages = await prisma.cMSPage.findMany();
    const formattedPages = pages.map(page => ({
      ...page,
      sections: page.sections as any
    }));
    return NextResponse.json(formattedPages);
  } catch (error) {
    console.error('Error fetching CMS pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Sayfa oluştur (Sadece Admin)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const sectionsData = typeof body.sections === 'string' 
        ? body.sections 
        : JSON.stringify(body.sections || []);

      const page = await prisma.cMSPage.create({
        data: {
          name: body.name,
          slug: body.slug,
          status: body.status,
          sections: sectionsData
        }
      });
      return NextResponse.json(page);
    } catch (error) {
      console.error('Error creating CMS page:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Sayfa güncelle (Sadece Admin)
export const PUT = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const sectionsData = typeof body.sections === 'string' 
        ? body.sections 
        : JSON.stringify(body.sections || []);

      const page = await prisma.cMSPage.update({
        where: { id: body.id },
        data: {
          name: body.name,
          slug: body.slug,
          status: body.status,
          sections: sectionsData
        }
      });
      return NextResponse.json(page);
    } catch (error) {
      console.error('Error updating CMS page:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Sayfa sil (Sadece Admin)
export const DELETE = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
      
      await prisma.cMSPage.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting CMS page:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
