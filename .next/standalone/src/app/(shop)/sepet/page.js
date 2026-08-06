"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";
import { getCart, updateCartQty, removeFromCart, addToCart } from "@/utils/cartStorage";
import { getSettings, fetchLiveSettings, DEFAULT_SETTINGS } from "@/utils/settingsStorage";
import { getProducts, fetchLiveProducts } from "@/utils/productsStorage";

export default function Sepet() {
  const [cartItems, setCartItems] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [allProducts, setAllProducts] = useState([]);
  const [recIndex, setRecIndex] = useState(0);

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
    setAllProducts(getProducts());
    fetchLiveProducts().then((live) => {
      if (live && live.length > 0) {
        setAllProducts(live);
      }
    });
  }, []);

  const recommendations = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
    const cartIds = new Set((cartItems || []).map((item) => String(item.productId || item.id)));
    const available = allProducts.filter((p) => !cartIds.has(String(p.id)));
    return available.length > 0 ? available : allProducts;
  }, [allProducts, cartItems]);

  const maxRecIndex = Math.max(0, recommendations.length - 3);

  const handlePrevRec = () => {
    setRecIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextRec = () => {
    setRecIndex((prev) => Math.min(maxRecIndex, prev + 1));
  };

  const visibleRecommendations = recommendations.slice(recIndex, recIndex + 3);

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
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pekefe_applied_coupon");
      if (stored) {
        setAppliedCoupon(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const updateQuantity = (id, delta) => {
    updateCartQty(id, delta);
  };

  const removeItem = (id) => {
    removeFromCart(id);
  };

  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const codeToTest = promoCode.trim();
    if (!codeToTest) return;

    setIsApplyingPromo(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToTest,
          cartTotal: subtotal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const couponObj = {
          code: data.coupon.code,
          discountAmount: data.discountAmount,
          type: data.coupon.type,
          value: data.coupon.value,
        };
        setAppliedCoupon(couponObj);
        localStorage.setItem("pekefe_applied_coupon", JSON.stringify(couponObj));
        setToast({
          isOpen: true,
          message: `"${data.coupon.code}" indirim kodu başarıyla uygulandı! ₺${data.discountAmount.toLocaleString("tr-TR")} indirim kazandınız.`,
          type: "success",
        });
      } else {
        setToast({
          isOpen: true,
          message: data.error || "Geçersiz veya süresi dolmuş kupon kodu.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Coupon error:", err);
      setToast({
        isOpen: true,
        message: "Kupon doğrulanırken bir hata oluştu.",
        type: "error",
      });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    localStorage.removeItem("pekefe_applied_coupon");
    setToast({
      isOpen: true,
      message: "İndirim kodu kaldırıldı.",
      type: "info",
    });
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingThreshold = Number(settings?.shippingThreshold ?? 5000);
  const baseShippingFee = Number(settings?.shippingFee ?? 150);
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = subtotal === 0 ? 0 : isShippingFree ? 0 : baseShippingFee;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);
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
                  {item.variantLabel && (
                    <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full border border-outline-variant/40 font-label-sm text-on-surface-variant text-xs tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      {item.variantLabel}
                    </span>
                  )}
                  <p className="text-on-surface-variant font-body-md mt-1">{item.desc}</p>
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
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                    <span className="font-body-md">Kupon İndirimi ({appliedCoupon?.code})</span>
                    <span className="font-label-md">-₺{discountAmount.toLocaleString("tr-TR")}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center text-primary font-bold">
                  <span className="text-lg">Genel Toplam</span>
                  <span className="text-2xl">₺{total.toLocaleString("tr-TR")}</span>
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

              {/* Coupon Code Section */}
              {appliedCoupon ? (
                <div className="mt-8 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                    <div>
                      <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                        {appliedCoupon.code} Kodlu İndirim Aktif
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        -₺{discountAmount.toLocaleString("tr-TR")} indirim uygulandı
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs text-red-600 hover:text-red-800 font-bold underline cursor-pointer px-2 py-1"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="mt-8">
                  <label className="block text-label-sm text-on-surface-variant uppercase mb-2">
                    İndirim Kodu
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow bg-surface border border-outline-variant/50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-medium"
                      placeholder="Kodu giriniz (PEKEFE10)"
                      type="text"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingPromo}
                      className="bg-secondary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      {isApplyingPromo ? (
                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      ) : (
                        "Uygula"
                      )}
                    </button>
                  </div>
                </form>
              )}
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

      {/* Dynamic Catalog Recommendations Section ("Birlikte İyi Gider") */}
      {recommendations.length > 0 && (
        <section className="mt-section-gap">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-secondary font-label-md uppercase tracking-[0.2em]">Sepetini Tamamla</span>
              <h2 className="font-headline-lg text-[28px] md:text-headline-lg text-primary mt-2">
                Birlikte İyi Gider
              </h2>
            </div>
            <div className="hidden md:flex gap-4">
              <button
                type="button"
                onClick={handlePrevRec}
                disabled={recIndex === 0}
                aria-label="Önceki ürünler"
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  recIndex === 0
                    ? "border-outline-variant/30 text-outline-variant/40 cursor-not-allowed"
                    : "border-outline-variant hover:bg-primary hover:text-white hover:border-primary"
                }`}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNextRec}
                disabled={recIndex >= maxRecIndex}
                aria-label="Sonraki ürünler"
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  recIndex >= maxRecIndex
                    ? "border-outline-variant/30 text-outline-variant/40 cursor-not-allowed"
                    : "border-outline-variant hover:bg-primary hover:text-white hover:border-primary"
                }`}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {visibleRecommendations.map((p) => {
              const tagLabel = p.tag || p.categoryDisplay || "Geleneksel Reçete";
              const formattedPrice = `₺${Number(p.price || 0).toLocaleString("tr-TR")}`;
              return (
                <div
                  key={p.id}
                  className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-surface-container-low border border-outline-variant/10 flex items-center justify-center">
                      <Image
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={p.name}
                        src={p.image || "/premium-pekefe-kavanoz.png"}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 backdrop-blur-md bg-secondary/90 text-white font-label-sm text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold z-10 shadow-sm">
                        {tagLabel}
                      </div>
                    </div>
                    <Link href={`/urun/${p.id}`} className="block">
                      <h4 className="font-display-lg text-primary text-base font-bold mb-1 hover:underline transition-colors line-clamp-1">
                        {p.name}
                      </h4>
                    </Link>
                    <p className="text-on-surface-variant text-xs mb-4 font-mono line-clamp-1">
                      {p.meta || p.desc || "Asırlık İspir Kalitesi"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                    <span className="font-bold text-lg text-primary font-mono">{formattedPrice}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const itemToAdd = {
                          id: p.id,
                          productId: p.id,
                          name: p.name,
                          price: Number(p.price || 0),
                          sku: p.sku || p.id,
                          image: p.image,
                          quantity: 1,
                        };
                        addToCart(itemToAdd);
                        setToast({
                          isOpen: true,
                          message: `${p.name} sepete eklendi!`,
                          type: "success",
                        });
                      }}
                      aria-label={`${p.name} sepete ekle`}
                      className="bg-primary/5 hover:bg-primary text-primary hover:text-white p-2.5 rounded-lg border border-primary/10 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
