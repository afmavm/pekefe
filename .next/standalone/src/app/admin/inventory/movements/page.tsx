import { getStockMovements } from "@/modules/inventory/server/inventoryActions";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Metadata } from "next";
import MovementsList from "./MovementsList";

export const metadata: Metadata = {
  title: "Stok Hareketleri & Audit Log | Envanter Yönetimi",
  description:
    "Değiştirilemez kurumsal denetim izi - tüm stok hareketlerini izleyin.",
};

interface SearchParams {
  warehouseId?: string;
  type?: string;
  moduleSource?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: string;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function StokHareketleriPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const currentPage = Number(sp.page ?? "1");

  const result = await getStockMovements({
    warehouseId: sp.warehouseId,
    type: sp.type,
    moduleSource: sp.moduleSource,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    search: sp.search,
    page: currentPage,
    pageSize: 25,
  });

  const data = result.success ? result.data : null;
  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const warehouses = data?.warehouses ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 no-print">
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            <Home className="w-3.5 h-3.5" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link
            href="/admin/inventory"
            className="hover:text-slate-800 transition-colors"
          >
            Envanter &amp; Depo
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-medium">Stok Hareketleri</span>
        </nav>
      </div>

      <MovementsList
        transactions={transactions}
        total={total}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        warehouses={warehouses}
        searchParams={sp}
      />
    </div>
  );
}

