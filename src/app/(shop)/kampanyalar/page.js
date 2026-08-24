"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { Toast } from "@/components/ui/Toast";

export default function Kampanyalar() {
  const [campaigns, setCampaigns] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch campaigns
        const campRes = await fetch("/api/campaigns");
        if (campRes.ok) {
          const campData = await campRes.json();
          setCampaigns(Array.isArray(campData) ? campData.filter(c => c.isActive) : []);
        }

        // Fetch products for campaign showcase
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const list = Array.isArray(prodData) ? prodData : (prodData?.products || []);
          
          // Filter products with active campaigns or discounts
          const discounted = list.filter(p => 
            p.isCampaignActive || 
            p.is_campaign_active || 
            p.is_discounted || 
            (p.oldPrice && p.price && Number(p.oldPrice) > Number(p.price)) ||
            (p.list_price && p.price && Number(p.list_price) > Number(p.price))
          );
          setProducts(discounted.length > 0 ? discounted : list.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching campaign data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToast({
      isOpen: true,
      message: `"${code}" kupon kodu panoya kopyalandı! Sepet sayfasında kullanabilirsiniz.`,
      type: "success"
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setToast({
          isOpen: true,
          message: data.error || "Abonelik oluşturulurken bir hata oluştu.",
          type: "error",
        });
        return;
      }

      setSubscribed(true);
      setToast({
        isOpen: true,
        message: data.message || "Ayrıcalık bültenimize kaydoldunuz. Teşekkür ederiz.",
        type: "success",
      });
      setEmail("");
    } catch (err) {
      console.error("Newsletter error:", err);
      setToast({
        isOpen: true,
        message: "Bağlantı hatası oluştu. Lütfen tekrar deneyin.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#fcfaf7] dark:bg-slate-950 text-slate-900 dark:text-white antialiased min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[48vh] min-h-[400px] max-h-[520px] flex items-center justify-center overflow-hidden">
        <Image
          src="/uploads/ispir-yedi-goller-kackar-manzara.webp"
          alt="İspir Vadisi Manzarası"
          fill
          priority
          sizes="100vw"
          className="object-cover filter brightness-[0.4] contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d121c]/90 via-[#3d121c]/50 to-transparent z-10"></div>

        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-black tracking-[0.25em] uppercase px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="material-symbols-outlined text-sm">local_activity</span> CANLI KAMPANYA & AYRICALIKLAR
          </span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-black leading-tight tracking-tight">
            Özel Fırsatlar & Kupon Kodları
          </h1>
          <p className="font-light text-amber-100/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            İspir'in hakiki lezzetlerinde geçerli indirim kuponları, sezonluk fırsat paketleri ve ücretsiz kargo ayrıcalıklarını hemen kullanın.
          </p>
        </div>
      </section>

      {/* 2. AKTİF KUPON KARTLARI (TICKET CODES) */}
      <section className="py-12 sm:py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-[#6b1d2f] dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest block mb-1">
              HEDİYE & İNDİRİM BİLETLERİ
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Kullanıma Hazır İndirim Kuponları
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Aşağıdaki kupon kodunu tek tıkla kopyalayın ve sepet aşamasında kupon kutucuğuna yapıştırarak anında indirim kazanın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {campaigns.length > 0 ? (
            campaigns.map((camp) => (
              <div
                key={camp.id || camp.code}
                className="relative bg-white dark:bg-slate-900 border-2 border-dashed border-rose-200 dark:border-slate-700 hover:border-[#6b1d2f] dark:hover:border-amber-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group overflow-hidden"
              >
                {/* Perforation notch circles for ticket look */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#fcfaf7] dark:bg-slate-950 rounded-full border-r border-rose-200 dark:border-slate-700"></div>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#fcfaf7] dark:bg-slate-950 rounded-full border-l border-rose-200 dark:border-slate-700"></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-rose-50 dark:bg-slate-800 text-[#6b1d2f] dark:text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-rose-200/60 dark:border-slate-700 tracking-wider">
                      {camp.type === "percentage" ? `%${camp.value} İNDİRİM` : camp.type === "fixed" ? `₺${camp.value} İNDİRİM` : "ÜCRETSİZ KARGO"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {camp.minOrder > 0 ? `Min. ₺${camp.minOrder}` : "Limitsiz"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-[#6b1d2f] dark:group-hover:text-amber-400 transition-colors leading-snug">
                      {camp.name}
                    </h3>
                    {camp.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {camp.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                    <span className="font-mono font-black text-xs text-slate-800 dark:text-slate-200 tracking-wider">
                      {camp.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(camp.code)}
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer ${
                        copiedCode === camp.code
                          ? "bg-emerald-600 text-white"
                          : "bg-[#6b1d2f] hover:bg-[#831843] text-white"
                      }`}
                    >
                      {copiedCode === camp.code ? "KOPYALANDI ✓" : "KODU KOPYALA"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-40">confirmation_number</span>
              <p className="text-sm font-bold">Şu anda aktif kupon kodu bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. KAMPANYALI & İNDİRİMLİ ÜRÜNLER VİTRİNİ */}
      <section className="py-12 sm:py-16 bg-white dark:bg-slate-900 border-y border-slate-200/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[#6b1d2f] dark:text-amber-400 font-extrabold text-xs uppercase tracking-widest block mb-1">
                FIRSAT MAHSULLERİ
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Kampanyalı & İndirimli Gurme Ürünler
              </h2>
            </div>
            <Link
              href="/kategoriler"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#6b1d2f] dark:text-amber-400 hover:underline"
            >
              <span>Tüm Ürünleri Gör</span>
              <span className="material-symbols-outlined text-sm">east</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id || product.slug}
                product={product}
                id={product.id}
                name={product.name}
                desc={product.desc}
                shortDesc={product.shortDesc}
                price={product.price}
                oldPrice={product.oldPrice || product.list_price}
                list_price={product.list_price}
                badgeText1={product.badgeText1}
                badgeText2={product.badgeText2}
                isCampaignActive={product.isCampaignActive}
                discount_end_date={product.discount_end_date}
                discount_start_date={product.discount_start_date}
                variants={product.variants}
                image={product.image}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. ÖDEME & KARGO AYRICALIKLARI (BANNER) */}
      <section className="py-12 sm:py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div
          style={{ backgroundColor: "#3d121c", color: "#ffffff" }}
          className="rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-amber-500/20"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            <div className="lg:col-span-2 space-y-4">
              <span className="text-amber-400 font-black text-xs uppercase tracking-widest block font-mono">
                ÖZEL SEPET AVANTAJLARI
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-white leading-tight">
                2000 TL Üzeri Ücretsiz Kargo & Havale İndirimi
              </h2>
              <p className="text-amber-100 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
                Tüm siparişlerinizde 2000 TL sepet tutarını aştığınızda kargo ücreti tarafımızdan karşılanır. Ayrıca banka havalesi / EFT ile yapacağınız ödemelerde anında ek sepet indirimi uygulanır.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <Link
                href="/kategoriler"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-7 py-4 rounded-xl text-xs uppercase tracking-wider font-black transition-all shadow-lg active:scale-95 text-center shrink-0"
              >
                <span>Alışverişe Başla</span>
                <span className="material-symbols-outlined text-sm">shopping_bag</span>
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all border border-white/20 text-center shrink-0"
              >
                <span>Toptan Bayi Talebi</span>
                <span className="material-symbols-outlined text-sm">business</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 5. E-POSTA BÜLTEN ABONELİĞİ */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <span className="text-[#6b1d2f] dark:text-amber-400 font-black text-xs uppercase tracking-widest block">
            BÜLTEN AYRICALIĞI
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Yeni Hasat Kampanyalarını Kaçırmayın
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
            Erzurum İspir'in yeni sezon hasat takvimi ve özel kupon kodları yayınlandığında ilk siz haberdar olun.
          </p>

          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#6b1d2f] outline-none text-xs font-semibold"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#6b1d2f] hover:bg-[#831843] text-white px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm"
              >
                {submitting ? "..." : "Kayıt Ol"}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl max-w-md mx-auto text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              ✓ Ayrıcalık bültenimize kaydoldunuz. Kampanyaları e-postanıza ileteceğiz.
            </div>
          )}
        </div>
      </section>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}


