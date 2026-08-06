import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Package,
  Search,
  Warehouse,
  GitBranch,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  LayoutGrid,
  ShieldAlert,
  BoxesIcon,
  ChevronDown,
} from "lucide-react";
import { getStockStatus } from "@/modules/inventory/server/inventoryActions";

export const metadata: Metadata = {
  title: "Stok Durumu | Pekefe ERP",
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    branchId?: string;
    warehouseId?: string;
    category?: string;
    search?: string;
    page?: string;
  }>;
}

function AvailabilityBadge({
  available,
  criticalLimit,
}: {
  available: number;
  criticalLimit: number;
}) {
  if (available <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        <XCircle className="h-3.5 w-3.5" />
        {available}
      </span>
    );
  }
  if (available < criticalLimit) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        <AlertTriangle className="h-3.5 w-3.5" />
        {available}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {available}
    </span>
  );
}

export default async function StockStatusPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const currentPage = Number(sp.page ?? "1");

  const result = await getStockStatus({
    branchId: sp.branchId,
    warehouseId: sp.warehouseId,
    category: sp.category,
    search: sp.search,
    page: currentPage,
  });

  const data = result.success ? result.data : null;
  const locations = data?.locations ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const branches = data?.branches ?? [];
  const warehouses = data?.warehouses ?? [];
  const categories = data?.categories ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (sp.branchId) params.set("branchId", sp.branchId);
    if (sp.warehouseId) params.set("warehouseId", sp.warehouseId);
    if (sp.category) params.set("category", sp.category);
    if (sp.search) params.set("search", sp.search);
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Breadcrumb ── */}
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
          <span className="font-semibold text-slate-800">Stok Durumu</span>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8 space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow">
                <BoxesIcon className="h-5 w-5" />
              </span>
              Stok Durumu
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Şube ve depo bazında ürün stok miktarlarını, rezervasyonları ve kritik seviyeleri görüntüleyin.
            </p>
          </div>
          {total > 0 && (
            <div className="mt-3 sm:mt-0 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              <Package className="h-4 w-4 text-orange-500" />
              <span className="text-slate-500">Toplam kayıt:</span>
              <span className="font-semibold text-slate-800">{total.toLocaleString("tr-TR")}</span>
            </div>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {/* Search */}
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={sp.search ?? ""}
              placeholder="Ürün adı veya SKU ara…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            />
          </div>

          {/* Branch */}
          <div className="relative">
            <GitBranch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              name="branchId"
              defaultValue={sp.branchId ?? ""}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="">Tüm Şubeler</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Warehouse */}
          <div className="relative">
            <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              name="warehouseId"
              defaultValue={sp.warehouseId ?? ""}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="">Tüm Depolar</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Category */}
          <div className="relative">
            <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              name="category"
              defaultValue={sp.category ?? ""}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-700 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Submit / Reset */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-5">
            <button
              type="submit"
              className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 active:bg-orange-700 transition-colors"
            >
              Filtrele
            </button>
            <Link
              href="?"
              className="h-10 inline-flex items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Temizle
            </Link>
          </div>
        </form>

        {/* ── Error State ── */}
        {!result.success && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-16 text-center">
            <ShieldAlert className="h-12 w-12 text-red-400 mb-3" />
            <p className="text-base font-semibold text-red-700">Veriler yüklenirken bir hata oluştu</p>
            <p className="mt-1 text-sm text-red-500">Lütfen sayfayı yenilemeyi deneyin.</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {result.success && locations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 text-center shadow-sm">
            <Package className="h-14 w-14 text-slate-300 mb-4" />
            <p className="text-base font-semibold text-slate-700">Kayıt bulunamadı</p>
            <p className="mt-1 text-sm text-slate-400">
              Arama kriterlerinizi değiştirin veya filtreleri temizleyin.
            </p>
            <Link
              href="?"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Filtreleri Temizle
            </Link>
          </div>
        )}

        {/* ── Data Table ── */}
        {result.success && locations.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ürün Adı
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SKU
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kategori
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Şube
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Depo
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fiziksel Stok
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Rezerve
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kullanılabilir
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Min. Stok
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kritik Limit
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Raf
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locations.map((loc: any, index: number) => {
                    const available = loc.stock - loc.reserved;
                    const effectiveCritical =
                      loc.criticalLimit > 0
                        ? loc.criticalLimit
                        : loc.product.criticalLimit;
                    const isLocked = loc.warehouse.isLocked;
                    const sequenceNum = (currentPage - 1) * pageSize + index + 1;

                    return (
                      <tr
                        key={loc.id}
                        className="group hover:bg-orange-50/40 transition-colors"
                      >
                        {/* Sequence Number */}
                        <td className="px-4 py-3 font-medium text-slate-500 text-left">
                          {sequenceNum}
                        </td>

                        {/* Product Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {loc.product.image ? (
                              <div className="h-8 w-8 rounded-md border border-slate-100 overflow-hidden flex-shrink-0 relative">
                                <Image
                                  src={loc.product.image}
                                  alt={loc.product.name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-300">
                                <Package className="h-4 w-4" />
                              </span>
                            )}
                            <span className="max-w-[200px] truncate font-medium text-slate-800 group-hover:text-orange-600 transition-colors">
                              {loc.product.name}
                            </span>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-500">
                            {loc.product.sku}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {loc.product.category}
                          </span>
                        </td>

                        {/* Branch */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <span className="text-slate-700">
                              {loc.warehouse.branch.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({loc.warehouse.branch.code})
                            </span>
                          </div>
                        </td>

                        {/* Warehouse */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Warehouse className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <span className="text-slate-700">
                              {loc.warehouse.name}
                            </span>
                            {isLocked && (
                              <span className="ml-1 inline-flex items-center rounded bg-red-50 px-1 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-inset ring-red-200">
                                KİLİTLİ
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Physical Stock */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-slate-800">
                            {loc.stock.toLocaleString("tr-TR")}
                          </span>
                        </td>

                        {/* Reserved */}
                        <td className="px-4 py-3 text-right">
                          {loc.reserved > 0 ? (
                            <span className="font-medium text-amber-600">
                              {loc.reserved.toLocaleString("tr-TR")}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Available */}
                        <td className="px-4 py-3 text-right">
                          <AvailabilityBadge
                            available={available}
                            criticalLimit={effectiveCritical}
                          />
                        </td>

                        {/* Min Stock */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-slate-600">
                            {loc.minStock.toLocaleString("tr-TR")}
                          </span>
                        </td>

                        {/* Critical Limit */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-slate-600">
                            {effectiveCritical.toLocaleString("tr-TR")}
                          </span>
                        </td>

                        {/* Rack */}
                        <td className="px-4 py-3">
                          {loc.rack ? (
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {loc.rack}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {((currentPage - 1) * pageSize + 1).toLocaleString("tr-TR")}
                    {" – "}
                    {Math.min(currentPage * pageSize, total).toLocaleString("tr-TR")}
                  </span>{" "}
                  / {total.toLocaleString("tr-TR")} kayıt
                </p>

                <div className="flex items-center gap-1">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageUrl(currentPage - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
                      aria-label="Önceki sayfa"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                    </span>
                  )}

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    const isActive = pageNum === currentPage;
                    return (
                      <Link
                        key={pageNum}
                        href={buildPageUrl(pageNum)}
                        className={`flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors shadow-sm ${
                          isActive
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    );
                  })}

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageUrl(currentPage + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors shadow-sm"
                      aria-label="Sonraki sayfa"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed">
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Legend ── */}
        {result.success && locations.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Renk Açıklaması:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Yeterli stok
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Kritik seviyenin altında
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Stok yok
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

