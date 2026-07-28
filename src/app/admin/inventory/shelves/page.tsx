import { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, ChevronRight, Store, Warehouse } from "lucide-react";
import { getShelvesData } from "@/modules/inventory/server/inventoryActions";
import ShelvesClient from "./ShelvesClient";

export const metadata: Metadata = {
  title: "Raf Yönetimi (WMS) | Atak Arıcılık ERP",
  description: "WMS uyumlu Blok-Raf-Göz adresleme ve ürün eşleştirme ekranı.",
};

interface PageProps {
  searchParams: Promise<{
    warehouseId?: string;
  }>;
}

export default async function ShelvesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const selectedWarehouseId = sp.warehouseId ?? "";

  const result = await getShelvesData(
    selectedWarehouseId ? selectedWarehouseId : undefined
  );

  const data = result.success ? result.data : null;
  const locations = data?.locations ?? [];
  const warehouses = data?.warehouses ?? [];

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
          <span className="font-semibold text-slate-800">Raf Yönetimi</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow">
                <Store className="h-5 w-5" />
              </span>
              Raf Yönetimi (WMS)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Depolarınızdaki ürünlerin yerleşim adreslerini (Blok-Raf-Göz) izleyin ve güncelleyin.
            </p>
          </div>
          {locations.length > 0 && (
            <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              <Warehouse className="h-4 w-4 text-orange-500" />
              <span className="text-slate-500">Toplam Adresli Ürün:</span>
              <span className="font-semibold text-slate-800">
                {locations.length.toLocaleString("tr-TR")}
              </span>
            </div>
          )}
        </div>

        {/* Shelves Client App */}
        <ShelvesClient
          locations={locations}
          warehouses={warehouses}
          selectedWarehouseId={selectedWarehouseId}
        />
      </div>
    </div>
  );
}

