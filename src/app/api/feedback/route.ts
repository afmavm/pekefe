import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';

const FeedbackSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  rating: z.number().min(1, "Puan en az 1 olmalıdır").max(5, "Puan en fazla 5 olmalıdır"),
  message: z.string().min(5, "Mesajınız en az 5 karakter olmalıdır"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    if (isPublic) {
      // Public view returns only approved reviews
      const feedbacks = await prisma.feedback.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(feedbacks);
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

    const { name, email, rating, message } = result.data;

    const feedback = await prisma.feedback.create({
      data: {
        name,
        email,
        rating,
        message,
        status: 'PENDING',
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
