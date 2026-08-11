"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Calculator, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle as InfoIcon,
  Play,
  TrendingUp,
  FileCode
} from "lucide-react";
import { Product } from "@/modules/dealers/types";
import { SafeFormulaEvaluator } from "@/modules/catalog/server/price-calculator";

interface PriceFormulaEditorProps {
  initialFormula: string | null;
  products: Product[];
  onChangeFormula: (formula: string) => void;
}

export default function PriceFormulaEditor({ 
  initialFormula, 
  products, 
  onChangeFormula 
}: PriceFormulaEditorProps) {
  const [formula, setFormula] = useState(initialFormula || "");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [manualCost, setManualCost] = useState<number>(100);
  const [manualPrice, setManualPrice] = useState<number>(150);
  const [useCustomParams, setUseCustomParams] = useState(false);

  // Sync formula state with initial value if initial value changes
  useEffect(() => {
    setFormula(initialFormula || "");
  }, [initialFormula]);

  // Selected product logic
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Variables for preview calculations
  const previewCost = useCustomParams ? manualCost : (selectedProduct ? selectedProduct.cost : 100);
  const previewPrice = useCustomParams ? manualPrice : (selectedProduct ? selectedProduct.price : 150);

  // Run SafeFormulaEvaluator locally
  const computedPrice = useMemo(() => {
    if (!formula.trim()) {
      return previewPrice;
    }
    return SafeFormulaEvaluator.evaluate(formula, {
      cost: previewCost,
      price: previewPrice,
      baseprice: previewPrice
    });
  }, [formula, previewCost, previewPrice]);

  // Margin validation (Minimum 5% profit margin)
  const minPrice = previewCost * 1.05;
  const isBelowMargin = computedPrice < minPrice;
  const profitMargin = computedPrice > 0 ? ((computedPrice - previewCost) / previewCost) * 100 : 0;

  // Real-time formula syntax validation check
  const formulaError = useMemo(() => {
    if (!formula.trim()) return null;
    const clean = formula.toLowerCase().replace(/\s+/g, "");
    if (!/^[a-z0-9\+\-\*\/\(\)\.]+$/.test(clean)) {
      return "Formül geçersiz karakterler barındırıyor. Sadece +, -, *, /, parantezler, sayılar ve değişkenler (cost, price) kullanılabilir.";
    }
    const matches = clean.match(/[a-z]+/g);
    if (matches) {
      const invalidVar = matches.find((m) => !["cost", "price", "baseprice"].includes(m));
      if (invalidVar) {
        return `Geçersiz değişken: '${invalidVar}'. Sadece 'cost' (maliyet) ve 'price' (liste fiyatı) kullanılabilir.`;
      }
    }
    return null;
  }, [formula]);

  const handleFormulaChange = (val: string) => {
    setFormula(val);
    onChangeFormula(val);
  };

  return (
    <div className="space-y-6">
      {/* Editor & Instructions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#f97316]" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Fiyat Formülü Düzenleyici
              </h4>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Matematiksel Formül İfadesi
              </label>
              <input
                type="text"
                placeholder="Örn: cost * 1.15 veya (price * 0.90) + 5"
                value={formula}
                onChange={(e) => handleFormulaChange(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl outline-none font-mono text-xs focus:bg-white focus:ring-1 focus:ring-[#f97316] ${
                  formulaError ? "border-red-400 focus:border-red-400" : "border-slate-200 dark:border-slate-800 focus:border-[#f97316]"
                }`}
              />
              {formulaError ? (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {formulaError}
                </p>
              ) : (
                <p className="text-[9px] text-slate-400 font-semibold">
                  * Formül girdisi değiştikçe simülatör anlık hesaplanır.
                </p>
              )}
            </div>

            {/* Helper Quick Actions */}
            <div className="space-y-2 pt-2">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Hızlı Formül Şablonları</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Maliyet + %10 Kâr", val: "cost * 1.10" },
                  { name: "Maliyet + %15 Kâr", val: "cost * 1.15" },
                  { name: "Maliyet + %20 Kâr", val: "cost * 1.20" },
                  { name: "Liste Fiyatı - %10 İskonto", val: "price * 0.90" },
                ].map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleFormulaChange(tmpl.val)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider rounded-lg text-slate-600 dark:text-slate-350 cursor-pointer"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guide Card */}
          <div className="glass border border-slate-150 p-4 rounded-xl space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1 text-[#f97316] font-black uppercase text-[10px]">
              <HelpCircle className="w-3.5 h-3.5" /> Kullanım Kılavuzu
            </div>
            <p>
              Dinamik fiyatlama motoru, matematiksel ifadeleri sol-sağ sırasıyla güvenli bir şekilde yorumlar. Aşağıdaki değişkenleri kullanabilirsiniz:
            </p>
            <ul className="list-disc list-inside pl-1 space-y-1 font-semibold">
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-[#f97316] font-mono">cost</code>: Ürünün sisteme kayıtlı birim maliyeti.</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-[#f97316] font-mono">price</code>: Ürünün B2C/B2B liste satış fiyatı.</li>
            </ul>
          </div>
        </div>

        {/* Dynamic Sandbox Simulator Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass border border-slate-200/60 dark:border-slate-850 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Simülasyon Laboratuvarı
              </h4>
            </div>

            {/* Test Params Switcher */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Test Parametreleri Kaynağı</span>
              <button
                type="button"
                onClick={() => setUseCustomParams(!useCustomParams)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all ${
                  useCustomParams
                    ? "bg-orange-500 border-[#f97316] text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500"
                }`}
              >
                {useCustomParams ? "MANUEL DEĞERLER" : "ÜRÜN KATALOĞU"}
              </button>
            </div>

            {useCustomParams ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Test Maliyeti (cost)</label>
                  <input
                    type="number"
                    value={manualCost}
                    onChange={(e) => setManualCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Test Satış (price)</label>
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:bg-white outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Ürün Kataloğundan Seç</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:bg-white cursor-pointer"
                >
                  <option value="">-- Bir Ürün Seçin --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.toUpperCase()} (Maliyet: {p.cost} ₺, Fiyat: {p.price} ₺)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Calculations outputs block */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150/80 dark:border-slate-850/80 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
                <span className="text-slate-500 font-semibold">Test Ürün Maliyeti</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewCost.toLocaleString()} ₺</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
                <span className="text-slate-500 font-semibold">Liste Satış Fiyatı</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewPrice.toLocaleString()} ₺</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
                <span className="text-slate-500 font-semibold">Min. Fiyat Sınırı (%5 Kâr)</span>
                <span className="font-black text-[#f97316]">{minPrice.toLocaleString()} ₺</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Formül Satış Fiyatı</span>
                <span className="font-black text-sm text-[#f97316]">{computedPrice.toLocaleString()} ₺</span>
              </div>
            </div>

            {/* Profit margin indicators */}
            <div className="pt-2 border-t border-slate-150/50">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-slate-400">Tahmini Brüt Kar Marjı</span>
                <span className={profitMargin < 5 ? "text-red-500 font-black" : "text-emerald-500 font-black"}>
                  %{Math.round(profitMargin)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    profitMargin < 5 
                      ? "bg-red-500" 
                      : profitMargin < 15 
                      ? "bg-orange-500" 
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                />
              </div>
            </div>

            {/* Alert warnings */}
            {isBelowMargin && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" /> Zararına Satış Koruması Devrede
                </div>
                <p className="text-[10px] font-semibold leading-relaxed">
                  Girdiğiniz formül sonucu oluşan fiyat ({computedPrice} ₺), minimum %5 kar marjı sınırının ({minPrice} ₺) altındadır. B2B fiyat hesaplama motoru, bu bayi için satış fiyatını otomatik olarak min. fiyata ({minPrice} ₺) yükseltecektir.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
