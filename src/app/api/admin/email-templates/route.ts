import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

// GET all email templates (Admin Only)
export const GET = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const templates = await prisma.emailTemplate.findMany({
        orderBy: { eventType: 'asc' }
      });
      return NextResponse.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// POST create a new email template (Admin Only)
export const POST = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { eventType, name, subject, bodyHtml, variables, status } = body;

      if (!eventType || !name || !subject || !bodyHtml) {
        return NextResponse.json({ error: 'Eksik parametre girdiniz.' }, { status: 400 });
      }

      // Check if duplicate eventType
      const existing = await prisma.emailTemplate.findUnique({
        where: { eventType }
      });

      if (existing) {
        return NextResponse.json({ error: 'Bu olay tipi (Event Type) ile kayıtlı bir şablon zaten mevcut.' }, { status: 400 });
      }

      const template = await prisma.emailTemplate.create({
        data: {
          eventType,
          name,
          subject,
          bodyHtml,
          variables: variables || '',
          status: status || 'ACTIVE'
        }
      });

      return NextResponse.json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
