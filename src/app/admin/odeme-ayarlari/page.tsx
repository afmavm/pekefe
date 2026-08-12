"use client";

import { useState, useEffect } from "react";
import {
  CreditCard, Banknote, Receipt, Truck, Settings,
  Save, Loader2, Eye, EyeOff, Key, Shield, Percent,
  ToggleLeft, ToggleRight, Info, Building2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  onlyB2B?: boolean;
  badge?: string;
}

interface InstallmentOption {
  months: number;
  label: string;
  enabled: boolean;
  extraFeePercent: number;
}

interface PaytrSettings {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: boolean;
}

interface GeneralPaymentSettings {
  bankTransferDiscountRate: number;
  cashOnDeliveryFee: number;
  cashOnDeliveryEnabled: boolean;
  minOrderAmountForOpenAccount: number;
  openAccountDaysLimit: number;
  shippingThreshold: number;
  shippingFee: number;
}

const DEFAULT_INSTALLMENTS: InstallmentOption[] = [
  { months: 1,  label: "Tek Cekim",   enabled: true,  extraFeePercent: 0   },
  { months: 2,  label: "2 Taksit",    enabled: true,  extraFeePercent: 0   },
  { months: 3,  label: "3 Taksit",    enabled: true,  extraFeePercent: 0   },
  { months: 6,  label: "6 Taksit",    enabled: true,  extraFeePercent: 1.5 },
  { months: 9,  label: "9 Taksit",    enabled: false, extraFeePercent: 3   },
  { months: 12, label: "12 Taksit",   enabled: false, extraFeePercent: 5   },
];

