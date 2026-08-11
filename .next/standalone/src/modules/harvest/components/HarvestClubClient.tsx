"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Compass, Feather, Calendar, MapPin, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HarvestBatch } from "../types";

const INITIAL_BATCHES: HarvestBatch[] = [
  {
    id: "rekolte-2026-dut",
    title: "2026 İspir Yaylası Ham Dut Pekmezi",
    subtitle: "Tek Rekolte · 2200m Rakım · Geleneksel Bakır Kazan",
    rekolteYear: 2026,
    originVillage: "İspir, Erzurum",
    altitude: "2.200 Metre",
    maxQuota: 500,
    reservedQuota: 432,
    bottlingDate: "Eylül 2026",
    pricePerUnit: 850,
    unitVolume: "750g Cam Kavanoz",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80",
    storyContent: "İspir'in el değmemiş yüksek rakımlı vadilerinde, asırlık dut ağaçlarından gün ağarırken el emeğiyle toplanan meyveler. Hiçbir şeker katkısı veya endüstriyel vakumlama yapılmadan, serin kaynak suyu ve odun ateşinde 12 saat ağır ağır kıvamlandırılır.",
    flavorNotes: ["Koyu Karamel", "Yaban Odun Nüansı", "Hafif Mayhoş Meyvemsilik"],
    isActive: true,
  },
  {
    id: "rekolte-2026-bal",
    title: "2026 Kaçkar Flora Ham Çiçek Balı",
    subtitle: "Ham & Filtresiz · Endemik Yayla Florası · Sınırlı Üretim",
    rekolteYear: 2026,
    originVillage: "Kaçkar Etekleri, Rize",
    altitude: "2.450 Metre",
    maxQuota: 300,
    reservedQuota: 245,
    bottlingDate: "Ağustos 2026",
    pricePerUnit: 1250,
    unitVolume: "850g Özel Ahşap Kutulu Cam",
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=80",
    storyContent: "Endemik 450+ yayla çiçeğinin nektarından oluşan süzme ham bal. Pastaörize edilmemiş, polen ve propolis değerleri korunmuş olarak doğrudan kovanlardan cam kavanozlara aktarılır.",
    flavorNotes: ["Kekik Nektarı", "Dağ Çiçeği Ferahlığı", "Kremsi Doku"],
    isActive: true,
  }
];

