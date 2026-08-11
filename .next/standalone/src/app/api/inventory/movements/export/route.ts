import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireERPRole } from "@/lib/auth-helpers";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const auth = await requireERPRole(request);
  if (!auth.authorized) {
    return auth.response || NextResponse.json({ error: "Yetki hatası." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const warehouseId = searchParams.get("warehouseId") || undefined;
  const type = searchParams.get("type") || undefined;
  const moduleSource = searchParams.get("moduleSource") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (type) where.type = type;
    if (moduleSource) where.moduleSource = moduleSource;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59");
    }
    if (search) {
      where.OR = [
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
        { description: { contains: search } },
      ];
    }

    // Fetch transactions (limit to 10000 to prevent OOM/crash in massive DBs)
    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true, code: true } },
      },
      orderBy: { date: "desc" },
      take: 10000,
    });

    const format = searchParams.get("format") || "excel";
    if (format === "json") {
      return NextResponse.json({ success: true, transactions });
    }

    const exportRows = transactions.map((tx: any) => {
      const d = new Date(tx.date);
      const dateStr = `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR")}`;
      
      // Map Type Label in Turkish
      let typeLabel = tx.type;
      if (tx.type === "IN") typeLabel = "Giriş";
      else if (tx.type === "TRANSFER_IN") typeLabel = "Transfer Giriş";
      else if (tx.type === "CYCLE_SURPLUS") typeLabel = "Sayım Fazlası";
      else if (tx.type === "OUT") typeLabel = "Çıkış";
      else if (tx.type === "TRANSFER_OUT") typeLabel = "Transfer Çıkış";
      else if (tx.type === "CYCLE_DEFICIT") typeLabel = "Sayım Eksiği";
      else if (tx.type === "SALE") typeLabel = "Satış";
      else if (tx.type === "RETURN") typeLabel = "İade";

      // Map Source Label in Turkish
      let sourceLabel = tx.moduleSource || "";
      if (tx.moduleSource === "MANUAL") sourceLabel = "Manuel";
      else if (tx.moduleSource === "MARKETPLACE") sourceLabel = "Marketplace";
      else if (tx.moduleSource === "TRANSFER") sourceLabel = "Transfer";
      else if (tx.moduleSource === "CYCLE_COUNT") sourceLabel = "Sayım";

      return {
        "Tarih/Saat": dateStr,
        "Ürün Adı": tx.product?.name || "",
        "SKU": tx.product?.sku || "",
        "İşlem Türü": typeLabel,
        "Miktar": tx.quantity || 0,
        "Depo": tx.warehouse?.name || "",
        "Depo Kodu": tx.warehouse?.code || "",
        "Kaynak Modül": sourceLabel,
        "Açıklama": tx.description || "",
        "Kullanıcı": tx.userEmail || "Sistem",
      };
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(exportRows);
    
    // Auto-fit column widths
    const max_widths = Object.keys(exportRows[0] || {}).map((key) => {
      let max_len = key.length;
      exportRows.forEach((row: any) => {
        const val = row[key];
        const len = val ? String(val).length : 0;
        if (len > max_len) max_len = len;
      });
      return { wch: max_len + 3 };
    });
    ws["!cols"] = max_widths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Hareketleri");
    
    // Write spreadsheet to buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `stok_hareketleri_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error: any) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Excel dosyası oluşturulamadı." }, { status: 500 });
  }
}
