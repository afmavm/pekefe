"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CreditCard, TrendingUp, Users, Package, Save,
  Plus, Trash2, Percent, Info, CheckCircle2,
  DollarSign, Search, RefreshCw, Loader2, X,
  Tag, Edit2, AlertCircle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useCMS } from "@/context/CMSContext";

/* ─── Types ─────────────────────────────────────── */
interface PriceGroup {
  id: number;
  name: string;
  discount: number;
  color: string;
  dealerCount: number;
}

interface PricingRule {
  id: number;
  name: string;
  logic: string;
  isActive: boolean;
}

interface CustomPrice {
  id: string;
  accountId: string;
  accountName: string;
  dealerGroup: string;
  productId: string;
  productName: string;
  sku: string;
  basePrice: number;
  customPrice: number;
  discountRate: number;
  validUntil?: string;
}

interface Account {
  id: string;
  name: string;
  dealerGroup: string;
  discountRate: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

/* ─── Helpers ────────────────────────────────────── */
const GROUP_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-slate-100 text-slate-700",
];

const DEFAULT_GROUPS: PriceGroup[] = [
  { id: 1, name: "Platin Cari",   discount: 20, color: GROUP_COLORS[0], dealerCount: 12 },
  { id: 2, name: "VIP Cari",      discount: 10, color: GROUP_COLORS[1], dealerCount: 28 },
  { id: 3, name: "Standart Cari", discount: 0,  color: GROUP_COLORS[4], dealerCount: 142 },
];

const DEFAULT_RULES: PricingRule[] = [
  { id: 1, name: "Agresif Rekabet",  logic: "Maliyet + %5",  isActive: true  },
  { id: 2, name: "Standart Karlılık",logic: "Maliyet + %15", isActive: true  },
  { id: 3, name: "Yüksek Kar Marjı", logic: "Maliyet + %30", isActive: false },
];

