"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  XCircle,
  TrendingDown,
  Search,
  Package,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  stock: number;
  criticalLimit: number;
  category: string;
  image: string | null;
  cost: number;
  locations: Array<{
    stock: number;
    warehouse: {
      name: string;
      branch: {
        name: string;
      };
    };
  }>;
}

interface CriticalStats {
  criticalCount: number;
  outOfStockCount: number;
  approachingCount: number;
}

interface CriticalClientProps {
  critical: ProductRecord[];
  outOfStock: ProductRecord[];
  approachingCritical: ProductRecord[];
  stats: CriticalStats;
}

export default function CriticalClient({
  critical,
  outOfStock,
  approachingCritical,
  stats,
}: CriticalClientProps) {
  const [activeTab, setActiveTab] = useState<"critical" | "outOfStock" | "approaching">("critical");
  const [search, setSearch] = useState("");

  const getActiveList = () => {
    switch (activeTab) {
      case "critical":
        return critical;
      case "outOfStock":
        return outOfStock;
      case "approaching":
        return approachingCritical;
      default:
        return [];
    }
  };

  const filteredList = getActiveList().filter((p) => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
  });

  // Stock percentage relative to critical limit (capped at 100 for safety)
  const getStockPercentage = (stock: number, limit: number) => {
    if (limit <= 0) return 100;
    return Math.min(100, Math.max(0, (stock / limit) * 100));
  };

  return (
    <div className="space-y-6">
      {/* ── KPI Widgets ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Critical */}
        <button
          onClick={() => setActiveTab("critical")}
          className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition shadow-sm cursor-pointer ${
            activeTab === "critical"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100/50"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.criticalCount}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Kritik Limit Altındakiler</p>
          </div>
        </button>

        {/* Out of Stock */}
        <button
          onClick={() => setActiveTab("outOfStock")}
          className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition shadow-sm cursor-pointer ${
            activeTab === "outOfStock"
              ? "bg-red-50 border-red-300 ring-2 ring-red-100/50"
              : "bg-white border-slate-200 hover:border-red-300"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.outOfStockCount}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Tükenen Ürünler (Sıfır Stok)</p>
          </div>
        </button>

        {/* Approaching Limit */}
        <button
          onClick={() => setActiveTab("approaching")}
          className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition shadow-sm cursor-pointer ${
            activeTab === "approaching"
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-100/50"
              : "bg-white border-slate-200 hover:border-blue-300"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.approachingCount}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Sınıra Yaklaşan Ürünler</p>
          </div>
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Ürün adı, SKU veya kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition"
          />
        </div>
      </div>

      {/* ── Products Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  #
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Ürün Adı &amp; SKU
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Kategori
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Birim Maliyet
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 w-[200px]">
                  Stok Seviyesi (Kritik Eşik)
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Fiziksel Stok
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Kritik Limit
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredList.length > 0 ? (
                filteredList.map((p, index) => {
                  const percentage = getStockPercentage(p.stock, p.criticalLimit);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 relative">
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800 text-sm group-hover:text-orange-600 transition-colors">
                              {p.name}
                            </div>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">
                              {p.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {p.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-600">
                        {p.cost > 0
                          ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p.cost)
                          : "Belirtilmemiş"}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.criticalLimit > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                              <span>%{Math.round(percentage)}</span>
                              <span>{p.stock} / {p.criticalLimit}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${percentage}%` }}
                                className={`h-full rounded-full transition-all duration-350 ${
                                  percentage <= 0
                                    ? "bg-red-500"
                                    : percentage <= 50
                                    ? "bg-red-500 animate-pulse"
                                    : percentage <= 90
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                                }`}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-350 text-xs italic">Tanımsız</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold">
                        <span className={p.stock <= 0 ? "text-red-600" : p.stock < p.criticalLimit ? "text-amber-600" : "text-slate-800"}>
                          {p.stock.toLocaleString("tr-TR")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-500">
                        {p.criticalLimit.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/stock?search=${p.sku}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 text-slate-500 font-semibold text-xs transition cursor-pointer"
                        >
                          Kartı Aç
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Seçilen filtrede kritik stok seviyesinde ürün bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

