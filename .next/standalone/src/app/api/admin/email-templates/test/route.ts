import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { withAuth } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

// POST send a test email (Admin Only)
export const POST = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { eventType, recipient } = body;

      if (!eventType || !recipient) {
        return NextResponse.json({ error: 'Eksik parametre girdiniz.' }, { status: 400 });
      }

      await emailService.sendTestEmail(eventType, recipient);

      return NextResponse.json({ success: true, message: `Test e-postası '${eventType}' olayı için kuyruğa eklendi.` });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      return NextResponse.json({ error: error.message || 'Test e-postası gönderilemedi.' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
