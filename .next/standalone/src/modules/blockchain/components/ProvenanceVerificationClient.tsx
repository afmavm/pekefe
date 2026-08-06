"use client";

import React, { useState, useEffect } from "react";
import { Search, ShieldCheck, CheckCircle2, Cpu, MapPin, Award, FileText, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ProvenanceRecord } from "../types";

const MOCK_PROVENANCE_RECORD: ProvenanceRecord = {
  verificationCode: "PKF-NFT-2026-9842",
  nftTokenId: "#9842",
  blockHash: "0x8f3a92b4c1e7d5f0a2938475610b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
  blockNumber: 19842015,
  timestamp: "2026-07-15 08:30:00 UTC",
  productName: "2026 İspir Yaylası Sınırlı Rekolte Dut Pekmezi",
  batchNumber: "LOT-2026-ISP-04",
  rekolteYear: 2026,
  totalJarsInBatch: 500,
  jarNumber: 142,
  labAnalysis: {
    c4SugarTest: "%0.00 (Tamamen Doğal Sükrozsuz)",
    propolisRating: "98.4 / 100",
    diastaseValue: "24.2 (Yüksek Canlılık)",
    moistureRate: "%16.2 (İdeal Kıvam)",
    pollenCount: "450+ Endemik Tür"
  },
  gps: {
    latitude: 40.4852,
    longitude: 40.9984,
    locationName: "İspir Yaylası, Erzurum",
    altitudeMeters: 2200,
    producerName: "İlhan Efe & Zanaatkar Arıcı Ailesi"
  },
  certifier: "TÜBİTAK MAM & Akredite Gıda Analiz Laboratuvarı",
  blockchainNetwork: "Polygon (POS) Immutable Ledger"
};

export default function ProvenanceVerificationClient() {
  const [inputCode, setInputCode] = useState("PKF-NFT-2026-9842");
  const [record, setRecord] = useState<ProvenanceRecord | null>(MOCK_PROVENANCE_RECORD);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) {
      toast.error("Lütfen kavanoz doğrulama kodunu giriniz.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/blockchain/verify/${encodeURIComponent(inputCode.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRecord(data.record);
        toast.success("Blokzincir doğrulama kaydı getirildi.");
      } else {
        toast.error(data.message || "Kod doğrulanamadı.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-zinc-950 text-[#1e293b] dark:text-zinc-100 min-h-screen py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-900/5 dark:bg-amber-500/10 border border-amber-900/15 dark:border-amber-500/20 text-[#6b1d2f] dark:text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
            <Cpu className="w-3.5 h-3.5" />
            Blokzincir Menşei & NFT Doğrulama
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
            Şeffaf Güven: <span className="italic font-normal text-[#6b1d2f] dark:text-amber-400">Kavanoz Doğrulama</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-zinc-400">
            Kavanoz kapağınızdaki veya ahşap kutunuzdaki doğrulama kodunu girerek laboratuvar analizlerini, GPS rakım verisini ve blokzincir menşei kaydını sorgulayın.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleVerify} className="max-w-xl mx-auto flex gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Örn: PKF-NFT-2026-9842"
            className="flex-1 px-4 py-3 bg-transparent text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none uppercase tracking-wider"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-[#6b1d2f] hover:bg-[#521624] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Sorgula</>}
          </button>
        </form>

        {/* Verification Result Portal */}
        {record && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Verification Status Card */}
            <div className="bg-white dark:bg-zinc-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">DOĞRULANMIŞ ORİJİNAL REKOLTE</span>
                    <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">{record.productName}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-zinc-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <span>Kavanoz No: {record.jarNumber} / {record.totalJarsInBatch}</span>
                </div>
              </div>

              {/* Blockchain Metadata Ledger */}
              <div className="mt-6 space-y-3">
                <div className="text-xs font-mono bg-slate-950 text-emerald-400 p-4 rounded-2xl overflow-x-auto space-y-1">
                  <div><span className="text-slate-500">BLOCK_HASH:</span> {record.blockHash}</div>
                  <div><span className="text-slate-500">BLOCK_NUM:</span> #{record.blockNumber} | <span className="text-slate-500">NFT_TOKEN:</span> {record.nftTokenId}</div>
                  <div><span className="text-slate-500">TIMESTAMP:</span> {record.timestamp} | <span className="text-slate-500">NETWORK:</span> {record.blockchainNetwork}</div>
                </div>
              </div>
            </div>

            {/* Lab Analysis & GPS Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Lab Analysis Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-[#6b1d2f] dark:text-amber-400 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <Award className="w-5 h-5" />
                  <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">Akredite Laboratuvar Analizi</h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">C4 Şeker Oranı (Tağşiş Testi)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{record.labAnalysis.c4SugarTest}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">Propolis / Polen İndeksi</span>
                    <span className="font-bold text-slate-900 dark:text-white">{record.labAnalysis.propolisRating}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">Diastaz Aktivite Değeri</span>
                    <span className="font-bold text-slate-900 dark:text-white">{record.labAnalysis.diastaseValue}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">Nem & Kıvam Değeri</span>
                    <span className="font-bold text-slate-900 dark:text-white">{record.labAnalysis.moistureRate}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">Sertifikalandıran Kurum: {record.certifier}</p>
              </div>

              {/* GPS & Producer Origin Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-2 text-[#6b1d2f] dark:text-amber-400 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <MapPin className="w-5 h-5" />
                  <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">Hasat GPS & Zanaatkar Bilgisi</h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">Hasat Yeri & Köy</span>
                    <span className="font-bold text-slate-900 dark:text-white">{record.gps.locationName}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">Rakım Yüksekliği</span>
                    <span className="font-bold text-slate-900 dark:text-white">{record.gps.altitudeMeters} Metre</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">GPS Koordinatları</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{record.gps.latitude}° N, {record.gps.longitude}° E</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#FAF8F5] dark:bg-zinc-950 rounded-xl">
                    <span className="text-slate-500 font-medium">Zanaatkar Üretici</span>
                    <span className="font-bold text-[#6b1d2f] dark:text-amber-400">{record.gps.producerName}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
