import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

const ValidateSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().min(0)
});

export async function POST(request: NextRequest) {
  try {
    // 1. Upstash Redis Rate Limiting
    const rateLimitResponse = await withRateLimit(request, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    const rawBody = await request.json();
    const result = ValidateSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
    }

    const { code, cartTotal } = result.data;
    const upperCode = code.toUpperCase();

    // 2. Fetch Session & User Role
    const session = await getServerSession(authOptions);
    let isB2B = false;
    
    if (session?.user?.email) {
      const account = await prisma.currentAccount.findFirst({
        where: { email: session.user.email }
      });
      if (account && (account.type === "Bayi" || account.dealerGroup !== "Standart")) {
        isB2B = true;
      }
    }

    // 3. Query Coupon Table First
    const coupon = await prisma.coupon.findUnique({
      where: { code: upperCode }
    });

    if (coupon) {
      if (!coupon.isActive) {
        return NextResponse.json({ error: "Bu kupon artık aktif değil." }, { status: 400 });
      }

      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return NextResponse.json({ error: "Kuponun süresi dolmuş." }, { status: 400 });
      }

      if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
        return NextResponse.json({ error: "Kupon kullanım sınırına ulaştı." }, { status: 400 });
      }

      if (cartTotal < coupon.minCartAmount) {
        return NextResponse.json({ error: `Bu kuponu kullanmak için sepet tutarı en az ${coupon.minCartAmount}₺ olmalıdır.` }, { status: 400 });
      }

      // Default coupons are B2C only unless specified
      if (isB2B) {
        return NextResponse.json({ error: "Kupon kodları bayiler için geçerli değildir." }, { status: 400 });
      }

      let discountAmount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (cartTotal * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }

      return NextResponse.json({
        success: true,
        discountAmount: Math.min(discountAmount, cartTotal),
        coupon: {
          code: coupon.code,
          type: coupon.discountType === "PERCENTAGE" ? "percentage" : "fixed",
          value: coupon.discountValue
        }
      });
    }

    // 4. If not in Coupon table, query Campaign Table
    const campaign = await prisma.campaign.findUnique({
      where: { code: upperCode }
    });

    if (!campaign) {
      // Built-in fallback for default demo code PEKEFE10 if not present in DB
      if (upperCode === "PEKEFE10") {
        const discountAmount = (cartTotal * 10) / 100;
        return NextResponse.json({
          success: true,
          discountAmount: Math.min(discountAmount, cartTotal),
          coupon: {
            code: "PEKEFE10",
            type: "percentage",
            value: 10
          }
        });
      }
      return NextResponse.json({ error: "Kupon veya kampanya kodu bulunamadı." }, { status: 404 });
    }

    // Validation for Campaigns
    if (!campaign.isActive) {
      return NextResponse.json({ error: "Bu kampanya kodu şu an aktif değil." }, { status: 400 });
    }

    // Date Range Checks
    const nowStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    if (campaign.startDate && nowStr < campaign.startDate) {
      return NextResponse.json({ error: "Bu kampanya henüz başlamadı." }, { status: 400 });
    }
    if (campaign.endDate && nowStr > campaign.endDate) {
      return NextResponse.json({ error: "Bu kampanyanın süresi dolmuş." }, { status: 400 });
    }

    // Usage Checks
    if (campaign.maxUses && campaign.usedCount >= campaign.maxUses) {
      return NextResponse.json({ error: "Bu kampanya kodu kullanım limitine ulaştı." }, { status: 400 });
    }

    if (cartTotal < campaign.minOrder) {
      return NextResponse.json({ error: `Bu kampanya için minimum sipariş tutarı ${campaign.minOrder}₺ olmalıdır.` }, { status: 400 });
    }

    // Target Audience Checks
    if (campaign.target === "b2b" && !isB2B) {
      return NextResponse.json({ error: "Bu kampanya kodu sadece bayilerimize (B2B) özeldir." }, { status: 400 });
    }
    if (campaign.target === "b2c" && isB2B) {
      return NextResponse.json({ error: "Bu kampanya kodu sadece perakende müşterilerimize (B2C) özeldir." }, { status: 400 });
    }

    // Calculate discount value
    let discountAmount = 0;
    if (campaign.type === "percentage") {
      discountAmount = (cartTotal * campaign.value) / 100;
    } else if (campaign.type === "fixed") {
      discountAmount = campaign.value;
    } else if (campaign.type === "free_shipping") {
      discountAmount = 150; // Dynamic free shipping amount
    }

    return NextResponse.json({
      success: true,
      discountAmount: Math.min(discountAmount, cartTotal),
      coupon: {
        code: campaign.code,
        type: campaign.type,
        value: campaign.value
      }
    });

  } catch (error: any) {
    console.error('Coupon/Campaign Validate Error:', error);
    return NextResponse.json({ error: 'Kod doğrulanırken bir sistem hatası oluştu.' }, { status: 500 });
  }
}
