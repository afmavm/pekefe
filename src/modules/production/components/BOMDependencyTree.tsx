"use client";

import React from "react";
import { Layers, AlertTriangle, CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Product } from "../types";

interface BOMDependencyTreeProps {
  product: Product | null;
  quantity: number;
}

export default function BOMDependencyTree({ product, quantity }: BOMDependencyTreeProps) {
  if (!product) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 glass border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-[#f97316] flex items-center justify-center mb-4 border border-amber-500/20 shadow-sm animate-pulse">
          <Layers className="w-7 h-7" />
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Malzeme Ağacı Analizi</h4>
        <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 max-w-[280px] font-semibold leading-relaxed">
          Seçilen mamulün üretim reçetesini (BOM) ve gerekli hammadde ihtiyaçlarını görselleştirmek için yukarıdan bir mamul seçin.
        </p>
      </div>
    );
  }

  const recipeItems = product.recipe || [];
  const hasRecipe = recipeItems.length > 0;

  // Check if we have sufficient stock for all ingredients
  const stockCheck = recipeItems.map((item) => {
    const required = item.quantity * quantity;
    const available = item.ingredient?.stock ?? 0;
    // Stock coverage percentage (max 100)
    const coverage = required > 0 ? Math.min(100, (available / required) * 100) : 100;
    return {
      ...item,
      required,
      available,
      coverage,
      isSufficient: available >= required,
    };
  });

  const allSufficient = stockCheck.every((item) => item.isSufficient);

  return (
    <div className="glass rounded-3xl shadow-sm p-6 space-y-6 border border-slate-200/60 dark:border-slate-800/60">
      
      {/* Header Info */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
        <div>
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#f97316]" /> Reçete (BOM) & Simülasyon
          </h3>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-150 mt-1">
            {product.name} için İhtiyaç Analizi
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
          !hasRecipe 
            ? "bg-red-50 text-red-700 border-red-200"
            : allSufficient
              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
              : "bg-orange-50 text-orange-600 border-amber-250"
        }`}>
          {!hasRecipe ? "Reçetesiz" : allSufficient ? "Üretime Hazır" : "Eksik Malzeme Var"}
        </span>
      </div>

      {/* Flowchart Layout */}
      {!hasRecipe ? (
        <div className="py-6 text-center text-xs font-bold text-red-500 bg-red-50/50 rounded-2xl border border-red-100">
          Bu ürünün reçetesi tanımlanmamıştır! Üretim yapılamaz.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Main Card (Left Node) */}
          <div className="lg:col-span-5 relative bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
            <div className="absolute top-3 right-3">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">ROOT</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#d97706] text-white flex items-center justify-center font-bold shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mt-4 truncate">
              {product.name}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">SKU: {product.sku}</p>

            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-850 flex justify-between items-center text-xs">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Hedef Üretim</p>
                <p className="text-slate-850 dark:text-white font-black text-sm">{quantity} Adet</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mevcut Stok</p>
                <p className="text-slate-850 dark:text-white font-black text-sm">{product.stock} Adet</p>
              </div>
            </div>
          </div>

          {/* Connection Arrows (Middle Spacer) */}
          <div className="lg:col-span-1 hidden lg:flex flex-col items-center justify-center gap-1 text-slate-300 dark:text-slate-700">
            <ArrowRight className="w-5 h-5 text-[#f97316] animate-pulse" />
          </div>

          {/* Ingredients Node (Right Column) */}
          <div className="lg:col-span-6 space-y-3.5">
            {stockCheck.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 bg-white/50 dark:bg-slate-900/30 ${
                  item.isSufficient
                    ? "border-slate-200/80 dark:border-slate-800"
                    : "border-amber-250 bg-orange-50/5 dark:border-amber-950/10"
                }`}
              >
                {/* Header inside row */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate uppercase">
                      {item.ingredient?.name || "Bilinmeyen Hammadde"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      Birim Oran: {item.quantity} {item.unit}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${item.isSufficient ? "text-emerald-600" : "text-amber-600"}`}>
                    {item.isSufficient ? "Yeterli" : "Yetersiz"}
                  </span>
                </div>

                {/* Modern Progress Bar representing stock coverage */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Stok Karşılama</span>
                    <span>{Math.round(item.coverage)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/30">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isSufficient
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-amber-400 to-amber-500"
                      }`}
                      style={{ width: `${item.coverage}%` }}
                    />
                  </div>
                </div>

                {/* Values row */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>Gerekli: <strong className="text-slate-850 dark:text-white">{item.required} {item.unit}</strong></span>
                  <span>Depo: <strong className={item.isSufficient ? "text-emerald-600 font-black" : "text-red-550 font-black"}>{item.available} {item.unit}</strong></span>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Summary Alert Footer */}
      {hasRecipe && (
        <div className={`p-4.5 rounded-2xl border flex items-center gap-3.5 transition-colors ${
          allSufficient
            ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-950/20 text-emerald-800"
            : "bg-orange-50/50 border-orange-100 dark:bg-amber-950/10 dark:border-amber-950/20 text-amber-800"
        }`}>
          <div className="rounded-xl p-2 bg-white dark:bg-slate-900 border border-inherit shadow-sm shrink-0">
            {allSufficient ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
            )}
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-sm uppercase tracking-wide">
              {allSufficient ? "Üretim Onayı Aktif" : "Hammadde Tedariği Gerekli"}
            </p>
            <p className="opacity-90 mt-1 font-semibold leading-relaxed">
              {allSufficient
                ? "Gerekli tüm malzemeler depo stoklarında mevcuttur. Hemen imalatı başlatabilirsiniz."
                : "Bazı bileşenlerin stok miktarları bu hacim için yetersiz. Üretime başlamadan önce malzeme temin edin."}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
