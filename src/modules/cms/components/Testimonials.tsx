"use client";

import React, { useState, useEffect } from "react";
import { Star, UserCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface TestimonialsProps {
  currentUser: { name: string; email: string } | null;
}

export default function Testimonials({ currentUser }: TestimonialsProps) {
  const t = useTranslations("Home");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [revName, setRevName] = useState("");
  const [revLoc, setRevLoc] = useState("");
  const [revText, setRevText] = useState("");
  const [revRating, setRevRating] = useState(5);

  useEffect(() => {
    const defaultReviews = [
      { name: "Mehmet Yılmaz", location: "Erzurum – Profesyonel Arıcı", stars: 5, text: "30 yıldır Erzurum'da aktif arıcılık yapıyorum. ATAK Pro paslanmaz körüğü geçen ay satın aldım. Sabahtan akşama kadar tek bir kere bile sönme yapmadı. Kalın paslanmaz sacı ve çift hava kanallı harika." },
      { name: "Ahmet Demir", location: "Muğla – Çam Balı Üreticisi", stars: 5, text: "3 katmanlı arıcı elbisesini satın aldım. Kumaş kalınlığı ve hava alabilir yapısı çok başarılı. Sıcak havalarda hiç terletmiyor ve arıların iğnelerine karşı tam bir zırh gibi koruyor." },
      { name: "Hasan Kaya", location: "İzmir – Hobi Arıcısı", stars: 5, text: "Kovan bakım seti sayesinde arılıkta ihtiyacım olan her şey tek bir çantada toplandı. Çıta çıkarma pensi ve keskileri oldukça sağlam, paslanmaz çelik kalitesi çok iyi. Tavsiye ederim." }
    ];
    
    try {
      const savedReviews = localStorage.getItem("userReviews");
      let customReviews = [];
      if (savedReviews) {
        customReviews = JSON.parse(savedReviews);
      }
      setReviews([...customReviews, ...defaultReviews]);
    } catch (e) {
      setReviews(defaultReviews);
    }
  }, []);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = currentUser?.name || revName;
    if (!finalName || !revLoc || !revText) return;

    try {
      const savedReviews = localStorage.getItem("userReviews");
      let customReviews = [];
      if (savedReviews) {
        customReviews = JSON.parse(savedReviews);
      }

      const newReview = {
        name: finalName,
        location: revLoc,
        stars: revRating,
        text: revText
      };

      customReviews.unshift(newReview);
      localStorage.setItem("userReviews", JSON.stringify(customReviews));
      toast.success("Yorumunuz başarıyla yayınlandı! Teşekkür ederiz.");

      const defaultReviews = [
        { name: "Mehmet Yılmaz", location: "Erzurum – Profesyonel Arıcı", stars: 5, text: "30 yıldır Erzurum'da aktif arıcılık yapıyorum. ATAK Pro paslanmaz körüğü geçen ay satın aldım. Sabahtan akşama kadar tek bir kere bile sönme yapmadı. Kalın paslanmaz sacı ve çift hava kanallı harika." },
        { name: "Ahmet Demir", location: "Muğla – Çam Balı Üreticisi", stars: 5, text: "3 katmanlı arıcı elbisesini satın aldım. Kumaş kalınlığı ve hava alabilir yapısı çok başarılı. Sıcak havalarda hiç terletmiyor ve arıların iğnelerine karşı tam bir zırh gibi koruyor." },
        { name: "Hasan Kaya", location: "İzmir – Hobi Arıcısı", stars: 5, text: "Kovan bakım seti sayesinde arılıkta ihtiyacım olan her şey tek bir çantada toplandı. Çıta çıkarma pensi ve keskileri oldukça sağlam, paslanmaz çelik kalitesi çok iyi. Tavsiye ederim." }
      ];
      setReviews([newReview, ...customReviews.slice(1), ...defaultReviews]);

      setIsReviewOpen(false);
      setRevName("");
      setRevLoc("");
      setRevText("");
      setRevRating(5);
    } catch (err) {
      toast.error("Yorum kaydedilemedi.");
    }
  };

  return (
    <section id="yorumlar" className="py-24 sm:py-32 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16 max-w-xl mx-auto relative">
          <span className="inline-flex items-center gap-2.5 glass-amber rounded-full px-5 py-2.5 text-xs sm:text-sm font-black text-amber-655 dark:text-amber-450 tracking-[0.15em] uppercase mb-4 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" /> {t("reviews_badge")}
          </span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-white leading-tight">
            {t("reviews_title_1")} <span className="text-gradient">{t("reviews_title_2")}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-4 leading-relaxed font-body">
            {t("reviews_desc")}
          </p>
          <button
            type="button"
            onClick={() => setIsReviewOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-orange-500 hover:bg-amber-400 text-[#0B0F17] text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-amber-500/10"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Yorum Yaz</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r, idx) => {
            const initials = r.name.split(' ').map((n: string) => n[0]).join('');
            const colors = ['from-amber-500 to-amber-700', 'from-slate-600 to-slate-800', 'from-emerald-500 to-emerald-700', 'from-blue-500 to-blue-700'];
            const colorClass = colors[idx % colors.length];

            return (
              <div 
                key={idx} 
                className={`bg-white dark:bg-slate-900/40 border rounded-3xl p-6 relative flex flex-col justify-between hover:border-amber-500/40 dark:hover:border-amber-500/20 transition-all duration-300 ${idx === 1 ? 'border-amber-500/45 shadow-lg shadow-slate-100 dark:shadow-amber-500/5' : 'border-slate-200 dark:border-slate-800'} shadow-sm dark:shadow-none`}
              >
                {idx === 1 && (
                  <div className="absolute -top-3 left-6 bg-orange-500 text-[#0B0F17] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    ÖNE ÇIKAN
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex gap-0.5 text-amber-600 dark:text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < r.stars ? 'fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-slate-800 dark:text-zinc-100 text-sm leading-relaxed font-body italic text-left">
                    "{r.text}"
                  </p>
                </div>
                <div className={`border-t pt-4 mt-6 flex items-center gap-3 ${idx === 1 ? 'border-amber-500/25' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-[#0B0F17] font-bold text-sm shrink-0`}>
                    {initials}
                  </div>
                  <div className="text-left">
                    <div className="text-slate-900 dark:text-white font-bold text-sm">{r.name}</div>
                    <div className="text-slate-550 dark:text-slate-550 text-xs">{r.location}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 flex items-center gap-1 font-bold">
                      ✓ {t("reviews_verified")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic review writing modal */}
        {isReviewOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div onClick={() => setIsReviewOpen(false)} className="absolute inset-0 bg-[#0B0F17]/90 backdrop-blur-sm"></div>
            
            <div className="relative glass border border-amber-500/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 animate-fade-up">
              
              <button 
                type="button"
                onClick={() => setIsReviewOpen(false)} 
                className="absolute top-4 right-4 w-9 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-5 text-left">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl">{t("review_title")}</h3>
                <p className="text-xs text-slate-500 mt-1">{t("review_desc")}</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 font-semibold mb-1" htmlFor="rev-name">Ad Soyad *</label>
                    {currentUser ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{currentUser.name}</span>
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        id="rev-name" 
                        required 
                        value={revName}
                        onChange={(e) => setRevName(e.target.value)}
                        placeholder="Mehmet Yılmaz" 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500/45 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-550 outline-none transition-colors" 
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-zinc-400 font-semibold mb-1" htmlFor="rev-loc">Şehir / Kovan Sayısı *</label>
                    <input 
                      type="text" 
                      id="rev-loc" 
                      required 
                      value={revLoc}
                      onChange={(e) => setRevLoc(e.target.value)}
                      placeholder="Erzurum - 80 Kovan" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500/45 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-550 outline-none transition-colors" 
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-xs text-slate-600 dark:text-zinc-400 font-semibold mb-2">Değerlendirme Puanı *</label>
                  <div className="flex gap-2 text-2xl text-slate-500">
                    {[1, 2, 3, 4, 5].map(idx => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setRevRating(idx)}
                        className="star-btn transition-transform duration-150 hover:scale-115 cursor-pointer"
                      >
                        <Star 
                          className={`w-6 h-6 ${idx <= revRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-zinc-400 font-semibold mb-1" htmlFor="rev-text">Görüşleriniz *</label>
                  <textarea 
                    id="rev-text" 
                    required 
                    value={revText}
                    onChange={(e) => setRevText(e.target.value)}
                    rows={3}
                    placeholder="Ürün kalitesi veya kargo hızı hakkındaki görüşleriniz..." 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500/45 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-550 outline-none transition-colors resize-none" 
                  ></textarea>
                </div>

                <button type="submit" className="w-full bg-orange-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm py-3.5 rounded-xl transition-all">
                  {t("review_submit")}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
