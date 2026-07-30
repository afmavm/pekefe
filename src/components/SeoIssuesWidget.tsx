"use client";

import { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, ChevronRight, X, Loader2, CheckCircle2, 
  HelpCircle, Link2, FileText, Image as ImageIcon, TextQuote, Save, Sparkles 
} from "lucide-react";
import { toast } from "sonner";

interface SeoIssueItem {
  count: number;
  label: string;
  severity: "high" | "medium" | "low";
  type: "meta" | "alt" | "duplicate" | "wordcount";
}

export default function SeoIssuesWidget() {
  // Dynamic issue counts
  const [counts, setCounts] = useState({
    meta: 8,
    alt: 12,
    duplicate: 5,
    wordcount: 3
  });

  // Modal active state
  const [activeType, setActiveType] = useState<"meta" | "alt" | "duplicate" | "wordcount" | null>(null);

  // Loading state per item being saved
  const [savingId, setSavingId] = useState<string | null>(null);

  // Form states populated on init
  const [metaPages, setMetaPages] = useState([
    { id: "home", name: "Ana Sayfa", path: "/", desc: "", fixed: false },
    { id: "products", name: "Ürünler", path: "/kategoriler", desc: "", fixed: false },
    { id: "about", name: "Hikayemiz", path: "/hikayemiz", desc: "", fixed: false },
    { id: "contact", name: "İletişim", path: "/iletisim", desc: "", fixed: false },
    { id: "blog", name: "Blog", path: "/blog", desc: "", fixed: false },
    { id: "campaigns", name: "Kampanyalar", path: "/kampanyalar", desc: "", fixed: false },
    { id: "b2b", name: "Bayi Portalı (B2B)", path: "/b2b", desc: "", fixed: false },
    { id: "cart", name: "Sepetim", path: "/sepet", desc: "", fixed: false },
  ]);

  const [altImages, setAltImages] = useState([
    { id: "logo", name: "logo.png", location: "Navbar Üst Logo", alt: "", fixed: false },
    { id: "banner", name: "ispir-manzara-hero.png", location: "Ana Sayfa Hero Görseli", alt: "", fixed: false },
    { id: "pekmez", name: "pekefe-dut-pekmezi-kavanoz-tr.jpg", location: "Dut Pekmezi Ürün Görseli", alt: "", fixed: false },
    { id: "bal", name: "pekefe-ispir-bal-kavanoz-tr.jpg", location: "İspir Yayla Balı Detay Görseli", alt: "", fixed: false },
    { id: "fasulye", name: "pekefe-ispir-fasulye-paket-tr.jpg", location: "İspir Kuru Fasulyesi Görseli", alt: "", fixed: false },
  ]);

  const [duplicatePages, setDuplicatePages] = useState([
    { id: "orders", name: "Sipariş Geçmişi", path: "/hesap", currentTitle: "Pekefe", newTitle: "", fixed: false },
    { id: "success", name: "Sipariş Başarılı", path: "/sepet/onay", currentTitle: "Pekefe", newTitle: "", fixed: false },
    { id: "cat1", name: "Kategori: Pekmez", path: "/kategoriler", currentTitle: "Ürünler - Pekefe", newTitle: "", fixed: false },
  ]);

  const [lowWords, setLowWords] = useState([
    { id: "contact", name: "İletişim", path: "/iletisim", currentWords: 84, targetWords: 300, textToAdd: "", fixed: false },
    { id: "faq", name: "Sıkça Sorulan Sorular", path: "/sss", currentWords: 142, targetWords: 300, textToAdd: "", fixed: false },
    { id: "apply", name: "Bayi Başvuru Formu", path: "/b2b", currentWords: 98, targetWords: 300, textToAdd: "", fixed: false },
  ]);

  const modalRef = useRef<HTMLDivElement>(null);

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

  // Fix Meta Description
  const handleSaveMeta = async (id: string, value: string) => {
    if (!value.trim()) {
      toast.error("Lütfen geçerli bir açıklama giriniz.");
      return;
    }
    setSavingId(id);
    try {
      // Simulate API call to save CMS page meta description
      await new Promise(r => setTimeout(r, 1200));
      
      setMetaPages(prev => prev.map(p => p.id === id ? { ...p, fixed: true, desc: value } : p));
      setCounts(prev => ({ ...prev, meta: Math.max(0, prev.meta - 1) }));
      toast.success(`Meta açıklaması başarıyla kaydedildi!`);
    } catch {
      toast.error("Kaydedilirken bir hata oluştu.");
    } finally {
      setSavingId(null);
    }
  };

  // Fix Alt Tag
  const handleSaveAlt = async (id: string, value: string) => {
    if (!value.trim()) {
      toast.error("Alt etiketi boş bırakılamaz.");
      return;
    }
    setSavingId(id);
    try {
      // Simulate API call to save alt text in media or CMS sections
      await new Promise(r => setTimeout(r, 1200));

      setAltImages(prev => prev.map(img => img.id === id ? { ...img, fixed: true, alt: value } : img));
      setCounts(prev => ({ ...prev, alt: Math.max(0, prev.alt - 1) }));
      toast.success(`Görsel alt etiketi başarıyla optimize edildi!`);
    } catch {
      toast.error("Kaydedilirken bir hata oluştu.");
    } finally {
      setSavingId(null);
    }
  };

  // Fix Duplicate Title
  const handleSaveTitle = async (id: string, value: string) => {
    if (!value.trim()) {
      toast.error("Başlık boş bırakılamaz.");
      return;
    }
    setSavingId(id);
    try {
      await new Promise(r => setTimeout(r, 1200));

      setDuplicatePages(prev => prev.map(p => p.id === id ? { ...p, fixed: true, newTitle: value } : p));
      setCounts(prev => ({ ...prev, duplicate: Math.max(0, prev.duplicate - 1) }));
      toast.success(`Sayfa başlığı benzersiz olarak güncellendi!`);
    } catch {
      toast.error("Kaydedilirken bir hata oluştu.");
    } finally {
      setSavingId(null);
    }
  };

  // Fix Word Count
  const handleSaveWords = async (id: string, text: string) => {
    if (text.trim().split(/\s+/).length < 50) {
      toast.error("Lütfen kelime sayısını artırmak için en az 50 kelimelik ek içerik yazın.");
      return;
    }
    setSavingId(id);
    try {
      await new Promise(r => setTimeout(r, 1500));

      const addedCount = text.trim().split(/\s+/).length;
      setLowWords(prev => prev.map(p => p.id === id ? { 
        ...p, 
        fixed: true, 
        currentWords: p.currentWords + addedCount,
        textToAdd: text 
      } : p));
      setCounts(prev => ({ ...prev, wordcount: Math.max(0, prev.wordcount - 1) }));
      toast.success(`Zengin içerik başarıyla eklendi, kelime sayısı limiti aşıldı!`);
    } catch {
      toast.error("Kaydedilirken bir hata oluştu.");
    } finally {
      setSavingId(null);
    }
  };

  // Data mapping for issues list
  const issues: SeoIssueItem[] = [
    { count: counts.meta, label: "Eksik meta açıklaması olan sayfalar", severity: "high", type: "meta" },
    { count: counts.alt, label: "Optimize edilmemiş görsel alt tagları", severity: "medium", type: "alt" },
    { count: counts.duplicate, label: "Yinelenen title tag'ı olan sayfalar", severity: "medium", type: "duplicate" },
    { count: counts.wordcount, label: "Düşük kelime sayısına sahip sayfalar", severity: "low", type: "wordcount" }
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
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Canlı Optimizasyon</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Tespit edilen eksiklikleri doğrudan listelemek ve anında düzeltmek için başlıklara tıklayabilirsiniz.
      </p>

      {/* Issues list rows */}
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
                  toast.success("Tebrikler! Bu alandaki tüm SEO sorunları tamamen çözüldü.");
                }
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition group border border-transparent hover:border-slate-100 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-black w-8 text-center px-1.5 py-0.5 rounded-lg border ${color}`}>
                  {issue.count}
                </span>
                <span className="text-xs text-slate-600 font-semibold group-hover:text-slate-900 transition">{issue.label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {issue.count === 0 ? (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Çözüldü</span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0 transition" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── MODAL DRAWERS FOR DYNAMIC FIXING ─────────────────────────────────── */}
      {activeType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div 
            ref={modalRef} 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {activeType === "meta" && "Eksik Meta Açıklamalarını Düzenle"}
                  {activeType === "alt" && "Optimize Edilmemiş Görsel Alt Taglarını Düzelt"}
                  {activeType === "duplicate" && "Yinelenen Başlık (Title) Etiketlerini Düzelt"}
                  {activeType === "wordcount" && "Düşük Kelime Sayılı Sayfalara İçerik Ekle"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Aşağıdaki alanları doğrudan doldurup kaydederek SEO puanınızı anında artırabilirsiniz.
                </p>
              </div>
              <button 
                onClick={() => setActiveType(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
              
              {/* CASE 1: Meta Descriptions */}
              {activeType === "meta" && (
                <div className="space-y-4">
                  {metaPages.filter(p => !p.fixed).map((page) => {
                    let textInput = "";
                    return (
                      <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-orange-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800">{page.name}</span>
                            <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{page.path}</code>
                          </div>
                          <span className="text-[9px] font-black uppercase text-red-500 tracking-wider">Açıklama Eksik</span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Arama motoru sonuçlarında çıkacak 120-160 karakterlik meta açıklamasını yazın..." 
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 bg-white"
                            onChange={(e) => textInput = e.target.value}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveMeta(page.id, textInput);
                            }}
                          />
                          <button
                            onClick={() => handleSaveMeta(page.id, textInput)}
                            disabled={savingId === page.id}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition"
                          >
                            {savingId === page.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            Kaydet
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CASE 2: Image Alt Tags */}
              {activeType === "alt" && (
                <div className="space-y-4">
                  {altImages.filter(img => !img.fixed).map((img) => {
                    let textInput = "";
                    return (
                      <div key={img.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800">{img.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({img.location})</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-orange-500 tracking-wider">Alt Etiketi Eksik</span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Görseli betimleyen SEO dostu alt metni yazın (örn: Pekefe Logosu)..." 
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                            onChange={(e) => textInput = e.target.value}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveAlt(img.id, textInput);
                            }}
                          />
                          <button
                            onClick={() => handleSaveAlt(img.id, textInput)}
                            disabled={savingId === img.id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition shadow-sm"
                          >
                            {savingId === img.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            Kaydet
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CASE 3: Duplicate Titles */}
              {activeType === "duplicate" && (
                <div className="space-y-4">
                  {duplicatePages.filter(p => !p.fixed).map((page) => {
                    let textInput = "";
                    return (
                      <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800">{page.name}</span>
                            <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{page.path}</code>
                          </div>
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Mevcut: "{page.currentTitle}"</span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Benzersiz ve açıklayıcı bir başlık yazın (örn: Siparişinizi Tamamlayın - Pekefe)..." 
                            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                            onChange={(e) => textInput = e.target.value}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(page.id, textInput);
                            }}
                          />
                          <button
                            onClick={() => handleSaveTitle(page.id, textInput)}
                            disabled={savingId === page.id}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition shadow-sm"
                          >
                            {savingId === page.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            Kaydet
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CASE 4: Low Word Counts */}
              {activeType === "wordcount" && (
                <div className="space-y-4">
                  {lowWords.filter(p => !p.fixed).map((page) => {
                    let textInput = "";
                    return (
                      <div key={page.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TextQuote className="w-4 h-4 text-purple-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-800">{page.name}</span>
                            <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{page.path}</code>
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-500">
                            <span>Mevcut: {page.currentWords} Kelime</span>
                            <span>/</span>
                            <span>Hedef: {page.targetWords}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <textarea
                            placeholder="Arama motoru görünürlüğünü artırmak için bu sayfaya en az 50 kelimelik açıklayıcı ve detaylı bir kurumsal içerik veya SSS metni ekleyin..."
                            rows={3}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white resize-none"
                            onChange={(e) => textInput = e.target.value}
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleSaveWords(page.id, textInput)}
                              disabled={savingId === page.id}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition shadow-sm"
                            >
                              {savingId === page.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              İçerik Ekle & Güncelle
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Modal Footer */}
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
