import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTimeout } from '@/lib/prisma';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import fs from 'fs';
import path from 'path';

const ValidateSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().min(0)
});

const CAMPAIGNS_FILE = path.join(process.cwd(), 'data', 'campaigns.json');

function getLocalCampaigns(): any[] {
  try {
    if (fs.existsSync(CAMPAIGNS_FILE)) {
      const content = fs.readFileSync(CAMPAIGNS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading local campaigns in coupon validator:', err);
  }
  // If no file exists, return the default 2 verified active campaigns from admin panel
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
      startDate: "2026-01-01",
      endDate: "2030-12-31",
      isActive: true,
      target: "all"
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
      startDate: "2026-01-01",
      endDate: "2030-12-31",
      isActive: true,
      target: "all"
    }
  ];
}

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
    const upperCode = code.toUpperCase().trim();

    // 2. Fetch Session & User Role
    let isB2B = false;
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const accountPromise = prisma.currentAccount.findFirst({
          where: { email: session.user.email }
        });
        const account = await withTimeout(accountPromise, 1000, null);
        if (account && (account.type === "Bayi" || account.dealerGroup !== "Standart")) {
          isB2B = true;
        }
      }
    } catch (authErr) {
      console.warn("Session check in coupon validation skipped:", authErr);
    }

    // 3. Query Prisma Coupon Table (with timeout)
    let foundCoupon: any = null;
    try {
      const couponPromise = prisma.coupon.findUnique({
        where: { code: upperCode }
      });
      foundCoupon = await withTimeout(couponPromise, 1000, null);
    } catch (err) {
      console.warn("Prisma coupon query timed out/failed:", err);
    }

    if (foundCoupon) {
      if (!foundCoupon.isActive) {
        return NextResponse.json({ error: "Bu kupon artık aktif değil." }, { status: 400 });
      }

      if (foundCoupon.expiresAt && new Date() > new Date(foundCoupon.expiresAt)) {
        return NextResponse.json({ error: "Kuponun süresi dolmuş." }, { status: 400 });
      }

      if (foundCoupon.maxUses && foundCoupon.uses >= foundCoupon.maxUses) {
        return NextResponse.json({ error: "Kupon kullanım sınırına ulaştı." }, { status: 400 });
      }

      if (cartTotal < (foundCoupon.minCartAmount || 0)) {
        return NextResponse.json({ error: `Bu kuponu kullanmak için sepet tutarı en az ${foundCoupon.minCartAmount}₺ olmalıdır.` }, { status: 400 });
      }

      if (isB2B) {
        return NextResponse.json({ error: "Kupon kodları bayiler için geçerli değildir." }, { status: 400 });
      }

      let discountAmount = 0;
      if (foundCoupon.discountType === "PERCENTAGE") {
        discountAmount = (cartTotal * foundCoupon.discountValue) / 100;
      } else {
        discountAmount = foundCoupon.discountValue;
      }

      return NextResponse.json({
        success: true,
        discountAmount: Math.min(discountAmount, cartTotal),
        coupon: {
          code: foundCoupon.code,
          type: foundCoupon.discountType === "PERCENTAGE" ? "percentage" : "fixed",
          value: foundCoupon.discountValue
        }
      });
    }

    // 4. Query Prisma Campaign Table (with timeout)
    let foundCampaign: any = null;
    try {
      const campaignPromise = prisma.campaign.findUnique({
        where: { code: upperCode }
      });
      foundCampaign = await withTimeout(campaignPromise, 1000, null);
    } catch (err) {
      console.warn("Prisma campaign query timed out/failed:", err);
    }

    // 5. If not in DB, fallback to Local JSON & Default Built-in Codes
    if (!foundCampaign) {
      const localCampaigns = getLocalCampaigns();
      foundCampaign = localCampaigns.find(c => c.code && c.code.toUpperCase() === upperCode);
    }

    if (!foundCampaign) {
      return NextResponse.json({ error: "Geçersiz indirim kuponu kodu." }, { status: 404 });
    }

    // Validation for Campaigns
    if (!foundCampaign.isActive) {
      return NextResponse.json({ error: "Bu kampanya kodu şu an aktif değil." }, { status: 400 });
    }

    // Date Range Checks
    const nowStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    if (foundCampaign.startDate && nowStr < foundCampaign.startDate) {
      return NextResponse.json({ error: "Bu kampanya henüz başlamadı." }, { status: 400 });
    }
    if (foundCampaign.endDate && nowStr > foundCampaign.endDate) {
      return NextResponse.json({ error: "Bu kampanyanın kullanım süresi dolmuş." }, { status: 400 });
    }

    // Usage Checks
    if (foundCampaign.maxUses && foundCampaign.usedCount && foundCampaign.usedCount >= foundCampaign.maxUses) {
      return NextResponse.json({ error: "Bu kampanya kodu maksimum kullanım limitine ulaştı." }, { status: 400 });
    }

    const minOrderRequired = Number(foundCampaign.minOrder || 0);
    if (cartTotal < minOrderRequired) {
      return NextResponse.json({ error: `Bu kampanya için minimum sepet tutarı ${minOrderRequired.toLocaleString("tr-TR")}₺ olmalıdır.` }, { status: 400 });
    }

    // Target Audience Checks
    if (foundCampaign.target === "b2b" && !isB2B) {
      return NextResponse.json({ error: "Bu kampanya kodu sadece toptan bayilerimize (B2B) özeldir." }, { status: 400 });
    }
    if (foundCampaign.target === "b2c" && isB2B) {
      return NextResponse.json({ error: "Bu kampanya kodu sadece perakende müşterilerimize (B2C) özeldir." }, { status: 400 });
    }

    // Calculate discount value
    let discountAmount = 0;
    const campaignVal = Number(foundCampaign.value || 0);
    if (foundCampaign.type === "percentage") {
      discountAmount = (cartTotal * campaignVal) / 100;
    } else if (foundCampaign.type === "fixed") {
      discountAmount = campaignVal;
    } else if (foundCampaign.type === "free_shipping") {
      discountAmount = 150; // Free shipping subsidy
    }

    return NextResponse.json({
      success: true,
      discountAmount: Math.min(discountAmount, cartTotal),
      coupon: {
        code: foundCampaign.code,
        name: foundCampaign.name,
        type: foundCampaign.type,
        value: foundCampaign.value
      }
    });

  } catch (error: any) {
    console.error('Coupon/Campaign Validate Error:', error);
    return NextResponse.json({ error: 'Kod doğrulanırken bir hata oluştu.' }, { status: 500 });
  }
}
