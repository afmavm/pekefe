import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

// PUT update email template (Admin Only)
export const PUT = withAuth<any>(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const resolvedParams = await params;
      const id = resolvedParams.id;
      const body = await req.json();
      const { name, subject, bodyHtml, variables, status } = body;

      if (!name || !subject || !bodyHtml) {
        return NextResponse.json({ error: 'Eksik parametre girdiniz.' }, { status: 400 });
      }

      // Check if template exists
      const existing = await prisma.emailTemplate.findUnique({
        where: { id }
      });

      if (!existing) {
        return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 });
      }

      const updated = await prisma.emailTemplate.update({
        where: { id },
        data: {
          name,
          subject,
          bodyHtml,
          variables: variables || '',
          status: status || 'ACTIVE'
        }
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating email template:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// DELETE email template (Admin Only)
export const DELETE = withAuth<any>(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const resolvedParams = await params;
      const id = resolvedParams.id;

      // Check if template exists
      const existing = await prisma.emailTemplate.findUnique({
        where: { id }
      });

      if (!existing) {
        return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 });
      }

      // Prevent deleting system critical templates if necessary, or just allow it
      await prisma.emailTemplate.delete({
        where: { id }
      });

      return NextResponse.json({ success: true, message: 'Şablon başarıyla silindi.' });
    } catch (error) {
      console.error('Error deleting email template:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
