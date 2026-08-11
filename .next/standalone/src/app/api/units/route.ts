import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Default units fallback list for Pekefe products
const DEFAULT_UNITS = ["Kavanoz", "Adet", "Kg", "Paket", "Kutu", "Teneke"];

export async function GET() {
  try {
    // Attempt to fetch custom units from ProductUnit model
    const dbUnits = await prisma.productUnit.findMany({
      select: { name: true },
      distinct: ["name"]
    });

    const customUnitNames = dbUnits.map(u => u.name).filter(Boolean);
    const allUnits = Array.from(new Set([...DEFAULT_UNITS, ...customUnitNames]));

    return NextResponse.json({ success: true, units: allUnits });
  } catch (error) {
    console.error("Error fetching units:", error);
    // Fallback to default units if DB query fails
    return NextResponse.json({ success: true, units: DEFAULT_UNITS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Geçerli bir birim adı giriniz." }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if unit exists in ProductUnit or fallback list
    const existing = await prisma.productUnit.findFirst({
      where: { name: trimmedName }
    });

    if (!existing) {
      // Find any product to attach to or create dummy ProductUnit record
      const firstProduct = await prisma.product.findFirst();
      if (firstProduct) {
        await prisma.productUnit.create({
          data: {
            productId: firstProduct.id,
            name: trimmedName,
            factor: 1,
            isDefault: false
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Birim başarıyla eklendi.", unit: trimmedName });
  } catch (error) {
    console.error("Error adding unit:", error);
    return NextResponse.json({ error: "Birim eklenirken sunucu hatası oluştu." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "Silinecek birim adı belirtilmedi." }, { status: 400 });
    }

    await prisma.productUnit.deleteMany({
      where: { name }
    });

    return NextResponse.json({ success: true, message: "Birim veritabanından silindi." });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json({ error: "Birim silinirken sunucu hatası oluştu." }, { status: 500 });
  }
}
