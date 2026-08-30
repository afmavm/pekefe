"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clearCart } from "@/utils/cartStorage";
import { CheckCircle2, PackageCheck, Truck, Award, Coins, MapPin, CreditCard, ArrowRight, Home, ShoppingBag, ShieldCheck } from "lucide-react";

function SepetOnayContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    let loaded = false;
    try {
      let storedData = localStorage.getItem("pekefe_completed_order") || sessionStorage.getItem("pekefe_completed_order");
      if (!storedData && typeof document !== "undefined") {
        const match = document.cookie.match(new RegExp('(?:^|; )pekefe_completed_order=([^;]*)'));
        if (match && match[1]) storedData = decodeURIComponent(match[1]);
      }
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (!queryOrderId || parsed.orderId === queryOrderId) {
          setCompletedOrder(parsed);
          loaded = true;
        }
      }
    } catch (e) {
      console.error("Error reading completed order from storage:", e);
    }

    // If queryOrderId is provided, fetch latest details from orders API
    if (queryOrderId) {
      fetch(`/api/orders?personal=true`)
        .then((r) => (r.ok ? r.json() : []))
        .then((ordersList) => {
          if (Array.isArray(ordersList)) {
            const found = ordersList.find((o) => o.id === queryOrderId || o.orderNumber === queryOrderId);
            if (found) {
              setCompletedOrder((prev) => ({
                ...prev,
                orderId: found.id || queryOrderId,
                date: found.date ? new Date(found.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : prev?.date,
                total: Number(found.total ?? found.amount ?? 0),
                subtotal: Number(found.total ?? found.amount ?? 0),
                shippingCost: Number(found.shippingFee || 0),
                paymentMethod: found.method === "Banka Havalesi" ? "bankTransfer" : found.method === "Açık Hesap" ? "openAccount" : "creditCard",
                cargoCompany: found.cargoCompany || prev?.cargoCompany || "Yurtiçi Kargo",
                items: Array.isArray(found.items) && found.items.length > 0 ? found.items : prev?.items || [],
                shippingAddress: {
                  name: found.client || found.customerName || prev?.shippingAddress?.name,
                  address: found.address || prev?.shippingAddress?.address,
                  phone: found.phone || prev?.shippingAddress?.phone,
                }
              }));
            }
          }
        })
        .catch((err) => console.error("Error fetching order by query id:", err));
    }

    clearCart();
  }, [queryOrderId]);

  const orderNum = completedOrder?.orderId || "PKF-" + Math.floor(100000 + Math.random() * 900000);
  const orderDate = completedOrder?.date || new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const items = completedOrder?.items || [];
  const subtotal = completedOrder?.subtotal ?? items.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
  const shippingCost = completedOrder?.shippingCost ?? 0;
  const total = completedOrder?.total ?? (subtotal + shippingCost);
  const shippingAddress = completedOrder?.shippingAddress;

  const formatPrice = (val) => {
    return Number(val || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full bg-[#fbf9f6] dark:bg-[#0e0f11] text-slate-900 dark:text-slate-100 min-h-screen py-10 sm:py-16">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Lüks Onay Rozeti ve Başlık Alanı */}
        <div className="flex flex-col items-center text-center mb-10 sm:mb-14">
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#6b1d2f] to-[#8b1e3f] p-0.5 shadow-xl shadow-[#6b1d2f]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#6b1d2f] rounded-[22px] flex items-center justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 drop-shadow-md animate-scale-in" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-1.5 shadow-md border-2 border-white dark:border-slate-900">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#6b1d2f]/10 text-[#6b1d2f] dark:text-rose-400 mb-3 border border-[#6b1d2f]/20">
            Sipariş Onaylandı
          </span>

          <h1 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-[#6b1d2f] dark:text-white tracking-tight mb-3">
            Siparişiniz Alındı!
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Değerli siparişiniz için teşekkür ederiz. İspir'in geleneksel doğal lezzetlerini sizin için özenle hazırlamaya başladık.
          </p>
        </div>

        {/* 2 Sütunlu Lüks Bilgi & Sipariş Özeti Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Sol Sütun: Sipariş Bilgileri & Teslimat Adresi */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-serif font-bold text-xl text-[#6b1d2f] dark:text-rose-400 flex items-center gap-2.5">
                  <PackageCheck className="w-6 h-6 text-[#6b1d2f]" /> Sipariş Bilgileri
                </h3>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  Hazırlanıyor
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                    SİPARİŞ NUMARASI
                  </span>
                  <p className="font-mono font-black text-slate-900 dark:text-white text-lg sm:text-xl bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 inline-block">
                    {orderNum}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                      TARİH
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">{orderDate}</p>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                      TAHMİNİ TESLİMAT
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">2-3 İş Günü</p>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                    ÖDEME YÖNTEMİ
                  </span>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base">
                    <CreditCard className="w-5 h-5 text-[#6b1d2f]" />
                    <span>
                      {completedOrder?.paymentMethod === "bankTransfer"
                        ? "Banka Havalesi / EFT"
                        : completedOrder?.paymentMethod === "openAccount"
                        ? "B2B Vadeli Açık Hesap"
                        : "Kredi / Banka Kartı"}
                    </span>
                  </div>
                </div>

                {/* Kazanılan Lezzet Puanı Rozet Kutusu */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-400/40 text-amber-950 dark:text-amber-200 flex items-center gap-4 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/25 flex items-center justify-center shrink-0 border border-amber-400/40">
                    <Award className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Kazanılan Sadakat Puanı
                    </p>
                    <p className="font-mono font-black text-base sm:text-lg text-amber-950 dark:text-amber-100">
                      +{formatPrice(total)} PTS Lezzet Puanı
                    </p>
                  </div>
                </div>

                {/* Teslimat Adresi */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#6b1d2f]" /> TESLİMAT ADRESİ
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    {shippingAddress ? (
                      <>
                        {shippingAddress.name && <p className="font-bold text-[#6b1d2f] dark:text-rose-400 text-base">{shippingAddress.name}</p>}
                        <p className="mt-0.5">{shippingAddress.address || shippingAddress.fullAddress || shippingAddress.street || "Adres Bilgisi Kaydedildi"}</p>
                        {shippingAddress.city && <p className="text-slate-500 font-medium mt-0.5">{shippingAddress.district ? `${shippingAddress.district} / ` : ""}{shippingAddress.city}</p>}
                        {shippingAddress.phone && <p className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-1.5">Tel: {shippingAddress.phone}</p>}
                      </>
                    ) : (
                      <p>{completedOrder?.address || "Adres Bilgisi Kaydedildi"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Sütun: Sipariş Özeti & Ürün Kalemleri */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h3 className="font-serif font-bold text-xl text-[#6b1d2f] dark:text-rose-400">
                  Sipariş Özeti ({items.length} Kalem)
                </h3>
                <span className="text-sm font-mono font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  {completedOrder?.cargoCompany || "Yurtiçi Kargo"}
                </span>
              </div>

              {/* Ürün Listesi */}
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between gap-4 pt-4 first:pt-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-1.5 flex items-center justify-center shrink-0 relative overflow-hidden">
                        <Image
                          className="object-contain p-0.5"
                          alt={item.name}
                          src={item.img || item.image || "/pekefe-dut-pekmezi-kavanoz.jpg"}
                          fill
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                          {item.name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                          Adet: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">{item.quantity}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-black text-base sm:text-lg text-[#6b1d2f] dark:text-rose-400">
                        ₺{formatPrice((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fiyat Dökümü */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 text-base">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Ürünler Ara Toplamı</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-base sm:text-lg">₺{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Kargo Bedeli</span>
                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md text-xs sm:text-sm">
                    {shippingCost === 0 ? "ÜCRETSİZ" : `₺${formatPrice(shippingCost)}`}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-5 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-serif font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                    Genel Toplam
                  </span>
                  <span className="font-mono font-black text-3xl sm:text-4xl text-[#6b1d2f] dark:text-rose-400">
                    ₺{formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Şimdi Ne Olacak? Bilgilendirme Kutusu */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h4 className="font-serif font-bold text-lg text-[#6b1d2f] dark:text-rose-400 mb-5 flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#6b1d2f]" /> Sipariş Süreci Nasıl İlerleyecek?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#6b1d2f]/5 dark:bg-slate-800/50 p-4 rounded-2xl border border-[#6b1d2f]/10 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#6b1d2f] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Sipariş Onayı</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">Detaylar E-posta ve SMS ile iletildi.</p>
                </div>
                <div className="bg-[#6b1d2f]/5 dark:bg-slate-800/50 p-4 rounded-2xl border border-[#6b1d2f]/10 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#6b1d2f] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Tazelik Kontrolü</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">Özenle paketlenip soğuk zincire verilir.</p>
                </div>
                <div className="bg-[#6b1d2f]/5 dark:bg-slate-800/50 p-4 rounded-2xl border border-[#6b1d2f]/10 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#6b1d2f] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Hızlı Sevkiyat</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">Takip kodu SMS ile cebinize gelir.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lüks Aksiyon Butonları (Call to Actions) */}
        <div className="mt-12 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            className="w-full sm:w-auto px-10 py-4 bg-[#6b1d2f] hover:bg-[#831843] text-white font-bold text-base rounded-2xl text-center transition-all shadow-md shadow-[#6b1d2f]/20 flex items-center justify-center gap-2.5 group cursor-pointer"
            href="/hesap"
          >
            <ShoppingBag className="w-5 h-5" /> Siparişlerimi Görüntüle <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            className="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-base rounded-2xl text-center transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
            href="/"
          >
            <Home className="w-5 h-5" /> Alışverişe Devam Et
          </Link>
        </div>

        {/* Marka Dipnotu */}
        <div className="mt-16 border-t border-slate-200/60 dark:border-slate-800 pt-8 text-center max-w-2xl mx-auto">
          <p className="font-serif italic text-slate-600 dark:text-slate-400 text-sm sm:text-base mb-2">
            "Doğadan sofranıza uzanan bu eşsiz lezzet yolculuğunda bizi tercih ettiğiniz için teşekkür ederiz."
          </p>
          <p className="text-[11px] font-mono font-extrabold text-[#6b1d2f] dark:text-amber-400 uppercase tracking-widest">
            PEKEFE GELENEKSEL DOĞAL LEZZETLER
          </p>
        </div>

      </main>
    </div>
  );
}

export default function SepetOnay() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-mono">Yükleniyor...</div>}>
      <SepetOnayContent />
    </Suspense>
  );
}
