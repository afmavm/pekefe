import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthSession } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

const DealerSchema = z.object({
  name: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
  type: z.string().optional().default("Müşteri"),
  taxId: z.string().min(10, "Vergi/TC no en az 10 haneli olmalıdır").max(11),
  taxOffice: z.string().min(2, "Vergi dairesi gereklidir"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  balance: z.coerce.number().optional().default(0),
  dealerGroup: z.string().optional().default("Standart"),
  priceGroup: z.string().optional().default("Liste"),
  riskLimit: z.coerce.number().optional().default(0),
  creditLimit: z.coerce.number().optional().default(0),
  discountRate: z.coerce.number().optional(),
  loyaltyPoints: z.coerce.number().optional().default(0),
  b2bMinQty: z.coerce.number().optional().default(1),
  b2bPaymentTerms: z.string().optional().default("Nakit"),
  b2bCode: z.string().optional(),
});

// Bayileri Listeleme (Sadece Admin)
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const accounts = await prisma.currentAccount.findMany({
        include: {
          subAccounts: true,
          transactions: true,
          orders: true
        }
      });

      const accountsWithApproval = await Promise.all(accounts.map(async (account) => {
        if (!account.email) return { ...account, isApproved: true };
        
        const user = await prisma.user.findUnique({
          where: { email: account.email }
        });
        
        return {
          ...account,
          isApproved: user?.isApproved ?? false
        };
      }));

      return NextResponse.json(accountsWithApproval, { headers: NO_CACHE_HEADERS });
    } catch (error) {
      console.error('Error fetching dealers:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Yeni Cari Hesap Oluşturma (Sadece Admin)
export const POST = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      
      const result = DealerSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
      }

      const data = result.data;

      const account = await prisma.currentAccount.create({
        data: {
          name: data.name,
          type: data.type,
          taxId: data.taxId,
          taxOffice: data.taxOffice,
          phone: data.phone,
          email: data.email,
          balance: data.balance,
          dealerGroup: data.dealerGroup,
          priceGroup: data.priceGroup,
          riskLimit: data.riskLimit,
          creditLimit: data.creditLimit,
          discountRate: data.discountRate,
          loyaltyPoints: data.loyaltyPoints,
          b2bMinQty: data.b2bMinQty,
          b2bPaymentTerms: data.b2bPaymentTerms,
          b2bCode: data.b2bCode,
        }
      });
      return NextResponse.json(account);
    } catch (error) {
      console.error('Error creating dealer:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);

// Cari Hesap Güncelleme (Sadece Admin)
export const PATCH = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const { id, ...data } = body;

      if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      }

      const updated = await prisma.currentAccount.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          taxId: data.taxId,
          taxOffice: data.taxOffice,
          phone: data.phone,
          email: data.email,
          balance: data.balance,
          dealerGroup: data.dealerGroup,
          priceGroup: data.priceGroup,
          riskLimit: data.riskLimit,
          creditLimit: data.creditLimit,
          discountRate: data.discountRate,
          loyaltyPoints: data.loyaltyPoints,
          vadeGun: data.vadeGun,
          priceFormula: data.priceFormula,
          b2bMinQty: data.b2bMinQty,
          b2bPaymentTerms: data.b2bPaymentTerms,
          b2bCode: data.b2bCode,
        }
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating dealer:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
