"use client";

import { Activity, Globe, Percent, Truck, Building, FileText } from "lucide-react";

interface SeoCampaignEditorProps {
  values: any;
  onChange: (key: string, val: any) => void;
}

export default function SeoCampaignEditor({
  values,
  onChange
}: SeoCampaignEditorProps) {
  const inputClass =
    "w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#f97316] transition-all bg-white font-semibold text-slate-800 placeholder-slate-300";

  return (
    <div className="space-y-6">
      {/* 1. SEO & Global Meta */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
          <Globe className="w-4 h-4 text-[#f97316]" />
          <h3 className="text-xs font-black uppercase tracking-wider">Arama Motoru (SEO) &amp; Meta</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Site Açıklaması (Meta Description)</label>
            <textarea
              rows={3}
              value={values.siteDescription || ""}
              onChange={(e) => onChange("siteDescription", e.target.value)}
              placeholder="Arama motorlarında listelenecek site tanıtım metni..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Şirket Resmi Unvanı</label>
            <input
              type="text"
              value={values.companyName || ""}
              onChange={(e) => onChange("companyName", e.target.value)}
              placeholder="Atak Arıcılık İthalat İhracat San. Tic. Ltd. Şti."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* 2. Announcement Ticker */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
          <Activity className="w-4 h-4 text-[#f97316]" />
          <h3 className="text-xs font-black uppercase tracking-wider">Duyuru Bandı &amp; Ticker</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1 bg-white px-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Duyuru Bandı Aktif mi?</span>
            <button
              type="button"
              onClick={() => onChange("announcementActive", !values.announcementActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                values.announcementActive ? "bg-orange-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  values.announcementActive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Körük Kampanya Metni</label>
            <input
              type="text"
              value={values.announcement || ""}
              onChange={(e) => onChange("announcement", e.target.value)}
              placeholder="Örn: Paslanmaz Körüklerde Dev Fırsat!"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Genel Duyuru Metni 2</label>
            <input
              type="text"
              value={values.announcement2 || ""}
              onChange={(e) => onChange("announcement2", e.target.value)}
              placeholder="Örn: Fabrikadan Direkt Hızlı Teslimat"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kaydırma Hızı (Saniye)</label>
            <input
              type="number"
              value={values.announcementSpeed ?? 15}
              onChange={(e) => onChange("announcementSpeed", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* 3. Shipping & Campaigns */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
          <Truck className="w-4 h-4 text-[#f97316]" />
          <h3 className="text-xs font-black uppercase tracking-wider">Kargo &amp; Kampanyalar</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bedava Kargo Limiti (TL)</label>
            <input
              type="number"
              value={values.shippingThreshold ?? 5000}
              onChange={(e) => onChange("shippingThreshold", Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kargo Ücreti (TL)</label>
            <input
              type="number"
              value={values.shippingFee ?? 150}
              onChange={(e) => onChange("shippingFee", Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sepet İndirimi Tipi</label>
            <select
              value={values.cartDiscountType || "none"}
              onChange={(e) => onChange("cartDiscountType", e.target.value)}
              className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-bold text-slate-700"
            >
              <option value="none">İndirim Yok</option>
              <option value="percentage">Yüzdesel İndirim (%)</option>
              <option value="fixed">Sabit İndirim Tutarı (TL)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sepet İndirim Değeri</label>
              <input
                type="number"
                value={values.cartDiscountValue ?? 0}
                onChange={(e) => onChange("cartDiscountValue", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Min Sepet Tutarı (TL)</label>
              <input
                type="number"
                value={values.cartDiscountMinAmount ?? 0}
                onChange={(e) => onChange("cartDiscountMinAmount", Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bank Payments */}
      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
          <Building className="w-4 h-4 text-[#f97316]" />
          <h3 className="text-xs font-black uppercase tracking-wider">Banka &amp; Havale Hesap Ayarı</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Havale İndirim Oranı (%)</label>
            <input
              type="number"
              value={values.bankTransferDiscountRate ?? 0}
              onChange={(e) => onChange("bankTransferDiscountRate", Number(e.target.value))}
              placeholder="Örn: 2"
              className={inputClass}
            />
          </div>
          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              ℹ️ Banka Havalesi hesap bilgileri artık dinamik hale getirilmiştir. Hesapları yönetmek için <strong className="text-zinc-200">Ayarlar &gt; İndirimler</strong> sekmesini kullanabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