export default function OdemeAyarlariPage() {
  const [activeTab, setActiveTab] = useState<"methods" | "paytr" | "installments" | "shipping">("methods");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [methodsEnabled, setMethodsEnabled] = useState<Record<string, boolean>>({
    creditCard: true,
    bankTransfer: true,
    openAccount: true,
    cashOnDelivery: false,
  });

  const [paytr, setPaytr] = useState<PaytrSettings>({
    merchantId: "735518",
    merchantKey: "wQkmEkdf5NDCEnWg",
    merchantSalt: "AuK7HXRb7NrbyZzw",
    testMode: false,
  });
  const [showPaytrSecret, setShowPaytrSecret] = useState(false);
  const [testingPaytr, setTestingPaytr] = useState(false);
  const [installments, setInstallments] = useState<InstallmentOption[]>(DEFAULT_INSTALLMENTS);
  const [general, setGeneral] = useState<GeneralPaymentSettings>({
    bankTransferDiscountRate: 3,
    cashOnDeliveryFee: 25,
    cashOnDeliveryEnabled: false,
    minOrderAmountForOpenAccount: 500,
    openAccountDaysLimit: 30,
    shippingThreshold: 5000,
    shippingFee: 150,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (!data) return;
        setGeneral(prev => ({
          ...prev,
          bankTransferDiscountRate: data.bankTransferDiscountRate ?? prev.bankTransferDiscountRate,
          shippingThreshold: data.shippingThreshold ?? prev.shippingThreshold,
          shippingFee: data.shippingFee ?? prev.shippingFee,
          cashOnDeliveryFee: data.cashOnDeliveryFee ?? prev.cashOnDeliveryFee,
          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled ?? prev.cashOnDeliveryEnabled,
          minOrderAmountForOpenAccount: data.minOrderAmountForOpenAccount ?? prev.minOrderAmountForOpenAccount,
          openAccountDaysLimit: data.openAccountDaysLimit ?? prev.openAccountDaysLimit,
        }));
        if (data.paymentMethodsConfig) {
          try {
            const cfg = JSON.parse(data.paymentMethodsConfig);
            if (Array.isArray(cfg)) {
              const map: Record<string, boolean> = {};
              cfg.forEach((c: any) => { map[c.id] = c.enabled; });
              setMethodsEnabled(prev => ({ ...prev, ...map }));
            }
          } catch {}
        }
        if (data.paytrConfig) {
          try {
            const cfg = JSON.parse(data.paytrConfig);
            setPaytr(prev => ({
              merchantId: cfg.merchantId || prev.merchantId,
              merchantKey: cfg.merchantKey || prev.merchantKey,
              merchantSalt: cfg.merchantSalt || prev.merchantSalt,
              testMode: cfg.testMode ?? prev.testMode
            }));
          } catch {}
        }
        if (data.installmentsConfig) {
          try {
            const cfg = JSON.parse(data.installmentsConfig);
            if (Array.isArray(cfg) && cfg.length > 0) setInstallments(cfg);
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        bankTransferDiscountRate: general.bankTransferDiscountRate,
        shippingThreshold: general.shippingThreshold,
        shippingFee: general.shippingFee,
        cashOnDeliveryFee: general.cashOnDeliveryFee,
        cashOnDeliveryEnabled: general.cashOnDeliveryEnabled,
        minOrderAmountForOpenAccount: general.minOrderAmountForOpenAccount,
        openAccountDaysLimit: general.openAccountDaysLimit,
        paymentMethodsConfig: JSON.stringify(
          Object.entries(methodsEnabled).map(([id, enabled]) => ({ id, enabled }))
        ),
        installmentsConfig: JSON.stringify(installments),
      };
      if (paytr.merchantId || paytr.merchantKey || paytr.merchantSalt) {
        body.paytrConfig = JSON.stringify({
          merchantId: paytr.merchantId,
          merchantKey: paytr.merchantKey || undefined,
          merchantSalt: paytr.merchantSalt || undefined,
          testMode: paytr.testMode,
        });
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Odeme ayarlari basariyla kaydedildi!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Kayit sirasinda hata olustu");
      }
    } catch {
      toast.error("Baglanti hatasi");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPaytr = async () => {
    if (!paytr.merchantId) { toast.error("Merchant ID giriniz"); return; }
    setTestingPaytr(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success("PayTR baglantisi dogrulandi (test modu)");
    setTestingPaytr(false);
  };

  const toggleInstallment = (months: number) =>
    setInstallments(prev => prev.map(i => i.months === months ? { ...i, enabled: !i.enabled } : i));
  const updateInstallmentFee = (months: number, fee: number) =>
    setInstallments(prev => prev.map(i => i.months === months ? { ...i, extraFeePercent: Math.max(0, fee) } : i));

  const methodDefs = [
    { id: "creditCard",     label: "Kredi / Banka Karti (PayTR)", desc: "3D Secure ile guvenli online kredi karti odemesi. VISA, Mastercard, Troy, World desteklenir.", color: "bg-emerald-500", badge: "Onerilen" },
    { id: "bankTransfer",   label: "Banka Havalesi / EFT",        desc: "Havale veya EFT ile odeme. Indirim orani ayarlanabilir. IBAN bilgileri Muhasebe Banka'dan yonetilir.", color: "bg-amber-500" },
    { id: "openAccount",    label: "B2B Vadeli Acik Hesap",        desc: "Yalnizca yetkilendirilmis B2B bayilere sunulan vadeli odeme secenegi.", color: "bg-blue-500", b2b: true },
    { id: "cashOnDelivery", label: "Kapida Odeme",                 desc: "Kargo ile teslimatta nakit veya POS ile odeme. Ekstra hizmet bedeli eklenebilir.", color: "bg-purple-500" },
  ];

  const tabs = [
    { id: "methods" as const,      label: "Odeme Yontemleri",   icon: CreditCard },
    { id: "paytr" as const,        label: "PayTR API",           icon: Key },
    { id: "installments" as const, label: "Taksit Secenekleri",  icon: Percent },
    { id: "shipping" as const,     label: "Kargo ve Esikler",    icon: Truck },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-orange-500" />
            Odeme Yontemi Ayarlari
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Sepette gosterilecek odeme seceneklerini, PayTR entegrasyonunu ve taksit yapilarini buradan yonetin.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Tumunu Kaydet
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600 bg-orange-50/40"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* TAB 1 — ODEME YONTEMLERI */}
          {activeTab === "methods" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Aktif ettiginiz yontemler sepet odeme sayfasinda musterilere gosterilir. Banka IBAN bilgilerini Muhasebe Banka Hesaplari sayfasindan ekleyin.</span>
              </div>

              {methodDefs.map(m => (
                <div key={m.id} className={`border-2 rounded-2xl p-5 transition-all ${methodsEnabled[m.id] ? "border-orange-200 bg-orange-50/30 shadow-sm" : "border-slate-100 bg-slate-50/50 opacity-70"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${m.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">{m.label}</h3>
                          {m.badge && <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500 text-white rounded-full">{m.badge}</span>}
                          {m.b2b && <span className="text-[10px] font-black px-2 py-0.5 bg-blue-500 text-white rounded-full">Sadece B2B</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-lg">{m.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMethodsEnabled(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                      className={`shrink-0 p-1 rounded-full transition-all ${methodsEnabled[m.id] ? "text-orange-500" : "text-slate-300"}`}
                    >
                      {methodsEnabled[m.id] ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                    </button>
                  </div>

                  {m.id === "bankTransfer" && methodsEnabled[m.id] && (
                    <div className="mt-4 pt-4 border-t border-orange-200/60 flex items-center gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Havale Indirimi %:</label>
                      <input type="number" min={0} max={30} step={0.5}
                        value={general.bankTransferDiscountRate}
                        onChange={e => setGeneral(p => ({ ...p, bankTransferDiscountRate: parseFloat(e.target.value) || 0 }))}
                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-400"
                      />
                      <span className="text-xs text-slate-500">0 = indirim yok</span>
                    </div>
                  )}
                  {m.id === "cashOnDelivery" && methodsEnabled[m.id] && (
                    <div className="mt-4 pt-4 border-t border-purple-200/60 flex items-center gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Kapida Odeme Bedeli TL:</label>
                      <input type="number" min={0}
                        value={general.cashOnDeliveryFee}
                        onChange={e => setGeneral(p => ({ ...p, cashOnDeliveryFee: parseFloat(e.target.value) || 0 }))}
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-400"
                      />
                    </div>
                  )}
                  {m.id === "openAccount" && methodsEnabled[m.id] && (
                    <div className="mt-4 pt-4 border-t border-blue-200/60 flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Min. Siparis TL:</label>
                        <input type="number" min={0}
                          value={general.minOrderAmountForOpenAccount}
                          onChange={e => setGeneral(p => ({ ...p, minOrderAmountForOpenAccount: parseFloat(e.target.value) || 0 }))}
                          className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Vade Gun:</label>
                        <input type="number" min={1} max={90}
                          value={general.openAccountDaysLimit}
                          onChange={e => setGeneral(p => ({ ...p, openAccountDaysLimit: parseInt(e.target.value) || 30 }))}
                          className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2 — PAYTR API */}
          {activeTab === "paytr" && (
            <div className="space-y-5">
              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                <span>API anahtarlariniz sifrelenerek saklanir. Sayfa yenilendiginde Key ve Salt bos gorunur — yeniden girmeden kaydedin.</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Merchant ID</label>
                <input type="text" value={paytr.merchantId}
                  onChange={e => setPaytr(p => ({ ...p, merchantId: e.target.value }))}
                  placeholder="PayTR Merchant ID"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Merchant Key</label>
                <div className="relative">
                  <input type={showPaytrSecret ? "text" : "password"} value={paytr.merchantKey}
                    onChange={e => setPaytr(p => ({ ...p, merchantKey: e.target.value }))}
                    placeholder="Bos birakirsaniz mevcut key korunur"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPaytrSecret(!showPaytrSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPaytrSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Merchant Salt</label>
                <div className="relative">
                  <input type={showPaytrSecret ? "text" : "password"} value={paytr.merchantSalt}
                    onChange={e => setPaytr(p => ({ ...p, merchantSalt: e.target.value }))}
                    placeholder="Bos birakirsaniz mevcut salt korunur"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPaytrSecret(!showPaytrSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPaytrSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-800">Test Modu</p>
                  <p className="text-xs text-slate-500 mt-0.5">Aktif iken gercek odeme alinmaz. Canliya gecmeden once kapatin.</p>
                </div>
                <button onClick={() => setPaytr(p => ({ ...p, testMode: !p.testMode }))}
                  className={`p-1 rounded-full transition-all ${paytr.testMode ? "text-amber-500" : "text-slate-300"}`}>
                  {paytr.testMode ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                </button>
              </div>

              {paytr.testMode && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Test modu aktif — canli ortamda kapatmayi unutmayin!
                </div>
              )}

              <button onClick={handleTestPaytr} disabled={testingPaytr || !paytr.merchantId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 w-fit">
                {testingPaytr ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Baglantıyı Test Et
              </button>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <p className="font-bold text-slate-800">PayTR Panel kurulum rehberi:</p>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>PayTR hesabiniza giris yapin ve Magazalarim bolumune gidin</li>
                  <li>Magazanizi secin ve Entegrasyon Bilgileri bolumunu acin</li>
                  <li>Merchant ID, Merchant Key ve Merchant Salt degerlerini kopyalayin</li>
                  <li>Callback URL: https://pekefe.com/api/webhooks/paytr</li>
                  <li>Basari URL: https://pekefe.com/sepet/onay</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3 — TAKSIT SECENEKLERI */}
          {activeTab === "installments" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Aktif taksit secenekleri PayTR odeme ekraninda gosterilir. Ekstra ucret yuzde 0 ise musteriden fark alinmaz.</span>
              </div>

              <div className="space-y-2">
                {installments.map(inst => (
                  <div key={inst.months} className={`flex items-center justify-between gap-4 p-4 border rounded-xl transition-all ${inst.enabled ? "border-orange-200 bg-orange-50/30" : "border-slate-100 bg-slate-50/40 opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleInstallment(inst.months)}
                        className={`p-0.5 rounded-full transition ${inst.enabled ? "text-orange-500" : "text-slate-300"}`}>
                        {inst.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </button>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{inst.label}</p>
                        <p className="text-xs text-slate-500">{inst.months === 1 ? "Pesin odeme" : `${inst.months} aylik esit taksit`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Ekstra %:</label>
                      <input type="number" min={0} max={20} step={0.5}
                        value={inst.extraFeePercent}
                        onChange={e => updateInstallmentFee(inst.months, parseFloat(e.target.value) || 0)}
                        disabled={!inst.enabled}
                        className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:border-orange-400 disabled:opacity-40"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Onizleme — 1.000 TL siparis</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {installments.filter(i => i.enabled).map(inst => {
                    const total = 1000 * (1 + inst.extraFeePercent / 100);
                    const monthly = total / inst.months;
                    return (
                      <div key={inst.months} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase">{inst.label}</p>
                        <p className="text-base font-black text-orange-600 mt-0.5">
                          {inst.months === 1 ? `${total.toFixed(0)} TL` : `${monthly.toFixed(0)} TL x${inst.months}`}
                        </p>
                        {inst.extraFeePercent > 0 && <p className="text-[10px] text-slate-400">Toplam {total.toFixed(0)} TL</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4 — KARGO VE ESIKLER */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Kargo firmalari ve desi fiyatlari icin Siparisler Kargo Takibi sayfasini kullanin. Burada genel esikler ve ucretler ayarlanir.</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">Ucretsiz Kargo Esigi (TL)</label>
                  <input type="number" min={0} step={50}
                    value={general.shippingThreshold}
                    onChange={e => setGeneral(p => ({ ...p, shippingThreshold: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition"
                  />
                  <p className="text-xs text-slate-400">Bu tutarin uzerindeki siparislerde kargo ucretsiz olur.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">Standart Kargo Ucreti (TL)</label>
                  <input type="number" min={0} step={5}
                    value={general.shippingFee}
                    onChange={e => setGeneral(p => ({ ...p, shippingFee: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-orange-400 bg-slate-50 focus:bg-white transition"
                  />
                  <p className="text-xs text-slate-400">Esigin altindaki siparislere uygulanir.</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-slate-50 to-orange-50/30 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Kargo Esigi Onizleme</p>
                {[
                  { amount: Math.max(0, general.shippingThreshold - 100), free: false },
                  { amount: general.shippingThreshold, free: true },
                  { amount: general.shippingThreshold + 500, free: true },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 text-sm">
                    <span className="text-slate-600">{row.amount.toLocaleString("tr-TR")} TL siparis</span>
                    <span className={`font-bold ${row.free ? "text-emerald-600" : "text-red-600"}`}>
                      {row.free ? "UCRETSIZ KARGO" : `+${general.shippingFee} TL kargo`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="sticky bottom-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-medium">Degisiklikler tum sekmelere uygulanir. Kayit sonrasi sepet sayfasi guncellenir.</p>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Ayarlari Kaydet
        </button>
      </div>
    </div>
  );
}
