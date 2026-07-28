import { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, ChevronRight, ClipboardCheck } from "lucide-react";
import {
  getCycleCountsData,
  getCycleCountDetail,
} from "@/modules/inventory/server/inventoryActions";
import CycleCountClient from "./CycleCountClient";

export const metadata: Metadata = {
  title: "Sayım İşlemleri | Atak Arıcılık ERP",
  description: "Stok doğruluğu ve periyodik sayım yönetimi paneli.",
};

interface PageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function CycleCountPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const activeId = sp.id ?? "";

  const [listResult, detailResult] = await Promise.all([
    getCycleCountsData(),
    activeId ? getCycleCountDetail(activeId) : Promise.resolve({ success: false, data: null }),
  ]);

  const listData = listResult.success ? listResult.data : null;
  const activeCount = detailResult.success ? detailResult.data : null;

  const cycleCounts = listData?.cycleCounts ?? [];
  const warehouses = listData?.warehouses ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link
            href="."
            className="flex items-center gap-1.5 font-medium text-slate-600 hover:text-orange-500 transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            Envanter &amp; Depo
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <span className="font-semibold text-slate-800">Sayım İşlemleri</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        {/* Page Header */}
        {!activeId && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                Sayım İşlemleri
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Periyodik veya anlık stok sayımları oluşturun, farkları hesaplayın ve stokları güncelleyin.
              </p>
            </div>
          </div>
        )}

        {/* Client Interactive Component */}
        <CycleCountClient
          cycleCounts={cycleCounts}
          warehouses={warehouses}
          activeCount={activeCount}
        />
      </div>
    </div>
  );
}

