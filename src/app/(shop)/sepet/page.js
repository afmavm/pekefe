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
    const loadCoupon = () => {
      try {
        const stored = localStorage.getItem("pekefe_applied_coupon");
        if (stored) {
          setAppliedCoupon(JSON.parse(stored));
        } else {
          setAppliedCoupon(null);
        }
      } catch (e) {
        setAppliedCoupon(null);
      }
    };

    loadCoupon();
    window.addEventListener("pekefe_coupon_changed", loadCoupon);
    window.addEventListener("storage", loadCoupon);

    return () => {
      window.removeEventListener("pekefe_coupon_changed", loadCoupon);
      window.removeEventListener("storage", loadCoupon);
    };
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

  const parsedCarriers = useMemo(() => {
    if (!settings?.shippingCarriers) return [];
    let list = settings.shippingCarriers;
    if (typeof list === "string") {
      try {
        list = JSON.parse(list);
      } catch (e) {
        list = [];
      }
    }
    if (Array.isArray(list) && list.length > 0) {
      return list.filter((c) => c.isActive !== false);
    }
    return [];
  }, [settings]);

  const defaultCarrier = parsedCarriers[0] || null;
  const isReceiverPay = Boolean(
    defaultCarrier?.pricingType === "receiver_pay" ||
    defaultCarrier?.pricingType === "buyer_pays" ||
    defaultCarrier?.isReceiverPay === true
  );

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const isCouponFreeShipping = appliedCoupon?.type === "free_shipping";
  const shippingThreshold = Number(defaultCarrier?.freeThreshold ?? settings?.shippingThreshold ?? 5000);
  const baseShippingFee = Number(defaultCarrier?.fallbackFee ?? settings?.shippingFee ?? 150);
  const isShippingFree = isCouponFreeShipping || (subtotal >= shippingThreshold);
  const shippingCost = subtotal === 0 || isReceiverPay ? 0 : isShippingFree ? 0 : baseShippingFee;
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
          <div className="lg:col-span-8 space-y-4 sm:space-y-5">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between"
              >
                {/* Sol Alan: Görsel & Bilgiler */}
                <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto min-w-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden flex-shrink-0 relative shadow-2xs">
                    <Image
                      className="object-cover"
                      alt={item.name || "Ürün"}
                      src={item.img || item.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg"}
                      fill
                      sizes="(max-width: 768px) 80px, 96px"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    {item.badge && (
                      <span className="inline-block text-[9px] sm:text-[10px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    <h3 className="font-display-lg text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {item.name}
                    </h3>

                    {item.variantLabel && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6b1d2f] dark:bg-amber-400 flex-shrink-0" />
                          {item.variantLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sağ Alan: Adet Stepper, Fiyat ve Sil Butonu */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  {/* Adet Kontrolü */}
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#6b1d2f] hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer active:scale-90"
                      title="Adet Azalt"
                    >
                      <span className="material-symbols-outlined text-base font-bold">remove</span>
                    </button>

                    <span className="font-mono font-black text-sm sm:text-base min-w-[28px] text-center text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#6b1d2f] hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer active:scale-90"
                      title="Adet Artır"
                    >
                      <span className="material-symbols-outlined text-base font-bold">add</span>
                    </button>
                  </div>

                  {/* Fiyat Alanı */}
                  <div className="text-right min-w-[90px] sm:min-w-[110px]">
                    <p className="text-lg sm:text-xl font-black text-[#6b1d2f] dark:text-amber-400 font-mono tracking-tight">
                      ₺{(item.price * item.quantity).toLocaleString("tr-TR")}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[11px] text-slate-400 font-mono font-semibold">
                        (₺{item.price.toLocaleString("tr-TR")} / adet)
                      </p>
                    )}
                  </div>

                  {/* Silme Butonu */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer"
                    title="Ürünü Sepetten Kaldır"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Shipping Progress & Information */}
            {isReceiverPay ? (
              <div className="bg-amber-500/10 p-5 rounded-2xl border-2 border-amber-500/30 flex items-start sm:items-center gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-amber-900 dark:text-amber-200">
                      📦 Ücret Alıcı Ödemeli Kargo
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                      Kapıda Ödeme
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/95 dark:text-amber-300 font-medium leading-relaxed">
                    Kargo taşıma bedeli sepet tutarınıza <strong>eklenmez (0 TL)</strong>; teslimat anında kapıda doğrudan kuryeye ödenir.
                  </p>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-4 sticky top-28">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <h2 className="font-display-lg text-lg sm:text-xl font-bold text-slate-900 dark:text-white pb-3.5 border-b border-slate-100 dark:border-slate-800">
                Sipariş Özeti
              </h2>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Ara Toplam</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    ₺{subtotal.toLocaleString("tr-TR")}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>Kargo Ücreti</span>
                    <span>
                      {isReceiverPay ? (
                        <span className="text-amber-800 dark:text-amber-300 font-extrabold px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-md text-[11px]">
                          Kapıda Alıcı Öder
                        </span>
                      ) : shippingCost === 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Ücretsiz</span>
                      ) : (
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          ₺{shippingCost.toLocaleString("tr-TR")}
                        </span>
                      )}
                    </span>
                  </div>
                  {isReceiverPay && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      * Kargo bedeli teslimatta kuryeye ödenecektir.
                    </p>
                  )}
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 text-xs">
                    <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                    <span className="font-mono font-black">-₺{discountAmount.toLocaleString("tr-TR")}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Genel Toplam</span>
                  <span className="font-mono font-black text-2xl text-[#6b1d2f] dark:text-amber-400 tracking-tight">
                    ₺{total.toLocaleString("tr-TR")}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <Link
                  href="/sepet/odeme"
                  className="w-full bg-[#6b1d2f] hover:bg-[#541624] text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#6b1d2f]/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ÖDEMEYE GEÇ</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>

                <div className="flex items-center gap-1.5 justify-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                  <span className="material-symbols-outlined text-xs text-emerald-600">lock</span>
                  <span>256-Bit SSL Güvenli Ödeme</span>
                </div>
              </div>

              {/* Coupon Code Section */}
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                    <div>
                      <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                        {appliedCoupon.code} İndirimi Aktif
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        -₺{discountAmount.toLocaleString("tr-TR")} uygulandı
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-xs text-red-600 hover:text-red-800 font-bold underline cursor-pointer px-1.5 py-0.5"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    İndirim Kuponu
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:border-amber-500 focus:bg-white outline-none transition-all"
                      placeholder="Kupon kodunuz..."
                      type="text"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingPromo}
                      className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-xs"
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

            {/* Quick Help Box */}
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs space-y-1">
              <p className="text-xs font-medium text-slate-500">Siparişinizle ilgili yardıma mı ihtiyacınız var?</p>
              <a
                className="text-[#6b1d2f] dark:text-amber-400 font-bold text-sm hover:underline flex items-center justify-center gap-1.5 font-mono"
                href={`tel:${(settings?.phone || DEFAULT_SETTINGS.phone).replace(/[^0-9+]/g, "")}`}
              >
                <span className="material-symbols-outlined text-base">phone_in_talk</span>
                <span>{settings?.phone || DEFAULT_SETTINGS.phone}</span>
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
