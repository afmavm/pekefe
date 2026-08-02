"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Toast } from "@/components/ui/Toast";
import { getCart, clearCart } from "@/utils/cartStorage";
import { turkeyLocations } from "@/data/turkey-locations";

export default function Odeme() {
  const router = useRouter();
  const sessionResult = useSession() || {};
  const session = sessionResult.data;

  // Selected Options
  const [shippingMethod, setShippingMethod] = useState("standard"); // standard, express
  const [paymentMethod, setPaymentMethod] = useState("creditCard"); // creditCard, bankTransfer, openAccount
  const [selectedCarrier, setSelectedCarrier] = useState("Yurtiçi Kargo");

  // Form Inputs
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "İstanbul",
    district: "",
    address: "",
  });

  // Credit Card Inputs
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  // States
  const [subtotal, setSubtotal] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);

  // Fetch Bank Accounts and CMS Settings from management backend
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSiteSettings(data);
      })
      .catch((e) => console.error("Error loading settings:", e));

    fetch("/api/accounting/banks")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setBankAccounts(list);
      })
      .catch((e) => console.error("Error loading bank accounts:", e));
  }, []);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (session?.user) {
      const fullName = session.user.name || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: session.user.email || prev.email,
      }));

      // Set default name on card
      if (!nameOnCard && fullName) {
        setNameOnCard(fullName.toUpperCase());
      }
    }
  }, [session]);

  // Load Cart
  useEffect(() => {
    const items = getCart();
    setCartItems(items);
    const sum = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setSubtotal(sum);

    if (items.length === 0) {
      setErrorMsg("Sepetiniz boş. Lütfen alışverişe devam edin.");
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "city") {
      setFormData((prev) => ({
        ...prev,
        city: value,
        district: "", // Reset district when city changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      setExpiry(value.substring(0, 2) + "/" + value.substring(2, 4));
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/gi, "").substring(0, 3);
    setCvv(value);
  };

  // Dynamic Shipping calculations from Management / CMS Settings
  const shippingThreshold = Number(siteSettings?.shippingThreshold ?? 5000);
  const baseShippingFee = Number(siteSettings?.shippingFee ?? 150);
  const isShippingFree = subtotal >= shippingThreshold;
  const shippingCost = subtotal === 0 ? 0 : isShippingFree ? 0 : (shippingMethod === "express" ? baseShippingFee + 35 : baseShippingFee);

  // Bank Transfer Extra Discount (Dynamic from Management Settings)
  const bankDiscountRate = siteSettings?.bankTransferDiscountRate ?? 2;
  const bankDiscount = paymentMethod === "bankTransfer" ? subtotal * (bankDiscountRate / 100) : 0;
  const grandTotal = Math.max(0, subtotal - bankDiscount + shippingCost);

  // Card brand icon check
  const getCardBrand = () => {
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(cleanNum) || /^2[2-7]/.test(cleanNum)) return "MASTERCARD";
    if (/^9792/.test(cleanNum) || /^65/.test(cleanNum)) return "TROY";
    return null;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate Required Fields
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.phone || !formData.city) {
      setErrorMsg("Lütfen teslimat adresi ve iletişim bilgilerini eksiksiz doldurunuz.");
      return;
    }

    if (formData.phone.length < 10) {
      setErrorMsg("Lütfen geçerli bir telefon numarası giriniz.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg("Sepetinizde ürün bulunmuyor. Lütfen mağerimizden ürün ekleyin.");
      return;
    }

    // Payment-Specific Validations
    if (paymentMethod === "creditCard") {
      if (!nameOnCard || nameOnCard.trim().length < 3) {
        setErrorMsg("Lütfen kart üzerindeki ad soyadı eksiksiz giriniz.");
        return;
      }
      if (cardNumber.replace(/\s+/g, "").length < 16) {
        setErrorMsg("Lütfen 16 haneli kart numaranızı kontrol ediniz.");
        return;
      }
      if (expiry.length < 5) {
        setErrorMsg("Lütfen geçerli bir son kullanma tarihi giriniz (AA/YY).");
        return;
      }
      if (cvv.length < 3) {
        setErrorMsg("Lütfen 3 haneli CVV kodunu giriniz.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        cart: cartItems.map((item) => ({
          id: String(item.id),
          sku: item.sku || item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
        })),
        cartTotal: grandTotal,
        paymentMethod: paymentMethod, // creditCard, bankTransfer, openAccount
        cardNumber: paymentMethod === "creditCard" ? cardNumber.replace(/\s+/g, "") : undefined,
        expDate: paymentMethod === "creditCard" ? expiry : undefined,
        cvv: paymentMethod === "creditCard" ? cvv : undefined,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        address: `${formData.address}${formData.district ? `, ${formData.district}` : ""} / ${formData.city}`,
        shippingFee: shippingCost,
        selectedCarrierName: selectedCarrier,
        shippingAddress: {
          addressTitle: "Teslimat Adresi",
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          city: formData.city,
          district: formData.district || "",
          fullAddress: formData.address,
        },
        billingAddress: {
          addressTitle: "Fatura Adresi",
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          city: formData.city,
          district: formData.district || "",
          fullAddress: formData.address,
        },
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setIsSubmitting(false);
        setErrorMsg(data.error || "Sipariş işlenirken bir hata oluştu. Lütfen tekrar deneyiniz.");
        return;
      }

      // Successful Order Creation
      const completedOrder = {
        orderId: data.orderId || `PKF-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
        items: cartItems,
        subtotal,
        shippingCost,
        bankDiscount,
        total: grandTotal,
        paymentMethod,
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: `${formData.district ? `${formData.district} / ` : ""}${formData.city}`,
          phone: formData.phone,
        },
      };

      localStorage.setItem("pekefe_completed_order", JSON.stringify(completedOrder));
      clearCart();

      setToast({
        isOpen: true,
        message: "Siparişiniz başarıyla alındı! Onay sayfasına yönlendiriliyorsunuz.",
        type: "success",
      });

      setTimeout(() => {
        router.push("/sepet/onay");
      }, 1000);
    } catch (err) {
      console.error("Checkout submission error:", err);
      setIsSubmitting(false);
      setErrorMsg("Sunucuyla iletişim kurulurken bir bağlantı hatası oluştu. Lütfen tekrar deneyiniz.");
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12 gap-3 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
          <span className="font-label-md text-emerald-800 font-bold text-xs md:text-sm">Sepetim</span>
        </div>
        <div className="w-10 md:w-16 h-[2px] bg-emerald-600"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6b1d2f] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#6b1d2f]/20">2</div>
          <span className="font-label-md text-[#6b1d2f] font-bold text-xs md:text-sm">Teslimat & Ödeme</span>
        </div>
        <div className="w-10 md:w-16 h-[2px] bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-xs">3</div>
          <span className="font-label-md text-gray-400 text-xs md:text-sm">Sipariş Onayı</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Area */}
        <div className="lg:col-span-8 space-y-8">

          {/* Section 1: Delivery Address */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">local_shipping</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1a0a10]">Teslimat & İletişim Bilgileri</h2>
                <p className="text-xs text-gray-500 mt-0.5">Siparişinizin ulaştırılacağı adresi ve iletişim bilgilerini giriniz.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">ADINIZ *</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="Ahmet"
                  type="text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">SOYADINIZ *</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="Yılmaz"
                  type="text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">TELEFON *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="05XX XXX XX XX"
                  type="tel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">E-POSTA ADRESİ</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="ahmet@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">ŞEHİR *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none cursor-pointer"
                >
                  <option value="" disabled>İl Seçiniz</option>
                  {Object.keys(turkeyLocations)
                    .sort((a, b) => a.localeCompare(b, "tr"))
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">İLÇE *</label>
                {formData.city && turkeyLocations[formData.city]?.length > 0 ? (
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none cursor-pointer"
                  >
                    <option value="" disabled>İlçe Seçiniz</option>
                    {turkeyLocations[formData.city].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                    placeholder="İlçe giriniz"
                    type="text"
                    required
                  />
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">AÇIK ADRES *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none resize-none"
                  placeholder="Mahalle, Sokak, Bina No, Daire No..."
                  rows={3}
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 2: Shipping Method & Cargo Carrier */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">package_2</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1a0a10]">Kargo & Gönderim Seçenekleri</h2>
                <p className="text-xs text-gray-500 mt-0.5">Teslimat hızınızı ve kargo firmanızı belirleyin.</p>
              </div>
            </div>

            {/* Carrier Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Kargo Firması Tercihi</label>
              <div className="grid grid-cols-3 gap-3">
                {["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo"].map((carrier) => (
                  <button
                    key={carrier}
                    type="button"
                    onClick={() => setSelectedCarrier(carrier)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedCarrier === carrier
                        ? "border-[#6b1d2f] bg-[#6b1d2f] text-white shadow-sm"
                        : "border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {carrier}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Payment Method Tabs */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1a0a10]">Ödeme Yöntemi Seçimi</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Tercih ettiğiniz güvenli ödeme yöntemini belirleyin.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>256-bit SSL Güvenlik</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("creditCard")}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === "creditCard"
                    ? "border-[#6b1d2f] bg-[#6b1d2f]/5 shadow-sm text-[#6b1d2f]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">credit_card</span>
                <span className="font-bold text-xs">Kredi / Banka Kartı</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("bankTransfer")}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer relative ${
                  paymentMethod === "bankTransfer"
                    ? "border-[#6b1d2f] bg-[#6b1d2f]/5 shadow-sm text-[#6b1d2f]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {bankDiscountRate > 0 && (
                  <span className="absolute -top-2.5 right-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    %{bankDiscountRate} İndirimli
                  </span>
                )}
                <span className="material-symbols-outlined text-2xl">account_balance</span>
                <span className="font-bold text-xs">Banka Havalesi / EFT</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("openAccount")}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  paymentMethod === "openAccount"
                    ? "border-[#6b1d2f] bg-[#6b1d2f]/5 shadow-sm text-[#6b1d2f]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
                <span className="font-bold text-xs">B2B Vadeli Açık Hesap</span>
              </button>
            </div>

            {/* TAB 1: CREDIT CARD */}
            {paymentMethod === "creditCard" && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">KART ÜZERİNDEKİ İSİM *</label>
                  <input
                    value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm font-semibold outline-none"
                    placeholder="AHMET YILMAZ"
                    type="text"
                    required
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">KART NUMARASI *</label>
                  <div className="relative">
                    <input
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm font-mono tracking-wider outline-none"
                      placeholder="0000 0000 0000 0000"
                      type="text"
                      maxLength={19}
                      required
                    />
                    {getCardBrand() && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest px-2 py-0.5 bg-[#6b1d2f] text-white rounded">
                        {getCardBrand()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">SON KULLANMA *</label>
                    <input
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm font-mono outline-none"
                      placeholder="AA/YY"
                      type="text"
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">CVV / GÜVENLİK KODU *</label>
                    <input
                      value={cvv}
                      onChange={handleCvvChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm font-mono outline-none"
                      placeholder="123"
                      type="password"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BANK TRANSFER */}
            {paymentMethod === "bankTransfer" && (
              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <span className="material-symbols-outlined text-amber-700">account_balance</span>
                  <span>
                    Pekefe Resmi Banka Hesap Bilgileri {bankDiscountRate > 0 ? `(%${bankDiscountRate} Ekstra İndirim Uygulandı)` : ""}
                  </span>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-3 text-xs font-mono">
                  {bankAccounts && bankAccounts.length > 0 ? (
                    bankAccounts.map((bank, idx) => (
                      <div key={bank.id || idx} className={`space-y-1.5 ${idx > 0 ? "pt-3 border-t border-amber-100" : ""}`}>
                        <div className="flex justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-gray-500 font-sans font-medium">Banka:</span>
                          <span className="font-bold text-[#1a0a10]">{bank.name} {bank.branch ? `- ${bank.branch}` : ""}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-gray-500 font-sans font-medium">Alıcı Ünvanı:</span>
                          <span className="font-bold text-[#1a0a10]">
                            {siteSettings?.companyName || siteSettings?.companyNameField || "Pekefe Gıda San. ve Tic. Ltd. Şti."}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-gray-500 font-sans font-medium">IBAN:</span>
                          <span className="font-bold text-[#6b1d2f] text-sm tracking-wider select-all">
                            {bank.iban || "TR42 0001 0002 0003 0004 0005 01"}
                            {bank.currency && bank.currency !== "TRY" ? ` (${bank.currency})` : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 font-sans">Banka:</span>
                        <span className="font-bold text-[#1a0a10]">
                          {siteSettings?.bankName || "Ziraat Bankası - İspir Şubesi"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 font-sans">Alıcı Ünvanı:</span>
                        <span className="font-bold text-[#1a0a10]">
                          {siteSettings?.companyName || siteSettings?.companyNameField || "Pekefe Gıda San. ve Tic. Ltd. Şti."}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-sans">IBAN:</span>
                        <span className="font-bold text-[#6b1d2f] text-sm tracking-wider select-all">
                          {siteSettings?.bankIban || "TR42 0001 0002 0003 0004 0005 01"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  * Siparişinizi onayladıktan sonra üretilecek Sipariş Numarasını havale açıklama kısmına yazmanız gerekmektedir. Ödeme onayınızın ardından siparişiniz kargoya verilecektir.
                </p>
              </div>
            )}

            {/* TAB 3: B2B OPEN ACCOUNT */}
            {paymentMethod === "openAccount" && (
              <div className="p-6 rounded-2xl bg-[#6b1d2f]/5 border border-[#6b1d2f]/20 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-[#6b1d2f] font-bold text-sm">
                  <span className="material-symbols-outlined text-[#6b1d2f]">verified</span>
                  <span>B2B Kurumsal Bayi Vadeli Cari Ödeme</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bu ödeme yöntemi yalnızca anlaşmalı onaylı B2B kurumsal bayilerimiz için geçerlidir. Sipariş tutarı cari hesabınıza borç olarak yansıtılacak ve belirlenen vadede tahsil edilecektir.
                </p>
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex justify-between text-xs">
                  <span className="font-semibold text-gray-600">İşlem Türü:</span>
                  <span className="font-bold text-[#6b1d2f]">Cari Hesap Vadeli Borçlandırma</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Sticky Order Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-[#1a0a10] pb-4 border-b border-gray-100">
              Sipariş Özeti ({cartItems.length} Kalem)
            </h3>

            {/* Cart Items Thumbnails */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-12 h-12 rounded-lg bg-white relative overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image src={item.img || item.image || "/premium-pekefe-kavanoz.png"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1a0a10] truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-500">{item.quantity} Adet</div>
                  </div>
                  <div className="text-xs font-bold text-[#6b1d2f]">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</div>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Ürünler Ara Toplamı</span>
                <span className="font-bold text-[#1a0a10]">₺{subtotal.toLocaleString("tr-TR")}</span>
              </div>

              {bankDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Havale / EFT İndirimi (%{bankDiscountRate})</span>
                  <span>-₺{bankDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Kargo Bedeli ({selectedCarrier})</span>
                <span className="font-bold text-[#1a0a10]">
                  {shippingCost === 0 ? <span className="text-emerald-600 font-bold">ÜCRETSİZ</span> : `₺${shippingCost}`}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="text-base font-bold text-[#1a0a10]">Genel Toplam</span>
                <span className="text-2xl font-bold text-[#6b1d2f]">
                  ₺{grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50 text-[10px] text-gray-500 text-center font-semibold border border-gray-200/80">
                Tüm Fiyatlara %{siteSettings?.companyDefaultKdv ?? 10} Gıda KDV'si Dâhildir
              </div>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
                <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Order Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[#6b1d2f] to-[#8b2d3f] text-white font-bold rounded-xl shadow-lg shadow-[#6b1d2f]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span>Siparişiniz İşleniyor...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">verified</span>
                  <span>Siparişi Onayla ve Öde</span>
                </>
              )}
            </button>

            {/* Security Badges */}
            <div className="pt-2 space-y-2 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6b1d2f] text-base">verified_user</span>
                <span>256-bit SSL şifreleme ile verileriniz %100 güvendedir.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6b1d2f] text-base">assignment_return</span>
                <span>{siteSettings?.companyDefaultReturnDays ?? 14} gün içinde koşulsuz ücretsiz iade garantisi.</span>
              </div>
            </div>
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
