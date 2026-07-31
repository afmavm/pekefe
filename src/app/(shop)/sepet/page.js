"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";
import { getCart, updateCartQty, removeFromCart } from "@/utils/cartStorage";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";

export default function Sepet() {
  const [cartItems, setCartItems] = useState([]);
  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    setSettings(getSettings());
    fetchLiveSettings().then((live) => {
      if (live) setSettings(live);
    });
    const handleSettingsChange = () => {
      setSettings(getSettings());
    };
    window.addEventListener("pekefe_settings_changed", handleSettingsChange);
    return () => {
      window.removeEventListener("pekefe_settings_changed", handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    setCartItems(getCart());
    const handleCartChange = () => {
      setCartItems(getCart());
    };
    window.addEventListener("pekefe_cart_changed", handleCartChange);
    return () => {
      window.removeEventListener("pekefe_cart_changed", handleCartChange);
    };
  }, []);

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const updateQuantity = (id, delta) => {
    updateCartQty(id, delta);
  };

  const removeItem = (id) => {
    removeFromCart(id);
  };

  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.toUpperCase() === "PEKEFE10") {
      setDiscount(0.1); // 10% discount
      setToast({
        isOpen: true,
        message: "PEKEFE10 indirim kodu uygulandı! %10 indirim kazandınız.",
        type: "success",
      });
    } else {
      setToast({
        isOpen: true,
        message: "Geçersiz veya süresi dolmuş kupon kodu.",
        type: "error",
      });
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = subtotal * discount;
  const shippingThreshold = 750;
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = subtotal === 0 ? 0 : isShippingFree ? 0 : 35;
  const total = subtotal - discountAmount + shippingCost;
  const remainingForFreeShipping = Math.max(0, shippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / shippingThreshold) * 100);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-on-surface-variant font-label-sm uppercase tracking-wider">
        <Link className="hover:text-primary" href="/">
          Anasayfa
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary font-bold">Sepetim</span>
      </nav>
      <h1 className="font-headline-lg text-[32px] md:text-headline-lg mb-12 text-primary">
        Alışveriş Sepetim
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-xl premium-shadow border border-outline-variant/10">
          <span className="material-symbols-outlined text-6xl text-secondary mb-4">shopping_bag</span>
          <h2 className="font-headline-md text-primary mb-4">Sepetiniz Boş</h2>
          <p className="font-body-md text-on-surface-variant mb-8 max-w-sm mx-auto">
            Sepetinizde henüz ürün bulunmuyor. Lezzet dolu ürünlerimizi keşfetmeye hemen başlayın!
          </p>
          <Link
            href="/"
            className="inline-flex bg-primary text-white px-8 py-3 rounded-lg font-label-md hover:bg-primary/95 transition-all"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-6 rounded-xl premium-shadow flex flex-col md:flex-row gap-6 items-center transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10"
              >
                <div className="w-32 h-32 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 relative">
                  <Image className="object-cover" alt={item.name} src={item.img} fill sizes="128px" />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <span className="font-label-sm text-secondary uppercase tracking-widest bg-secondary-container/30 px-2 py-1 rounded">
                    {item.badge}
                  </span>
                  <h3 className="font-headline-md text-[20px] md:text-headline-md mt-2">{item.name}</h3>
                  <p className="text-on-surface-variant font-body-md">{item.desc}</p>
                </div>
                <div className="flex items-center gap-4 bg-surface rounded-full px-4 py-2 border border-outline-variant/30">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer active:scale-95 transition-transform"
                  >
                    remove
                  </button>
                  <span className="font-bold text-lg min-w-[20px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer active:scale-95 transition-transform"
                  >
                    add
                  </button>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="font-headline-md text-primary">₺{item.price * item.quantity}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="material-symbols-outlined text-outline hover:text-error transition-colors cursor-pointer"
                >
                  delete
                </button>
              </div>
            ))}

            {/* Shipping Progress */}
            <div className="bg-secondary-container/20 p-6 rounded-xl border border-secondary-container">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">local_shipping</span>
                  <p className="font-bold text-secondary">
                    {isShippingFree
                      ? "Tebrikler, Kargonuz Bedava!"
                      : `Ücretsiz Kargo İçin Son ₺${remainingForFreeShipping}`}
                  </p>
                </div>
                <span className="font-label-md text-secondary">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/20">
              <h2 className="font-headline-md text-[20px] md:text-headline-md mb-6 border-b border-outline-variant/30 pb-4">
                Sipariş Özeti
              </h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="font-body-md">Ara Toplam</span>
                  <span className="font-label-md">₺{subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span className="font-body-md">Kargo Ücreti</span>
                  <span className="font-label-md">
                    {shippingCost === 0 ? "Ücretsiz" : `₺${shippingCost}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-secondary">
                    <span className="font-body-md">İndirimler (%10)</span>
                    <span className="font-label-md">-₺{discountAmount}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center text-primary font-bold">
                  <span className="text-lg">Genel Toplam</span>
                  <span className="text-2xl">₺{total}</span>
                </div>
              </div>
              <div className="space-y-4">
                <Link
                  href="/sepet/odeme"
                  className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold text-lg hover:opacity-95 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  ÖDEMEYE GEÇ
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <div className="flex items-center gap-2 justify-center text-on-surface-variant font-label-sm uppercase">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Güvenli Ödeme Altyapısı
                </div>
              </div>
              <form onSubmit={handleApplyPromo} className="mt-8">
                <label className="block text-label-sm text-on-surface-variant uppercase mb-2">
                  İndirim Kodu
                </label>
                <div className="flex gap-2">
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-grow bg-surface border border-outline-variant/50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="Kodu giriniz (PEKEFE10)"
                    type="text"
                  />
                  <button
                    type="submit"
                    className="bg-secondary text-white px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    Uygula
                  </button>
                </div>
              </form>
            </div>
            {/* Quick Help */}
            <div className="mt-6 p-4 rounded-xl border border-outline-variant/30 text-center">
              <p className="font-label-sm text-on-surface-variant mb-2">Yardıma mı ihtiyacınız var?</p>
              <a
                className="text-primary font-bold hover:underline flex items-center justify-center gap-2"
                href={`tel:${(settings?.phone || DEFAULT_SETTINGS.phone).replace(/[^0-9+]/g, "")}`}
              >
                <span className="material-symbols-outlined text-sm">phone</span>
                {settings?.phone || DEFAULT_SETTINGS.phone}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      <section className="mt-section-gap">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-secondary font-label-md uppercase tracking-[0.2em]">Sepetini Tamamla</span>
            <h2 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mt-2">
              Birlikte İyi Gider
            </h2>
          </div>
          <div className="hidden md:flex gap-4">
            <button aria-label="Önceki ürünler" className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button aria-label="Sonraki ürünler" className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {/* Product 1: Taş Değirmen Tahin */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 transition-all duration-300 hover:-translate-y-1 group">
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-surface p-4 flex items-center justify-center">
              <Image
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                alt="Taş Değirmen Tahin"
                src="/pekmez-tahin-eslesme.png"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute top-3 left-3 bg-secondary text-white font-label-sm text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold z-10">
                Pekmez Eşleşmesi
              </div>
            </div>
            <h4 className="font-display-lg text-primary text-base font-bold mb-1 group-hover:text-primary transition-colors">
              Taş Değirmen Çifte Kavrulmuş Tahin
            </h4>
            <p className="text-on-surface-variant text-xs mb-4 font-mono">600g · Yerli Susam</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-primary font-mono">₺180</span>
              <button aria-label="Taş Değirmen Çifte Kavrulmuş Tahin sepete ekle" className="bg-primary/5 hover:bg-primary text-primary hover:text-white p-2.5 rounded-lg border border-primary/10 transition-all cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
              </button>
            </div>
          </div>

          {/* Product 2: Yerli İspir Cevizi */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 transition-all duration-300 hover:-translate-y-1 group">
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-surface p-4 flex items-center justify-center">
              <Image
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                alt="İspir Kabuklu Cevizi"
                src="/ispir-kome-gercek-hasat.jpg"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute top-3 left-3 bg-secondary text-white font-label-sm text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold z-10">
                Pestil İçi
              </div>
            </div>
            <h4 className="font-display-lg text-primary text-base font-bold mb-1 group-hover:text-primary transition-colors">
              Yerli İspir İnce Kabuklu Ceviz
            </h4>
            <p className="text-on-surface-variant text-xs mb-4 font-mono">500g · Yeni Sezon Hasadı</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-primary font-mono">₺220</span>
              <button aria-label="Yerli İspir İnce Kabuklu Ceviz sepete ekle" className="bg-primary/5 hover:bg-primary text-primary hover:text-white p-2.5 rounded-lg border border-primary/10 transition-all cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
              </button>
            </div>
          </div>

          {/* Product 3: Doğal Dağ Çayı */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 transition-all duration-300 hover:-translate-y-1 group">
            <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-surface p-4 flex items-center justify-center">
              <Image
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                alt="İspir Dağ Çayı Harmanı"
                src="/ispir-pestil-kurutma-gercek.png"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <div className="absolute top-3 left-3 bg-secondary text-white font-label-sm text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold z-10">
                Köme Eşleşmesi
              </div>
            </div>
            <h4 className="font-display-lg text-primary text-base font-bold mb-1 group-hover:text-primary transition-colors">
              İspir Yayla Kekik & Dağ Çayı
            </h4>
            <p className="text-on-surface-variant text-xs mb-4 font-mono">150g · Pamuk Kese</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg text-primary font-mono">₺120</span>
              <button aria-label="İspir Yayla Kekik ve Dağ Çayı sepete ekle" className="bg-primary/5 hover:bg-primary text-primary hover:text-white p-2.5 rounded-lg border border-primary/10 transition-all cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
              </button>
            </div>
          </div>
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
