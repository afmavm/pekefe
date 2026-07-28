"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { getCart, clearCart } from "@/utils/cartStorage";

export default function Odeme() {
  const router = useRouter();
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "İstanbul",
    phone: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    let matches = value.match(/\d{1,16}/g);
    let match = (matches && matches[0]) || "";
    let parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (value.length > 2) {
      setExpiry(value.substring(0, 2) + " / " + value.substring(2, 4));
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/gi, "").substring(0, 3);
    setCvv(value);
  };

  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const items = getCart();
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setSubtotal(sum);
  }, []);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.address ||
      !formData.phone ||
      !nameOnCard ||
      cardNumber.length < 19 ||
      expiry.length < 7 ||
      cvv.length < 3
    ) {
      setErrorMsg("Lütfen tüm adresi ve ödeme bilgilerini eksiksiz doldurunuz.");
      return;
    }

    const items = getCart();
    if (!items || items.length === 0) {
      setErrorMsg("Sepetiniz boş. Lütfen alışverişe devam edin.");
      return;
    }

    const orderId = `PKF-${Math.floor(100000 + Math.random() * 900000)}`;
    const shippingCostVal = shippingMethod === "standard" ? 0 : 45;
    const completedOrder = {
      orderId,
      date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
      items,
      subtotal,
      shippingCost: shippingCostVal,
      total: subtotal + shippingCostVal,
      shippingAddress: {
        name: `${formData.firstName} ${formData.lastName}`,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
      }
    };

    try {
      localStorage.setItem("pekefe_completed_order", JSON.stringify(completedOrder));
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
          totalAmount: completedOrder.total,
          shippingAddress: completedOrder.shippingAddress,
          paymentMethod: "CREDIT_CARD"
        }),
      }).catch(() => {});
    } catch (err) {
      console.error("Order save error:", err);
    }

    clearCart();
    setToast({
      isOpen: true,
      message: "Siparişiniz alındı! Onay sayfasına yönlendiriliyorsunuz.",
      type: "success",
    });
    setTimeout(() => {
      router.push("/sepet/onay");
    }, 1000);
  };

  const isShippingFree = subtotal >= 750 || shippingMethod === "standard";
  const shippingCost = shippingMethod === "standard" ? 0 : 45;
  const vat = Math.round(subtotal * 0.18); // 18% VAT
  const total = subtotal + shippingCost;
  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Progress Steps */}
      <div className="flex flex-wrap items-center justify-center mb-16 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">1</div>
          <span className="font-label-md text-primary font-bold">Teslimat</span>
        </div>
        <div className="w-16 h-[1px] bg-outline-variant hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">2</div>
          <span className="font-label-md text-primary font-bold">Ödeme</span>
        </div>
        <div className="w-16 h-[1px] bg-outline-variant hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold">3</div>
          <span className="font-label-md text-on-surface-variant">Onay</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Main Content Left */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section 1: Shipping Address */}
          <section className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/30">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              <h2 className="font-headline-md text-on-surface">Teslimat Adresi</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  ADINIZ
                </label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-body-md"
                  placeholder="Örn. Ahmet"
                  type="text"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2 group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  SOYADINIZ
                </label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-body-md"
                  placeholder="Örn. Yılmaz"
                  type="text"
                  autoComplete="family-name"
                  required
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2 group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  ADRES
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all resize-none font-body-md"
                  placeholder="Sokak, Mahalle, Bina No, Daire"
                  rows={3}
                  autoComplete="street-address"
                  required
                ></textarea>
              </div>
              <div className="flex flex-col gap-2 group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  ŞEHİR
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-body-md"
                  autoComplete="address-level2"
                >
                  <option>İstanbul</option>
                  <option>Ankara</option>
                  <option>İzmir</option>
                  <option>Erzurum</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  TELEFON
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-body-md"
                  placeholder="+90 (___) ___ __ __"
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 2: Shipping Method */}
          <section className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/30">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">package_2</span>
              <h2 className="font-headline-md text-on-surface">Kargo Seçeneği</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                onClick={() => setShippingMethod("standard")}
                className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  shippingMethod === "standard"
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant hover:border-primary/50"
                }`}
              >
                <input
                  checked={shippingMethod === "standard"}
                  onChange={() => setShippingMethod("standard")}
                  className="w-5 h-5 text-primary border-outline focus:ring-primary cursor-pointer"
                  name="shipping"
                  type="radio"
                />
                <div className="ml-4">
                  <p className="font-bold text-on-surface">Standart Kargo</p>
                  <p className="text-sm text-on-surface-variant">2-4 İş Günü</p>
                </div>
                <span className="ml-auto font-bold text-primary">Ücretsiz</span>
              </label>
              <label
                onClick={() => setShippingMethod("express")}
                className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  shippingMethod === "express"
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant hover:border-primary/50"
                }`}
              >
                <input
                  checked={shippingMethod === "express"}
                  onChange={() => setShippingMethod("express")}
                  className="w-5 h-5 text-primary border-outline focus:ring-primary cursor-pointer"
                  name="shipping"
                  type="radio"
                />
                <div className="ml-4">
                  <p className="font-bold text-on-surface">Hızlı Gönderim</p>
                  <p className="text-sm text-on-surface-variant">Ertesi Gün Teslim</p>
                </div>
                <span className="ml-auto font-bold text-on-surface">₺45</span>
              </label>
            </div>
          </section>

          {/* Section 3: Payment Method */}
          <section className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/30">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">payments</span>
                <h2 className="font-headline-md text-on-surface">Ödeme Yöntemi</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-outline-variant/50">
                <span className="material-symbols-outlined text-secondary text-sm">lock</span>
                <span className="font-label-sm text-secondary">GÜVENLİ ÖDEME</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-2 group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  KART ÜZERİNDEKİ İSİM
                </label>
                <input
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value)}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-body-md"
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  autoComplete="cc-name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2 relative group">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                  KART NUMARASI
                </label>
                <input
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-mono"
                  placeholder="0000 0000 0000 0000"
                  type="text"
                  maxLength={19}
                  autoComplete="cc-number"
                  required
                />
                <div className="absolute right-4 top-10 flex gap-2">
                  <div className="w-8 h-5 bg-surface-container rounded-sm border border-outline-variant/30"></div>
                  <div className="w-8 h-5 bg-surface-container rounded-sm border border-outline-variant/30"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 group">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                    SON KULLANMA
                  </label>
                  <input
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-mono"
                    placeholder="AA / YY"
                    type="text"
                    maxLength={7}
                    autoComplete="cc-exp"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 group">
                  <label className="font-label-sm text-on-surface-variant uppercase tracking-wider transition-colors group-focus-within:text-primary">
                    CVV
                  </label>
                  <input
                    value={cvv}
                    onChange={handleCvvChange}
                    className="bg-surface p-4 rounded-lg border border-outline-variant/50 focus:outline-none focus:border-primary transition-all font-mono"
                    placeholder="***"
                    type="password"
                    maxLength={3}
                    autoComplete="cc-csc"
                    required
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-6 w-full">
          <div className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/30">
            <h3 className="font-headline-md text-on-surface mb-6">Sipariş Özeti</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Alt Toplam</span>
                <span className="font-bold">₺{subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Kargo</span>
                {shippingCost === 0 ? (
                  <span className="text-secondary font-bold">Ücretsiz</span>
                ) : (
                  <span className="font-bold">₺{shippingCost}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">KDV (%18)</span>
                <span className="font-bold">₺{vat}</span>
              </div>
              <div className="h-[1px] bg-outline-variant/30 my-4"></div>
              <div className="flex justify-between items-center">
                <span className="font-headline-md">Toplam</span>
                <span className="font-headline-md text-primary font-mono">₺{total}</span>
              </div>
            </div>
            {shippingMethod === "standard" && (
              <div className="bg-secondary/5 p-4 rounded-lg mb-6 border border-secondary/20">
                <p className="font-label-sm text-secondary text-center font-semibold">
                  Tebrikler! ₺750 üzeri alışverişle ücretsiz kargo kazandınız.
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 mb-6" role="alert">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              className="w-full bg-primary text-on-primary py-5 rounded-xl font-bold text-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg"
            >
              <span className="material-symbols-outlined">verified_user</span>
              Siparişi Onayla
            </button>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-sm">security</span>
                <span className="text-xs">256-bit SSL Güvenli Ödeme Altyapısı</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-sm">assignment_return</span>
                <span className="text-xs">14 Gün İçinde Koşulsuz İade Hakkı</span>
              </div>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-xl border border-dashed border-outline-variant text-center">
            <p className="font-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Destek Hattı</p>
            <a className="font-bold text-primary hover:underline font-mono" href="tel:+904425110000">
              +90 (442) 511 00 00
            </a>
          </div>
        </aside>
      </div>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
