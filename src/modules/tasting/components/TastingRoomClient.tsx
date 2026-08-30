"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MapPin, Calendar, Clock, Users, ShieldCheck, Award, CheckCircle2, ArrowRight, Loader2, Compass } from "lucide-react";
import { toast } from "sonner";
import { TastingRoomLocation } from "../types";

const LOCATIONS: TastingRoomLocation[] = [
  {
    id: "loc-istanbul",
    city: "İstanbul",
    name: "PEKEFE Bebek Butik Tadım Odası",
    address: "Cevdet Paşa Caddesi No: 42, Bebek, İstanbul",
    image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    availableTimes: ["14:00", "16:00", "18:00", "20:00"],
    maxCapacity: 8,
    experienceName: "Anadolu Hasat & Bal Sommelier Tadım Seansı",
    pricePerPerson: 1250
  },
  {
    id: "loc-[#london]",
    city: "Londra",
    name: "PEKEFE Mayfair Private Gastronomy Room",
    address: "Mount Street No: 18, Mayfair, London W1K",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    availableTimes: ["15:00", "17:30", "19:30"],
    maxCapacity: 6,
    experienceName: "Artisan Anatolian Honey & Molasses Pairing Session",
    pricePerPerson: 1850
  },
  {
    id: "loc-paris",
    city: "Paris",
    name: "PEKEFE Le Marais Salon de Dégustation",
    address: "Rue des Francs-Bourgeois No: 24, 75003 Paris",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    availableTimes: ["14:30", "16:30", "18:30"],
    maxCapacity: 6,
    experienceName: "Dégustation Privée d'Épicerie Fine d'Anatolie",
    pricePerPerson: 1950
  }
];

export default function TastingRoomClient() {
  const [selectedLocation, setSelectedLocation] = useState<TastingRoomLocation>(LOCATIONS[0]);
  const [formData, setFormData] = useState({
    date: "2026-08-15",
    timeSlot: "16:00",
    guestCount: 2,
    fullName: "",
    email: "",
    phone: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReservationCode, setSuccessReservationCode] = useState<string | null>(null);

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasting/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedLocation.id,
          ...formData
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessReservationCode(data.reservationCode);
        toast.success("Tadım odası rezervasyonunuz kabul edildi.");
      } else {
        toast.error(data.message || "Rezervasyon oluşturulamadı.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-zinc-950 text-[#1e293b] dark:text-zinc-100 min-h-screen py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/5 dark:bg-amber-500/10 border border-amber-900/15 dark:border-amber-500/20 text-[#6b1d2f] dark:text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
            <Compass className="w-3.5 h-3.5" />
            Butik Tadım Odası Rezervasyonu
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            İstanbul, Londra & Paris: <span className="italic font-normal text-[#6b1d2f] dark:text-amber-400">Özel Tadım Deneyimi</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
            PEKEFE'nin 2200m rakım ham ballarını, bakır kazan rekolte dut pekmezlerini ve zanaatkar lezzetlerini uzman sommelier eşliğinde özel tadım salonlarımızda keşfedin.
          </p>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex justify-center gap-3 flex-wrap">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={() => {
                setSelectedLocation(loc);
                setFormData(prev => ({ ...prev, timeSlot: loc.availableTimes[0] }));
                setSuccessReservationCode(null);
              }}
              className={`px-6 py-3 rounded-2xl font-serif font-bold text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                selectedLocation.id === loc.id
                  ? "bg-[#6b1d2f] text-white shadow-lg shadow-amber-950/20"
                  : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-amber-900/30"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{loc.city} Salonu</span>
            </button>
          ))}
        </div>

        {/* Selected Location Card & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
          
          {/* Left Column: Location Details */}
          <div className="space-y-6">
            <div className="relative h-72 w-full rounded-2xl overflow-hidden shadow-sm">
              <Image src={selectedLocation.image} alt={selectedLocation.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#6b1d2f] dark:text-amber-400">
                {selectedLocation.city} Flagship
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">TADIM SEANSI GURME PAKETİ</span>
              <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">{selectedLocation.name}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#6b1d2f]" />{selectedLocation.address}</p>
            </div>

            <div className="p-5 bg-[#FAF8F5] dark:bg-zinc-950 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tadım Programı</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedLocation.experienceName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Maksimum Masa Kapasitesi</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedLocation.maxCapacity} Kişi (Özel Salon)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Kişi Başı Tadım Bedeli</span>
                <span className="font-bold text-[#6b1d2f] dark:text-amber-400 text-sm">₺{selectedLocation.pricePerPerson}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="space-y-6">
            {successReservationCode ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold">Rezervasyon Onaylandı</h3>
                <p className="text-xs text-slate-500"><strong>{selectedLocation.name}</strong> tadım salonu rezervasyon kodunuz:</p>
                <div className="p-4 bg-[#FAF8F5] dark:bg-zinc-950 rounded-2xl border border-slate-200 inline-block">
                  <span className="text-xl font-mono font-black text-[#6b1d2f] dark:text-amber-400 tracking-wider">{successReservationCode}</span>
                </div>
                <p className="text-xs text-slate-400">Detaylar e-posta ve SMS ile iletilmiştir.</p>
                <button onClick={() => setSuccessReservationCode(null)} className="px-6 py-2.5 bg-[#6b1d2f] text-white font-bold rounded-xl text-xs uppercase">Yeni Rezervasyon</button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-serif font-bold mb-6 text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-3">Tarih & İletişim Formu</h3>

                <form onSubmit={handleReservation} className="space-y-4 text-xs font-medium">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Tarih *</label>
                      <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Tadım Saati *</label>
                      <select value={formData.timeSlot} onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })} className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
                        {selectedLocation.availableTimes.map(t => (
                          <option key={t} value={t}>{t} Seansı</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Misafir Sayısı *</label>
                      <select value={formData.guestCount} onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
                        {[1, 2, 3, 4, 6].map(n => (
                          <option key={n} value={n}>{n} Kişi</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Toplam Tutar</label>
                      <div className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl font-bold text-[#6b1d2f] dark:text-amber-400">
                        ₺{selectedLocation.pricePerPerson * formData.guestCount}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider mb-1">Ad Soyad *</label>
                    <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Canan Kaya" className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">E-Posta *</label>
                      <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="canan@example.com" className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider mb-1">Telefon *</label>
                      <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0532 000 0000" className="w-full px-4 py-3 bg-[#FAF8F5] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl" />
                    </div>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#6b1d2f] hover:bg-[#521624] text-white font-bold rounded-2xl transition-transform active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer mt-4">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Rezervasyon Başvurusunu Onayla</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