export default function HarvestClubClient() {
  const [batches] = useState<HarvestBatch[]>(INITIAL_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState<HarvestBatch | null>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", quantity: 1, notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReservation, setSuccessReservation] = useState<string | null>(null);

  const handlePreOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Lütfen ad, e-posta ve telefon alanlarını doldurunuz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/harvest/pre-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatch.id,
          ...formData
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessReservation(data.reservationCode);
        toast.success("Rekolte ön sipariş rezervasyonunuz kabul edildi.");
      } else {
        toast.error(data.message || "Rezervasyon oluşturulamadı.");
      }
    } catch {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-zinc-950 text-[#1e293b] dark:text-zinc-100 font-sans min-h-screen">
      
      {/* Editorial Hero Header */}
      <section className="relative py-24 md:py-32 overflow-hidden border-b border-amber-900/10 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/5 dark:bg-amber-500/10 border border-amber-900/15 dark:border-amber-500/20 text-[#6b1d2f] dark:text-amber-400 text-xs font-bold uppercase tracking-[0.25em] mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            PEKEFE Geleneksel Rekolte Kulübü
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
            Doğanın Sınırlı Cömertliği: <br className="hidden md:block"/>
            <span className="italic text-[#6b1d2f] dark:text-amber-400 font-normal">2026 Hasat Rezervasyonu</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600 dark:text-zinc-400 font-medium leading-relaxed mb-10">
            PEKEFE rekolte ürünleri endüstriyel bantlarda değil; doğanın iklimine, arıların nektar döngüsüne ve bakır kazan ustalarının sabrına bağlı olarak üretilir. Her rekolte numaralı ve sınırlı miktardadır.
          </p>

          {/* Quick Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-amber-900/10 dark:border-zinc-800 shadow-sm">
              <Compass className="w-6 h-6 text-[#6b1d2f] dark:text-amber-400 mb-3" />
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base mb-1">Garantili Şeffaf Kota</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">Stoklar yapay sayaçlarla değil, gerçek hasat kavanoz kotalarıyla belirlenir.</p>
            </div>
            <div className="p-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-amber-900/10 dark:border-zinc-800 shadow-sm">
              <Feather className="w-6 h-6 text-[#6b1d2f] dark:text-amber-400 mb-3" />
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base mb-1">Numaralı Özel Seri</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">Her kavanoz mühürlü sertifikası ve benzersiz rekolte seri numarasıyla teslim edilir.</p>
            </div>
            <div className="p-6 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-amber-900/10 dark:border-zinc-800 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#6b1d2f] dark:text-amber-400 mb-3" />
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base mb-1">Öncelikli Hasat Teslimatı</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">Şişeleme tamamlandığında soğuk zincir lojistiğiyle ilk size sevk edilir.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Batches Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">Aktif Hasat Kotaları</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">2026 Sezonu Ön Sipariş ve Rezervasyona Açık Seri Listesi</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#6b1d2f] dark:text-amber-400 bg-amber-900/5 dark:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-900/10">
            {batches.length} Aktif Rekolte
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {batches.map((batch) => {
            const remainingQuota = batch.maxQuota - batch.reservedQuota;
            const progressPct = Math.round((batch.reservedQuota / batch.maxQuota) * 100);

            return (
              <div key={batch.id} className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                  {/* Image Container */}
                  <div className="relative h-72 w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                    <Image src={batch.image} alt={batch.title} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#6b1d2f] dark:text-amber-400 shadow-md">
                      {batch.rekolteYear} Hasat Serisi
                    </div>
                    <div className="absolute bottom-4 right-4 bg-slate-950/80 text-white backdrop-blur-md px-4 py-1.5 rounded-xl text-xs font-bold">
                      ₺{batch.pricePerUnit} / {batch.unitVolume}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8">
                    <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-2">{batch.title}</h3>
                    <p className="text-xs font-semibold text-[#6b1d2f] dark:text-amber-400 uppercase tracking-wider mb-4">{batch.subtitle}</p>
                    <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">{batch.storyContent}</p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-3 p-4 bg-[#FAF8F5] dark:bg-zinc-950 rounded-2xl border border-slate-200/60 dark:border-zinc-800 mb-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Menşei</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-[#6b1d2f]" />{batch.originVillage}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Rakım</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5"><Award className="w-3 h-3 text-[#6b1d2f]" />{batch.altitude}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Şişeleme</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3 text-[#6b1d2f]" />{batch.bottlingDate}</span>
                      </div>
                    </div>

                    {/* Flavor Notes */}
                    <div className="mb-6">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tadım & Aromatik Notlar</span>
                      <div className="flex flex-wrap gap-2">
                        {batch.flavorNotes.map((note, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-900/5 dark:bg-amber-500/10 text-[#6b1d2f] dark:text-amber-400 border border-amber-900/10 dark:border-amber-500/20 rounded-full text-xs font-semibold">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quota Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-zinc-400">Rezerve Edilen Kota (%{progressPct})</span>
                        <span className="text-[#6b1d2f] dark:text-amber-400">Kalan: {remainingQuota} Kavanoz</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[#6b1d2f] dark:bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 pt-0">
                  <button
                    onClick={() => {
                      setSelectedBatch(batch);
                      setSuccessReservation(null);
                    }}
                    className="w-full py-4 bg-[#6b1d2f] hover:bg-[#521624] text-white font-bold rounded-2xl shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <span>Rekolte Ön Sipariş Rezerve Et</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Pre-Order Form */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedBatch(null)} />
          
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-xl w-full p-8 z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            
            {successReservation ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Rezervasyonunuz Alındı!</h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  <strong>{selectedBatch.title}</strong> için adınıza özel rekolte kota hakkı tanımlandı.
                </p>
                <div className="p-4 bg-[#FAF8F5] dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 inline-block my-4">
                  <span className="text-xs text-slate-400 block font-bold">REZERVE KODUNUZ</span>
                  <span className="text-xl font-mono font-black text-[#6b1d2f] dark:text-amber-400 tracking-wider">{successReservation}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-500">Şişeleme ve soğuk zincir sevkiyat aşamasında e-posta ve SMS ile bilgilendirileceksiniz.</p>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="px-8 py-3 bg-[#6b1d2f] text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6b1d2f] dark:text-amber-400">ÖN SİPARİŞ REZERVASYON FORMU</span>
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">{selectedBatch.title}</h3>
                  </div>
                  <button onClick={() => setSelectedBatch(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">✕</button>
                </div>

                <form onSubmit={handlePreOrderSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Ad Soyad *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ahmet Yılmaz"
                      className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6b1d2f]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">E-Posta Adresi *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ahmet@example.com"
                        className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6b1d2f]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Telefon Numarası *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0532 000 0000"
                        className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6b1d2f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Kavanoz Adedi</label>
                      <select
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6b1d2f]"
                      >
                        {[1, 2, 3, 5, 10].map(n => (
                          <option key={n} value={n}>{n} Kavanoz</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Tahmini Tutar</label>
                      <div className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-[#6b1d2f] dark:text-amber-400">
                        ₺{selectedBatch.pricePerUnit * formData.quantity}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">Özel İsteniz / Notlar (Opsiyonel)</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ahşap hediye kutusuna isim yazılsın..."
                      className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:border-[#6b1d2f]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#6b1d2f] hover:bg-[#521624] text-white font-bold rounded-2xl shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ön Sipariş Rezervasyonunu Onayla"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