/* ─── Component ──────────────────────────────────── */
export default function AdminPricingPage() {
  const { cmsData, updateCMSData } = useCMS();
  const [activeTab, setActiveTab] = useState<"groups" | "rules" | "custom">("groups");

  /* State – groups & rules (CMS backed) */
  const [groups, setGroups]   = useState<PriceGroup[]>(DEFAULT_GROUPS);
  const [rules,  setRules]    = useState<PricingRule[]>(DEFAULT_RULES);

  /* State – custom prices */
  const [customPrices, setCustomPrices]   = useState<CustomPrice[]>([]);
  const [cpLoading,    setCpLoading]      = useState(false);
  const [cpSearch,     setCpSearch]       = useState("");
  const [cpGroupFilter,setCpGroupFilter]  = useState("ALL");
  const [isAddCpOpen,  setIsAddCpOpen]    = useState(false);
  const [savingCp,     setSavingCp]       = useState(false);

  /* State – accounts & products for the modal */
  const [accounts,  setAccounts]  = useState<Account[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);

  /* State – new custom price form */
  const [newCp, setNewCp] = useState({
    accountId:    "",
    productId:    "",
    customPrice:  "",
    validUntil:   "",
  });

  /* State – simulation */
  const [simBasePrice, setSimBasePrice] = useState(1500);
  const [simCost,      setSimCost]      = useState(1000);
  const [simGroup,     setSimGroup]     = useState(1);

  /* ── Load CMS data ── */
  useEffect(() => {
    if (cmsData.pricingRules) {
      try {
        const parsed = JSON.parse(cmsData.pricingRules);
        if (parsed.groups?.length) setGroups(parsed.groups);
        if (parsed.rules?.length)  setRules(parsed.rules);
      } catch {}
    }
  }, [cmsData.pricingRules]);

  /* ── Load accounts & products for modal ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [accRes, prdRes] = await Promise.all([
          fetch("/api/dealers"),
          fetch("/api/products?limit=200"),
        ]);
        const accData = await accRes.json();
        const prdData = await prdRes.json();
        const accList = Array.isArray(accData) ? accData : accData?.dealers ?? [];
        const prdList = Array.isArray(prdData) ? prdData : prdData?.products ?? [];
        setAccounts(accList.map((d: any) => ({
          id: d.id, name: d.name,
          dealerGroup: d.dealerGroup ?? "Standart",
          discountRate: d.discountRate ?? 0,
        })));
        setProducts(prdList.map((p: any) => ({
          id: p.id, name: p.name, sku: p.sku, price: p.price,
        })));
      } catch {}
    };
    load();
  }, []);

  /* ── Load custom prices from local state (CMS-backed) ── */
  useEffect(() => {
    if (cmsData.customPrices) {
      try {
        const parsed = JSON.parse(cmsData.customPrices);
        if (Array.isArray(parsed)) setCustomPrices(parsed);
      } catch {}
    }
  }, [cmsData.customPrices]);

  /* ── Simulation ── */
  const simResult = useMemo(() => {
    const group        = groups.find(g => g.id === simGroup);
    const discountAmt  = group ? (simBasePrice * group.discount) / 100 : 0;
    const netPrice     = simBasePrice - discountAmt;
    return {
      discountAmt,
      netPrice,
      margin: netPrice - simCost,
      marginPct: simCost > 0 ? ((netPrice - simCost) / simCost) * 100 : 0,
    };
  }, [simBasePrice, simCost, simGroup, groups]);

  /* ── Groups handlers ── */
  const handleUpdateGroupDiscount = (id: number, discount: number) =>
    setGroups(groups.map(g => g.id === id ? { ...g, discount: Math.max(0, Math.min(100, discount)) } : g));

  const handleDeleteGroup = (id: number) => {
    setGroups(groups.filter(g => g.id !== id));
    toast.success("Grup silindi.");
  };

  const handleAddGroup = () => {
    const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1;
    setGroups([...groups, {
      id: newId, name: "Yeni Cari Grubu", discount: 5,
      color: GROUP_COLORS[newId % GROUP_COLORS.length], dealerCount: 0,
    }]);
    toast.success("Yeni grup eklendi.");
  };

  /* ── Custom Prices handlers ── */
  const selectedAccount = accounts.find(a => a.id === newCp.accountId);
  const selectedProduct = products.find(p => p.id === newCp.productId);

  const cpDiscountPreview = selectedProduct && newCp.customPrice
    ? ((selectedProduct.price - parseFloat(newCp.customPrice)) / selectedProduct.price * 100)
    : 0;

  const handleAddCustomPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCp.accountId || !newCp.productId || !newCp.customPrice) {
      toast.error("Cari hesap, ürün ve özel fiyat zorunludur.");
      return;
    }
    const cpVal = parseFloat(newCp.customPrice);
    if (cpVal <= 0) { toast.error("Fiyat sıfırdan büyük olmalıdır."); return; }

    setSavingCp(true);
    try {
      const acc = accounts.find(a => a.id === newCp.accountId);
      const prd = products.find(p => p.id === newCp.productId);
      if (!acc || !prd) { toast.error("Seçimler geçersiz."); return; }

      const entry: CustomPrice = {
        id: `cp-${Date.now()}`,
        accountId:   acc.id,
        accountName: acc.name,
        dealerGroup: acc.dealerGroup,
        productId:   prd.id,
        productName: prd.name,
        sku:         prd.sku,
        basePrice:   prd.price,
        customPrice: cpVal,
        discountRate: parseFloat(cpDiscountPreview.toFixed(1)),
        validUntil:  newCp.validUntil || undefined,
      };

      const updated = [entry, ...customPrices];
      setCustomPrices(updated);
      await updateCMSData({ customPrices: JSON.stringify(updated) });
      toast.success("Özel fiyat kaydedildi.");
      setIsAddCpOpen(false);
      setNewCp({ accountId: "", productId: "", customPrice: "", validUntil: "" });
    } catch {
      toast.error("Kayıt sırasında hata oluştu.");
    } finally {
      setSavingCp(false);
    }
  };

  const handleDeleteCustomPrice = async (id: string) => {
    const updated = customPrices.filter(cp => cp.id !== id);
    setCustomPrices(updated);
    await updateCMSData({ customPrices: JSON.stringify(updated) });
    toast.success("Özel fiyat silindi.");
  };

  /* ── Save groups & rules ── */
  const handleSave = async () => {
    try {
      await updateCMSData({ pricingRules: JSON.stringify({ groups, rules }) });
      toast.success("Değişiklikler kaydedildi.");
    } catch {
      toast.error("Bağlantı hatası.");
    }
  };

  /* ── Filtered custom prices ── */
  const filteredCp = customPrices.filter(cp => {
    const matchSearch = cp.accountName.toLowerCase().includes(cpSearch.toLowerCase()) ||
      cp.productName.toLowerCase().includes(cpSearch.toLowerCase()) ||
      cp.sku.toLowerCase().includes(cpSearch.toLowerCase());
    const matchGroup = cpGroupFilter === "ALL" || cp.dealerGroup === cpGroupFilter;
    return matchSearch && matchGroup;
  });

  const uniqueGroups = Array.from(new Set(customPrices.map(cp => cp.dealerGroup)));

  /* ─────────────────────────────────── RENDER ─── */
  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-orange-500" /> Cari Grupları & Fiyat Listeleri
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Cari gruplarını tanımlayın, iskonto oranlarını, kuralları ve özel ürün fiyatlarını yönetin.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" /> Değişiklikleri Kaydet
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: "groups", label: "Cari Grupları",          icon: Users     },
          { id: "rules",  label: "Fiyatlandırma Mantığı",  icon: TrendingUp},
          { id: "custom", label: "Cari Özel Fiyatları",    icon: Tag       },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB: Cari Grupları */}
          {activeTab === "groups" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-bold text-sm text-slate-800">Mevcut Cari Grupları & İskonto Oranları</h2>
                <button onClick={handleAddGroup} className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:text-orange-600">
                  <Plus className="w-3.5 h-3.5" /> Yeni Grup Ekle
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {groups.map((group) => (
                  <div key={group.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group/row">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base ${group.color}`}>
                        {group.discount}%
                      </div>
                      <div>
                        <input
                          type="text"
                          value={group.name}
                          onChange={(e) => setGroups(groups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                          className="font-bold text-slate-800 bg-transparent border-none outline-none text-sm hover:bg-slate-100 rounded px-1 -ml-1 transition"
                        />
                        <p className="text-xs text-slate-400 font-semibold">{group.dealerCount} aktif cari bu grupta</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-100 rounded-lg pr-3 border border-slate-200/50">
                        <input
                          type="number"
                          value={group.discount}
                          onChange={(e) => handleUpdateGroupDiscount(group.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-3 py-1.5 bg-transparent border-none text-xs font-semibold text-center outline-none text-slate-700"
                        />
                        <Percent className="w-3 h-3 text-slate-400" />
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition opacity-0 group-hover/row:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group summary */}
              <div className="px-5 py-3 bg-orange-50/50 border-t border-orange-100 flex items-center gap-2 text-xs font-semibold text-orange-700">
                <AlertCircle className="w-3.5 h-3.5" />
                Grup değişiklikleri yukarıdaki "Kaydet" butonu ile CMS'e yazılır.
              </div>
            </div>
          )}

          {/* TAB: Fiyatlandırma Mantığı */}
          {activeTab === "rules" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-sm text-slate-800">Otomatik Fiyatlandırma Kuralları</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Sipariş oluşturma sırasında uygulanan maliyet tabanlı fiyat mantığı</p>
                </div>
                <button
                  onClick={() => {
                    const newId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
                    setRules([...rules, { id: newId, name: "Yeni Kural", logic: "Maliyet + %10", isActive: false }]);
                    toast.success("Yeni kural eklendi.");
                  }}
                  className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:text-orange-600"
                >
                  <Plus className="w-3.5 h-3.5" /> Kural Ekle
                </button>
              </div>
              <div className="p-5 space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl group/rule">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        rule.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={rule.name}
                          onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r))}
                          className="font-semibold text-sm text-slate-800 bg-transparent outline-none hover:bg-white rounded px-1 -ml-1 transition border-none"
                        />
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Mantık:</span>
                          <input
                            type="text"
                            value={rule.logic}
                            onChange={e => setRules(rules.map(r => r.id === rule.id ? { ...r, logic: e.target.value } : r))}
                            className="text-xs font-bold text-orange-600 bg-transparent outline-none border-none hover:bg-orange-50 rounded px-1 -ml-1 transition"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Toggle */}
                      <button
                        onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))}
                        className={`w-11 h-6 rounded-full relative transition-colors ${rule.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${rule.isActive ? "right-0.5" : "left-0.5"}`} />
                      </button>
                      <button
                        onClick={() => { setRules(rules.filter(r => r.id !== rule.id)); toast.success("Kural kaldırıldı."); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition opacity-0 group-hover/rule:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {rules.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-25" />
                    Henüz kural tanımlanmamış.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Cari Özel Fiyatları ← YENİ */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari veya ürün adı ara..."
                    value={cpSearch}
                    onChange={e => setCpSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <select
                  value={cpGroupFilter}
                  onChange={e => setCpGroupFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-semibold text-slate-600"
                >
                  <option value="ALL">Tüm Gruplar</option>
                  {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <button
                  onClick={() => setIsAddCpOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-sm ml-auto"
                >
                  <Plus className="w-4 h-4" /> Özel Fiyat Ekle
                </button>
              </div>

              {/* Custom Prices Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {cpLoading ? (
                  <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> Yükleniyor...
                  </div>
                ) : filteredCp.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Tag className="w-10 h-10 text-slate-200 mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-slate-600">Özel fiyat tanımlanmamış</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Belirli bir cariye belirli bir ürün için özel (grup iskontosundan bağımsız) fiyat tanımlayın.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddCpOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> İlk Özel Fiyatı Ekle
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3">Cari Hesap</th>
                          <th className="px-5 py-3">Grup</th>
                          <th className="px-5 py-3">Ürün</th>
                          <th className="px-5 py-3 text-right">Liste Fiyatı</th>
                          <th className="px-5 py-3 text-right">Özel Fiyat</th>
                          <th className="px-5 py-3 text-right">İskonto</th>
                          <th className="px-5 py-3">Geçerlilik</th>
                          <th className="px-5 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {filteredCp.map((cp) => {
                          const isExpired = cp.validUntil && new Date(cp.validUntil) < new Date();
                          return (
                            <tr key={cp.id} className="hover:bg-slate-50/70 transition">
                              <td className="px-5 py-3 font-semibold text-slate-800">{cp.accountName}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  cp.dealerGroup === "Platin" ? "bg-purple-50 text-purple-700" :
                                  cp.dealerGroup === "VIP"    ? "bg-blue-50 text-blue-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {cp.dealerGroup}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <p className="font-semibold text-slate-800 truncate max-w-[160px]">{cp.productName}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{cp.sku}</p>
                              </td>
                              <td className="px-5 py-3 text-right text-slate-400 line-through">
                                ₺{cp.basePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3 text-right font-black text-orange-600">
                                ₺{cp.customPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="inline-flex items-center gap-0.5 font-black text-emerald-600">
                                  <Percent className="w-3 h-3" />{cp.discountRate}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                {cp.validUntil ? (
                                  <span className={`text-[10px] font-semibold ${isExpired ? "text-red-500" : "text-slate-500"}`}>
                                    {isExpired ? "⚠️ Süresi Doldu" : new Date(cp.validUntil).toLocaleDateString("tr-TR")}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Süresiz</span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => handleDeleteCustomPrice(cp.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary bar */}
              {filteredCp.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-3 flex items-center gap-3 text-xs text-orange-700 font-semibold">
                  <Tag className="w-4 h-4 text-orange-500" />
                  <span>Toplam <strong>{filteredCp.length}</strong> özel fiyat tanımlı. Ortalama iskonto:
                    <strong> %{filteredCp.length > 0 ? (filteredCp.reduce((s, cp) => s + cp.discountRate, 0) / filteredCp.length).toFixed(1) : "0"}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Info + Simulation ── */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Info className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-black mb-3">İskonto Öncelik Hiyerarşisi</h3>
              <ul className="space-y-2.5">
                {[
                  { rank: "1.", text: "Özel ürün fiyatı her zaman önceliklidir." },
                  { rank: "2.", text: "Özel fiyat yoksa cari grubu iskontosu uygulanır." },
                  { rank: "3.", text: "Kampanyalı ürünlerde ekstra cari iskontosu uygulanmaz." },
                  { rank: "4.", text: "Sistem maliyetin altına satışı otomatik engeller." },
                ].map((item) => (
                  <li key={item.rank} className="flex gap-2.5 text-xs font-semibold leading-relaxed text-orange-50">
                    <span className="font-black text-white shrink-0">{item.rank}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Simulation */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Canlı Fiyat Simülasyonu</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Liste Fiyatı (₺)</label>
                <div className="relative">
                  <input type="number" value={simBasePrice} onChange={(e) => setSimBasePrice(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-orange-400 transition" />
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Maliyet (₺)</label>
                <div className="relative">
                  <input type="number" value={simCost} onChange={(e) => setSimCost(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-orange-400 transition" />
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Simüle Edilecek Grup</label>
                <select value={simGroup} onChange={(e) => setSimGroup(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-orange-400 transition">
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name} (-%{g.discount})</option>)}
                </select>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Liste Fiyatı</span>
                  <span className="font-bold">₺{simBasePrice.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>İskonto (-%{groups.find(g => g.id === simGroup)?.discount ?? 0})</span>
                  <span className="font-bold">-₺{simResult.discountAmt.toLocaleString("tr-TR")}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between font-black text-slate-900">
                  <span>Net Satış</span>
                  <span className="text-orange-600">₺{simResult.netPrice.toLocaleString("tr-TR")}</span>
                </div>
                <div className={`p-2.5 rounded-lg text-center mt-1 ${simResult.margin > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                  <p className="text-[9px] font-bold uppercase">Tahmini Kar Marjı</p>
                  <p className="text-sm font-black">%{simResult.marginPct.toFixed(1)}</p>
                  <p className="text-[10px] font-semibold">₺{simResult.margin.toLocaleString("tr-TR")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD CUSTOM PRICE MODAL ── */}
      {isAddCpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 text-orange-500 rounded-lg"><Tag className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Cari Özel Fiyat Tanımla</h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Grup iskontosundan bağımsız birebir fiyat</p>
                </div>
              </div>
              <button onClick={() => setIsAddCpOpen(false)} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomPrice} className="p-6 space-y-4">
              {/* Account */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Cari Hesap *</label>
                <select required value={newCp.accountId} onChange={e => setNewCp(p => ({ ...p, accountId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition">
                  <option value="">— Cari Seçiniz —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.dealerGroup})</option>)}
                </select>
                {selectedAccount && (
                  <p className="text-[10px] text-slate-400 font-semibold ml-1">
                    Mevcut grup iskontosu: <strong className="text-orange-500">%{selectedAccount.discountRate}</strong>
                  </p>
                )}
              </div>

              {/* Product */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Ürün *</label>
                <select required value={newCp.productId} onChange={e => setNewCp(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition">
                  <option value="">— Ürün Seçiniz —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — ₺{p.price} ({p.sku})</option>)}
                </select>
                {selectedProduct && (
                  <p className="text-[10px] text-slate-400 font-semibold ml-1">
                    Liste fiyatı: <strong className="text-slate-700">₺{selectedProduct.price.toLocaleString("tr-TR")}</strong>
                  </p>
                )}
              </div>

              {/* Custom Price + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Özel Fiyat (₺) *</label>
                  <input
                    type="number" min={0} step="0.01" required
                    placeholder="0.00"
                    value={newCp.customPrice}
                    onChange={e => setNewCp(p => ({ ...p, customPrice: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-orange-400 transition text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Geçerlilik Bitiş</label>
                  <input
                    type="date"
                    value={newCp.validUntil}
                    onChange={e => setNewCp(p => ({ ...p, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-orange-400 transition"
                  />
                </div>
              </div>

              {/* Preview */}
              {selectedProduct && newCp.customPrice && parseFloat(newCp.customPrice) > 0 && (
                <div className={`rounded-xl p-3 text-xs border ${cpDiscountPreview > 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                  <div className="flex justify-between">
                    <span className="font-semibold">İskonto Oranı</span>
                    <span className="font-black">%{cpDiscountPreview.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-semibold">Tasarruf</span>
                    <span className="font-black">₺{(selectedProduct.price - parseFloat(newCp.customPrice)).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddCpOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition">
                  İptal
                </button>
                <button type="submit" disabled={savingCp}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50">
                  {savingCp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                  Fiyat Tanımla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

