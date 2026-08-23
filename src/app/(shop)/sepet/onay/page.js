"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { clearCart } from "@/utils/cartStorage";

export default function SepetOnay() {
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    try {
      let storedData = localStorage.getItem("pekefe_completed_order") || sessionStorage.getItem("pekefe_completed_order");
      if (!storedData && typeof document !== "undefined") {
        const match = document.cookie.match(new RegExp('(?:^|; )pekefe_completed_order=([^;]*)'));
        if (match && match[1]) storedData = decodeURIComponent(match[1]);
      }
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setCompletedOrder(parsed);

        // Auto-promote order status to 'Hazırlanıyor' upon reaching order confirmation page
        if (parsed?.orderId) {
          fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: parsed.orderId, status: 'Hazırlanıyor' })
          }).catch(err => console.error("Auto promote order status error:", err));
        }
      }
    } catch (e) {
      console.error("Error reading completed order", e);
    }
    clearCart();
  }, []);

  const orderNum = completedOrder?.orderId || "PKF-" + Math.floor(100000 + Math.random() * 900000);
  const orderDate = completedOrder?.date || new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const items = completedOrder?.items || [];
  const subtotal = completedOrder?.subtotal ?? items.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
  const shippingCost = completedOrder?.shippingCost ?? 0;
  const total = completedOrder?.total ?? (subtotal + shippingCost);
  const shippingAddress = completedOrder?.shippingAddress;

  return (
    <div className="w-full bg-background text-on-surface font-body-md overflow-x-hidden">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
        {/* Success Indicator Section */}
        <div className="flex flex-col items-center text-center mb-16 animate-scale-in">
          <div className="relative w-24 h-24 mb-8">
            <svg className="w-full h-full text-secondary" viewBox="0 0 52 52">
              <circle className="fill-secondary/10" cx="26" cy="26" fill="none" r="25"></circle>
              <path
                className="fill-none stroke-primary stroke-[3] stroke-dasharray-[100] stroke-dashoffset-[100] animate-draw-checkmark"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-primary mb-4 leading-tight">
            Siparişiniz Alındı!
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Değerli siparişiniz için teşekkür ederiz. Geleneksel lezzetlerimizi sizin için özenle hazırlamaya başladık.
          </p>
        </div>

        {/* Order Info Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Details Card */}
          <div className="lg:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(139,0,0,0.04)] border border-outline-variant/20 h-fit">
            <h3 className="font-headline-md text-primary mb-6">Sipariş Bilgileri</h3>
            <div className="space-y-6">
              <div>
                <span className="block font-label-md text-label-sm text-on-surface-variant uppercase tracking-widest mb-1 text-xs">
                  SİPARİŞ NUMARASI
                </span>
                <p className="font-body-lg font-bold text-on-surface text-lg">{orderNum}</p>
              </div>
              <div>
                <span className="block font-label-md text-label-sm text-on-surface-variant uppercase tracking-widest mb-1 text-xs">
                  TARİH
                </span>
                <p className="font-body-lg text-on-surface">{orderDate}</p>
              </div>
              <div>
                <span className="block font-label-md text-label-sm text-on-surface-variant uppercase tracking-widest mb-1 text-xs">
                  TAHMİNİ TESLİMAT
                </span>
                <p className="font-body-lg text-on-surface">2-3 İş Günü İçinde (Soğuk Zincir Kargo)</p>
              </div>
              <div>
                <span className="block font-label-md text-label-sm text-on-surface-variant uppercase tracking-widest mb-1 text-xs">
                  ÖDEME YÖNTEMİ
                </span>
                <p className="font-body-lg text-on-surface font-semibold">
                  {completedOrder?.paymentMethod === "bankTransfer"
                    ? "Banka Havalesi / EFT (%2 İndirimli)"
                    : completedOrder?.paymentMethod === "openAccount"
                    ? "B2B Vadeli Açık Hesap"
                    : "Kredi / Banka Kartı"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-600 text-2xl">workspace_premium</span>
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider text-amber-800">Kazanılan Lezzet Puanı</p>
                  <p className="font-extrabold text-sm text-amber-900">+{Math.floor(total)} PTS Pekefe Lezzet Puanı Hesabınıza Tanımlandı!</p>
                </div>
              </div>
              <div className="pt-6 border-t border-outline-variant/30">
                <span className="block font-label-md text-label-sm text-on-surface-variant uppercase tracking-widest mb-1 text-xs">
                  TESLİMAT ADRESİ
                </span>
                <p className="font-body-md text-on-surface-variant whitespace-pre-line leading-relaxed text-sm">
                  {shippingAddress ? (
                    <>
                      {shippingAddress.name && <strong className="block text-primary font-bold">{shippingAddress.name}</strong>}
                      {shippingAddress.address || shippingAddress.fullAddress || shippingAddress.street || "Adres Bilgisi Kaydedildi"}
                      {shippingAddress.phone && <span className="block text-xs font-mono text-slate-500 mt-1">Tel: {shippingAddress.phone}</span>}
                    </>
                  ) : (
                    completedOrder?.address || "Adres Bilgisi Kaydedildi"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Summary & Breakdown */}
          <div className="lg:col-span-8 flex flex-col gap-gutter">
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(139,0,0,0.04)] border border-outline-variant/20">
              <h3 className="font-headline-md text-primary mb-6">Sipariş Özeti</h3>
              <div className="space-y-6">
                {items.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-6 border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative bg-surface p-2 flex items-center justify-center">
                      <Image
                        className="object-contain"
                        alt={item.name}
                        src={item.img || item.image || "/premium-pekefe-kavanoz.png"}
                        fill
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-body-lg font-semibold text-on-surface">{item.name}</p>
                      <p className="font-body-md text-sm text-on-surface-variant">{item.desc || "Premium Kavanoz"} • Adet: {item.quantity}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-body-lg font-bold text-primary">₺{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-outline-variant/30 space-y-3">
                <div className="flex justify-between font-body-md text-on-surface-variant">
                  <span>Ara Toplam</span>
                  <span className="font-mono">₺{subtotal}</span>
                </div>
                <div className="flex justify-between font-body-md text-on-surface-variant">
                  <span>Kargo Ücreti</span>
                  <span className="text-secondary font-semibold font-mono">
                    {shippingCost === 0 ? "ÜCRETSİZ" : `₺${shippingCost}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                  <span className="font-headline-md text-on-surface text-lg">Toplam</span>
                  <span className="font-display-lg text-headline-lg text-primary font-mono">₺{total}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-primary/5 rounded-xl p-8 border border-primary/10">
              <div className="flex gap-4 items-start">
                <span className="material-symbols-outlined text-primary scale-125 mt-1">info</span>
                <div>
                  <h4 className="font-body-lg font-bold text-primary mb-2">Şimdi Ne Olacak?</h4>
                  <ul className="space-y-3 text-on-surface-variant font-body-md">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></span>
                      <span>
                        Sipariş onayınız E-posta adresinize ve SMS olarak yönlendirildi.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></span>
                      <span>Ürünleriniz tazelik kontrolünden geçtikten sonra kargoya teslim edilecektir.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></span>
                      <span>Kargo takip numaranız SMS ve E-posta yoluyla size ulaştırılacaktır.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            className="w-full sm:w-auto px-12 py-4 bg-primary text-white font-body-md font-bold rounded-lg text-center hover:opacity-95 transition-all active:scale-95 shadow-md"
            href="/"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            className="w-full sm:w-auto px-12 py-4 border-2 border-secondary text-secondary font-body-md font-bold rounded-lg text-center hover:bg-secondary/5 transition-all active:scale-95"
            href="/hesap"
          >
            Sipariş Takibi
          </Link>
        </div>

        {/* Brand Quote */}
        <div className="mt-section-gap border-t border-outline-variant/30 pt-12 text-center max-w-3xl mx-auto">
          <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
            format_quote
          </span>
          <p className="font-display-lg text-headline-md italic text-primary-container mb-4">
            "Doğadan sofranıza uzanan bu yolculukta bizi tercih ettiğiniz için teşekkürler."
          </p>
          <p className="font-label-md text-label-md text-secondary tracking-widest uppercase">
            Pekefe Geleneksel Lezzetler Ekibi
          </p>
        </div>
      </main>
    </div>
  );
}
