import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthSession } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/rate-limit";

// Unified search across Orders, Products, and Dealers (CurrentAccount)
export const GET = withAuth<any>(
  async (req: NextRequest, { session }: { session: AuthSession }) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get("q") || "";

      if (!query || query.length < 2) {
        return NextResponse.json({ orders: [], products: [], dealers: [] });
      }

      const [orders, products, dealers] = await Promise.all([
        prisma.order.findMany({
          where: {
            OR: [
              { id: { contains: query } },
              { currentAccount: { name: { contains: query } } },
            ],
            isDeleted: false,
          },
          take: 5,
          include: {
            currentAccount: { select: { name: true } },
          },
        }),
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { sku: { contains: query } },
            ],
            isDeleted: false,
          },
          take: 5,
        }),
        prisma.currentAccount.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { taxNo: { contains: query } },
            ],
            isDeleted: false,
          },
          take: 5,
        }),
      ]);

      return NextResponse.json({ orders, products, dealers });
    } catch (error) {
      console.error("Error searching admin data:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  },
  { role: "ADMIN", requireApproved: true }
);
