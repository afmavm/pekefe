import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const FeedbackSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz").optional().or(z.literal("")),
  rating: z.number().min(1, "Puan en az 1 olmalıdır").max(5, "Puan en fazla 5 olmalıdır"),
  message: z.string().min(5, "Mesajınız en az 5 karakter olmalıdır"),
  productSlug: z.string().max(160).optional(),
  productName: z.string().max(200).optional(),
});

const PRODUCT_TAG_REGEX = /^\[product:([a-z0-9-]+)\]\s*/i;

function parseFeedbackRow(row: any) {
  const rawMessage = String(row.message || "");
  const match = rawMessage.match(PRODUCT_TAG_REGEX);
  return {
    ...row,
    productSlug: match ? match[1].toLowerCase() : null,
    cleanMessage: match ? rawMessage.replace(PRODUCT_TAG_REGEX, "").trim() : rawMessage,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    const productSlug = (searchParams.get('productSlug') || '').trim().toLowerCase();

    if (isPublic) {
      // Public view returns only approved reviews
      const feedbacks = await prisma.feedback.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      });
      const parsed = feedbacks.map(parseFeedbackRow);
      if (productSlug) {
        const productSpecific = parsed.filter((f) => f.productSlug === productSlug);
        const general = parsed.filter((f) => !f.productSlug);
        const combined = productSpecific.length > 0 ? productSpecific : general;
        return NextResponse.json(
          combined.map(({ email, ...safe }) => ({
            ...safe,
            message: safe.cleanMessage,
          }))
        );
      }
      return NextResponse.json(
        parsed.map(({ email, ...safe }) => ({
          ...safe,
          message: safe.cleanMessage,
        }))
      );
    }

    // Admin view
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = FeedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, email, rating, message, productSlug } = result.data;
    const cleanSlug = productSlug
      ? productSlug.toLowerCase().replace(/[^a-z0-9-]/g, '')
      : '';
    const storedMessage = cleanSlug ? `[product:${cleanSlug}] ${message.trim()}` : message.trim();

    const feedback = await prisma.feedback.create({
      data: {
        name: name.trim(),
        email: email && email.trim() ? email.trim() : 'musteri@pekefe.com',
        rating: Math.round(rating),
        message: storedMessage,
        status: 'PENDING',
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
