import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let email = searchParams.get('email');

  // Fallback to NextAuth session
  if (!email) {
    const session = await getServerSession(authOptions);
    email = session?.user?.email || null;
  }

  // Get CMS discount settings
  let discountSettings = {
    cartDiscountType: "none",
    cartDiscountValue: 0,
    cartDiscountMinAmount: 0,
    bankTransferDiscountRate: 0
  };

  try {
    const cmsSettings = await prisma.cMSData.findUnique({ where: { id: 'singleton' } });
    if (cmsSettings) {
      discountSettings = {
        cartDiscountType: cmsSettings.cartDiscountType || "none",
        cartDiscountValue: cmsSettings.cartDiscountValue || 0,
        cartDiscountMinAmount: cmsSettings.cartDiscountMinAmount || 0,
        bankTransferDiscountRate: cmsSettings.bankTransferDiscountRate || 0
      };
    }
  } catch (err) {
    console.error('Error fetching CMS discount settings in initiate:', err);
  }

  // If there's no email, it means user is checking out as a guest or is not logged in.
  if (!email) {
    return NextResponse.json({ 
      requires_address: true, 
      addresses: [],
      discountSettings,
      message: 'Lütfen adres bilgilerinizi giriniz.' 
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' }
        }
      }
    });

    if (!user || !user.addresses || user.addresses.length === 0) {
      return NextResponse.json({ 
        requires_address: true, 
        addresses: [],
        discountSettings
      });
    }

    return NextResponse.json({ 
      requires_address: false, 
      addresses: user.addresses,
      discountSettings
    });
  } catch (error) {
    console.error('Error in checkout initiate:', error);
    return NextResponse.json({ error: 'Ödeme adımları başlatılırken hata oluştu.' }, { status: 500 });
  }
}

