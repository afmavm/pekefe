"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle, ChevronRight, X, Loader2,
  Link2, FileText, Image as ImageIcon, TextQuote, Save, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface SeoIssueItem {
  count: number;
  label: string;
  severity: "high" | "medium" | "low";
  type: "meta" | "alt" | "duplicate" | "wordcount";
}

export default function SeoIssuesWidget() {
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [counts, setCounts] = useState({
    meta: 0,
    alt: 0,
    duplicate: 0,
    wordcount: 0,
  });

  const [activeType, setActiveType] = useState<"meta" | "alt" | "duplicate" | "wordcount" | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [metaPages, setMetaPages] = useState<any[]>([]);
  const [altImages, setAltImages] = useState<any[]>([]);
  const [duplicatePages, setDuplicatePages] = useState<any[]>([]);
  const [lowWords, setLowWords] = useState<any[]>([]);

  const modalRef = useRef<HTMLDivElement>(null);

  const fetchSeoAudit = async () => {
    try {
      const res = await fetch(`/api/admin/seo-audit?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.counts) {
        setCounts(data.counts);
        setMetaPages(data.metaPages || []);
        setAltImages(data.altImages || []);
        setDuplicatePages(data.duplicatePages || []);
        setLowWords(data.lowWords || []);
      }
    } catch (e) {
      console.error("SEO audit fetch error:", e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchSeoAudit();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setActiveType(null);
      }
    }
    if (activeType) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeType]);

  const handleSaveSeoItem = async (
    type: "meta" | "alt" | "duplicate" | "wordcount",
    id: string,
    value: string
  ) => {
    if (!value.trim()) {
      toast.error("Lütfen geçerli bir değer giriniz.");
      return;
    }
    if (type === "wordcount" && value.trim().split(/\s+/).length < 15) {
      toast.error("Lütfen kelime sayısını artırmak için en az 15 kelimelik ek açıklama yazın.");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch("/api/admin/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, value }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Kaydedilirken bir hata oluştu.");
        return;
      }

      toast.success("SEO verisi veritabanına başarıyla kaydedildi!");
      await fetchSeoAudit();
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setSavingId(null);
    }
  };

  const issues: SeoIssueItem[] = [
    { count: counts.meta, label: "Eksik meta açıklaması olan ürünler", severity: "high", type: "meta" },
    { count: counts.alt, label: "Anahtar kelimesi / alt etiketi eksik ürünler", severity: "medium", type: "alt" },
    { count: counts.duplicate, label: "Eksik veya yinelenen SEO başlığı olan ürünler", severity: "medium", type: "duplicate" },
    { count: counts.wordcount, label: "Kısa açıklamaya sahip ürünler", severity: "low", type: "wordcount" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-700">SEO Denetim & İyileştirme Paneli</h2>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-0.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
            {loadingAudit ? "Taranıyor..." : "Gerçek Katalog Taraması"}
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Katalogdaki gerçek ürün ve sayfa verileri taranarak tespit edilen eksiklikleri doğrudan düzenleyebilirsiniz.
      </p>

      <div className="space-y-1">
        {issues.map((issue) => {
          const color =
            issue.severity === "high"
              ? "text-red-600 bg-red-50 border-red-100"
              : issue.severity === "medium"
              ? "text-orange-600 bg-orange-50 border-orange-100"
              : "text-blue-600 bg-blue-50 border-blue-100";

          return (
            <button
              key={issue.type}
              onClick={() => {
                if (issue.count > 0) {
                  setActiveType(issue.type);
                } else {
                  toast.success("Tebrikler! Bu alandaki tüm SEO kontrolleri temiz.");
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group border border-transparent hover:border-slate-100 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-black w-8 text-center px-1.5 py-0.5 rounded-lg border ${color}`}>
                  {issue.count}
                </span>
                <span className="text-xs text-slate-600 font-semibold group-hover:text-slate-900 transition">
                  {issue.label}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {issue.count === 0 ? (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Tamamlandı
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {activeType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {activeType === "meta" && "Eksik Meta Açıklamalarını Düzenle"}
                  {activeType === "alt" && "SEO Anahtar Kelimeleri & Görsel Alt Etiketlerini Düzelt"}
                  {activeType === "duplicate" && "Eksik / Yinelenen SEO Başlıklarını (Title) Düzelt"}
                  {activeType === "wordcount" && "Kısa Ürün Açıklamalarını Zenginleştir"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Değişiklikler doğrudan ürün veritabanına kaydedilir.
                </p>
              </div>
              <button
                onClick={() => setActiveType(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/30">
              {activeType === "meta" &&
                metaPages.map((page) => {
                  let textInput = page.desc || "";
                  return (
                    <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">{page.name}</span>
                          <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            {page.path}
                          </code>
                        </div>
                        <span className="text-[9px] font-black uppercase text-red-500 tracking-wider">Açıklama Eksik</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={page.desc}
                          placeholder="120-160 karakterlik SEO meta açıklamasını yazın..."
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 bg-white"
                          onChange={(e) => {
                            textInput = e.target.value;
                          }}
                        />
                        <button
                          onClick={() => handleSaveSeoItem("meta", page.id, textInput)}
                          disabled={savingId === page.id}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition"
                        >
                          {savingId === page.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Kaydet
                        </button>
                      </div>
                    </div>
                  );
                })}

              {activeType === "alt" &&
                altImages.map((img) => {
                  let textInput = img.alt || "";
                  return (
                    <div key={img.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">{img.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({img.location})</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-orange-500 tracking-wider">Etiket Eksik</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={img.alt}
                          placeholder="Örn: İspir Dut Pekmezi, Doğal Gün Pekmezi, PEKEFE"
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                          onChange={(e) => {
                            textInput = e.target.value;
                          }}
                        />
                        <button
                          onClick={() => handleSaveSeoItem("alt", img.id, textInput)}
                          disabled={savingId === img.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition shadow-sm"
                        >
                          {savingId === img.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Kaydet
                        </button>
                      </div>
                    </div>
                  );
                })}

              {activeType === "duplicate" &&
                duplicatePages.map((page) => {
                  let textInput = page.newTitle || "";
                  return (
                    <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">{page.name}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">
                          Mevcut: "{page.currentTitle}"
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={page.newTitle}
                          placeholder="Benzersiz SEO başlığı yazın..."
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                          onChange={(e) => {
                            textInput = e.target.value;
                          }}
                        />
                        <button
                          onClick={() => handleSaveSeoItem("duplicate", page.id, textInput)}
                          disabled={savingId === page.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition shadow-sm"
                        >
                          {savingId === page.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Kaydet
                        </button>
                      </div>
                    </div>
                  );
                })}

              {activeType === "wordcount" &&
                lowWords.map((page) => {
                  let textInput = "";
                  return (
                    <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TextQuote className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">{page.name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-500">
                          <span>Mevcut: {page.currentWords} Kelime</span>
                          <span>/</span>
                          <span>Hedef: {page.targetWords}+</span>
                        </div>
                      </div>
                      <textarea
                        placeholder="Ürün açıklamasını zenginleştirmek için en az 15 kelimelik bilgi ekleyin..."
                        rows={3}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white resize-none"
                        onChange={(e) => {
                          textInput = e.target.value;
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSaveSeoItem("wordcount", page.id, textInput)}
                          disabled={savingId === page.id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition shadow-sm"
                        >
                          {savingId === page.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          İçerik Ekle & Güncelle
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200/50 flex justify-end">
              <button
                onClick={() => setActiveType(null)}
                className="px-5 py-2.5 bg-slate-800 text-white hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
