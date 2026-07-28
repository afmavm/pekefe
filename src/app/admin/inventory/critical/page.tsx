import { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, ChevronRight, AlertTriangle } from "lucide-react";
import { getCriticalStocks } from "@/modules/inventory/server/inventoryActions";
import CriticalClient from "./CriticalClient";

export const metadata: Metadata = {
  title: "Kritik Stoklar | Atak Arıcılık ERP",
  description: "Minimum stok limitleri altına düşen, tükenen ve riskli ürünler listesi.",
};

export default async function CriticalStocksPage() {
  const result = await getCriticalStocks();

  const data = result.success ? result.data : null;
  const critical = data?.critical ?? [];
  const outOfStock = data?.outOfStock ?? [];
  const approachingCritical = data?.approachingCritical ?? [];
  const stats = data?.stats ?? {
    criticalCount: 0,
    outOfStockCount: 0,
    approachingCount: 0,
  };

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
          <span className="font-semibold text-slate-800">Kritik Stoklar</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Kritik Stok Analizi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kritik limit altındaki, bitmek üzere olan veya tamamen tükenen ürünlerinizi izleyip yönetin.
            </p>
          </div>
        </div>

        {/* Client side component handles filtering & list tabs */}
        <CriticalClient
          critical={critical}
          outOfStock={outOfStock}
          approachingCritical={approachingCritical}
          stats={stats}
        />
      </div>
    </div>
  );
}

