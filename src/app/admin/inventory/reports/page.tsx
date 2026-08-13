import { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, ChevronRight, FileBarChart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getInventoryReportData } from "@/modules/inventory/server/inventoryActions";
import ReportsClient from "./ReportsClient";

export const metadata: Metadata = {
  title: "Envanter Raporları | Pekefe ERP",
  description: "Kurumsal Excel ve PDF formatlarında envanter ve stok raporları oluşturucu.",
};

interface PageProps {
  searchParams: Promise<{
    type?: string;
    warehouseId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const reportType = sp.type ?? "stock_status";
  const warehouseId = sp.warehouseId ?? "";
  const dateFrom = sp.dateFrom ?? "";
  const dateTo = sp.dateTo ?? "";

  // Load warehouses safely from prisma for filter dropdown with fallback
  let warehouses = await prisma.warehouse.findMany({
    where: { isActive: true },
    include: { branch: { select: { name: true } } },
    orderBy: { name: "asc" },
  }).catch(() => []);

  if (warehouses.length === 0) {
    warehouses = [
      { id: "merkez-depo", name: "Merkez Depo", code: "WH-MRKZ", branch: { name: "Merkez Şube" } } as any
    ];
  }

  // Load report data
  const result = await getInventoryReportData(reportType, {
    warehouseId: warehouseId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const reportData = result.success ? result.data : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white px-6 py-3 no-print">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link
            href="."
            className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-orange-500 transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            Envanter &amp; Depo
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="font-semibold text-slate-800">Envanter Raporları</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between no-print">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow">
                <FileBarChart className="h-5 w-5" />
              </span>
              Envanter Raporları
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Excel ve PDF çıktısı alınabilir, SAP ve Logo Tiger uyumlu denetleme ve yönetim raporları.
            </p>
          </div>
        </div>

        {/* Client side interface */}
        <ReportsClient
          key={`${reportType}-${warehouseId}-${dateFrom}-${dateTo}`}
          warehouses={JSON.parse(JSON.stringify(warehouses))}
          initialReportType={reportType}
          initialWarehouseId={warehouseId}
          initialDateFrom={dateFrom}
          initialDateTo={dateTo}
          reportData={reportData}
        />
      </div>
    </div>
  );
}

