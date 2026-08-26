"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Toast } from "@/components/ui/Toast";
import { getCart, clearCart, addToCart } from "@/utils/cartStorage";
import { getProducts, fetchLiveProducts } from "@/utils/productsStorage";
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
  const [paytrToken, setPaytrToken] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Load Applied Coupon from Cart
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pekefe_applied_coupon");
      if (stored) {
        setAppliedCoupon(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading applied coupon:", e);
    }
  }, []);

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

  const [allProducts, setAllProducts] = useState([]);
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
    return (available.length > 0 ? available : allProducts).slice(0, 4);
  }, [allProducts, cartItems]);

  // Enforce mandatory user authentication for checkout
  useEffect(() => {
    if (sessionResult.status === "unauthenticated") {
      router.push("/giris?redirect=/sepet/odeme");
    }
  }, [sessionResult.status, router]);

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

  // Calculate Total Cart Desi / Weight
  const totalCartDesi = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const d = Number(item.desi || item.weight || item.kg || 1);
      return acc + d * (item.quantity || 1);
    }, 0);
  }, [cartItems]);

  // Helper function to match Desi/Weight Tiers configured in Admin Panel
  const getCarrierTierFee = (carrierObj, totalDesi) => {
    if (!carrierObj) return 150;
    if (carrierObj.pricingType === "flat") {
      return Number(carrierObj.fallbackFee ?? 150);
    }
    const tiers = carrierObj.tiers;
    if (Array.isArray(tiers) && tiers.length > 0) {
      const match = tiers.find(
        (t) => totalDesi >= Number(t.minDesi) && totalDesi <= Number(t.maxDesi)
      );
      if (match) return Number(match.price);

      // If totalDesi exceeds all defined maxDesi tiers
      const sorted = [...tiers].sort((a, b) => Number(b.maxDesi) - Number(a.maxDesi));
      if (sorted[0] && totalDesi > Number(sorted[0].maxDesi)) {
        if (carrierObj.outOfRangeBehavior === "highest" || !carrierObj.outOfRangeBehavior) {
          return Number(sorted[0].price);
        }
      }
    }
    return Number(carrierObj.fallbackFee ?? 150);
  };

  // Live Dynamic Shipping calculations from Management / CMS Settings per Selected Carrier
  const getCarrierLogo = (carrier) => {
    if (carrier.logoUrl && typeof carrier.logoUrl === "string" && carrier.logoUrl.trim()) {
      return carrier.logoUrl.trim();
    }
    const nameLower = (carrier.name || "").toLowerCase();
    if (nameLower.includes("yurtiçi") || nameLower.includes("yurtici") || nameLower.includes("yurt i̇çi") || nameLower.includes("yurt ici")) return "/logos/yurtici.svg";
    if (nameLower.includes("aras")) return "/logos/aras.svg";
    if (nameLower.includes("mng")) return "/logos/mng.svg";
    if (nameLower.includes("dhl")) return "/logos/dhl.svg";
    if (nameLower.includes("ptt")) return "/logos/ptt.svg";
    if (nameLower.includes("sürat") || nameLower.includes("surat")) return "/logos/surat.svg";
    if (nameLower.includes("jet") || nameLower.includes("hepsi")) return "/logos/hepsijet.svg";
    return null;
  };

  const parsedShippingCarriers = useMemo(() => {
    if (!siteSettings?.shippingCarriers) return [];
    let list = siteSettings.shippingCarriers;
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
  }, [siteSettings]);

  const activeCarriers = parsedShippingCarriers;

  // Auto select first active carrier if current selection is not in active list
  useEffect(() => {
    if (activeCarriers.length > 0) {
      const exists = activeCarriers.some(
        c => c.name.toLocaleLowerCase('tr').includes(selectedCarrier.toLocaleLowerCase('tr')) ||
             selectedCarrier.toLocaleLowerCase('tr').includes(c.name.toLocaleLowerCase('tr'))
      );
      if (!exists) {
        setSelectedCarrier(activeCarriers[0].name);
      }
    }
  }, [activeCarriers, selectedCarrier]);

  const currentCarrierObj = activeCarriers.find(
    c => c.name.toLocaleLowerCase('tr').includes(selectedCarrier.toLocaleLowerCase('tr')) ||
         selectedCarrier.toLocaleLowerCase('tr').includes(c.name.toLocaleLowerCase('tr'))
  ) || activeCarriers[0];

  const isCurrentCarrierAlwaysFree = Boolean(
    currentCarrierObj?.isFreeShipping === true ||
    currentCarrierObj?.isFreeShipping === "true" ||
    currentCarrierObj?.isFree === true ||
    currentCarrierObj?.alwaysFree === true ||
    currentCarrierObj?.pricingType === "free"
  );

  const isCurrentCarrierReceiverPay = Boolean(
    currentCarrierObj?.pricingType === "receiver_pay" ||
    currentCarrierObj?.pricingType === "buyer_pays" ||
    currentCarrierObj?.isReceiverPay === true
  );

  const carrierFreeThreshold = Number(currentCarrierObj?.freeThreshold ?? siteSettings?.shippingThreshold ?? 5000);
  const carrierFee = getCarrierTierFee(currentCarrierObj, totalCartDesi);
  const isShippingFree = isCurrentCarrierAlwaysFree || (subtotal >= carrierFreeThreshold);
  const shippingCost = subtotal === 0 ? 0 : (isCurrentCarrierReceiverPay ? 0 : (isShippingFree ? 0 : carrierFee));

  // Coupon Discount (Dynamic from Cart)
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;

  // Bank Transfer Extra Discount (Dynamic from Management Settings)
  const bankDiscountRate = siteSettings?.bankTransferDiscountRate ?? 2;
  const bankDiscount = paymentMethod === "bankTransfer" ? Math.max(0, subtotal - couponDiscount) * (bankDiscountRate / 100) : 0;
  
  // Cash on Delivery Fee (Dynamic from Management Settings)
  const codFee = paymentMethod === "cashOnDelivery" ? Number(siteSettings?.cashOnDeliveryFee ?? 25) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount - bankDiscount + shippingCost + codFee);

  // Parse dynamic payment methods from Admin / Settings
  const activePaymentMethods = useMemo(() => {
    let configMap = null;
    if (siteSettings?.paymentMethodsConfig) {
      try {
        const parsed = typeof siteSettings.paymentMethodsConfig === "string"
          ? JSON.parse(siteSettings.paymentMethodsConfig)
          : siteSettings.paymentMethodsConfig;
        if (Array.isArray(parsed)) {
          configMap = {};
          parsed.forEach((m) => { configMap[m.id] = m.enabled; });
        }
      } catch (e) {}
    }

    const allMethods = [
      {
        id: "creditCard",
        label: "Kredi / Banka Kartı",
        icon: "credit_card",
        enabled: configMap ? configMap.creditCard !== false : true,
      },
      {
        id: "bankTransfer",
        label: "Banka Havalesi / EFT",
        icon: "account_balance",
        badge: (siteSettings?.bankTransferDiscountRate ?? 0) > 0 ? `%${siteSettings.bankTransferDiscountRate} İndirimli` : null,
        enabled: configMap ? configMap.bankTransfer !== false : true,
      },
      {
        id: "openAccount",
        label: "B2B Vadeli Açık Hesap",
        icon: "receipt_long",
        enabled: configMap ? configMap.openAccount !== false : true,
      },
      {
        id: "cashOnDelivery",
        label: "Kapıda Ödeme",
        icon: "local_shipping",
        badge: (siteSettings?.cashOnDeliveryFee ?? 0) > 0 ? `+₺${siteSettings.cashOnDeliveryFee}` : null,
        enabled: configMap ? configMap.cashOnDelivery === true : (siteSettings?.cashOnDeliveryEnabled ?? false),
      },
    ];

    return allMethods.filter((m) => m.enabled);
  }, [siteSettings]);

  // Keep paymentMethod selection valid if settings change
  useEffect(() => {
    if (activePaymentMethods.length > 0) {
      const isCurrentValid = activePaymentMethods.some((m) => m.id === paymentMethod);
      if (!isCurrentValid) {
        setPaymentMethod(activePaymentMethods[0].id);
      }
    }
  }, [activePaymentMethods, paymentMethod]);

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

    const instantOrderObj = {
      orderId: `PKF-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        desc: item.desc || item.shortDesc || `${item.quantity} Adet`,
        price: Number(item.price),
        quantity: Number(item.quantity),
        img: item.img || item.image || "/premium-pekefe-kavanoz.png"
      })),
      subtotal: subtotal,
      shippingCost: shippingCost,
      total: grandTotal,
      paymentMethod: paymentMethod,
      shippingAddress: {
        name: `${formData.firstName} ${formData.lastName}`,
        address: formData.address,
        city: `${formData.district ? `${formData.district} / ` : ""}${formData.city}`,
        phone: formData.phone,
      }
    };

    try {
      const jsonStr = JSON.stringify(instantOrderObj);
      localStorage.setItem("pekefe_completed_order", jsonStr);
      sessionStorage.setItem("pekefe_completed_order", jsonStr);
      document.cookie = `pekefe_completed_order=${encodeURIComponent(jsonStr)}; path=/; max-age=3600`;
    } catch (e) {}

    // PayTR Credit Card Flow
    if (paymentMethod === "creditCard") {
      try {
        const paytrPayload = {
          cart: cartItems.map((item) => ({
            id: String(item.id),
            sku: item.sku || item.id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
          })),
          cartTotal: grandTotal,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          district: formData.district || "",
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

        const res = await fetch("/api/checkout/paytr-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paytrPayload),
        });

        const data = await res.json();

        const completedOrderObject = {
          orderId: data.orderId || `PKF-${Date.now()}`,
          date: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
          items: cartItems.map((item) => ({
            id: item.id,
            name: item.name,
            desc: item.desc || item.shortDesc || `${item.quantity} Adet`,
            price: Number(item.price),
            quantity: Number(item.quantity),
            img: item.img || item.image || "/pekefe-dut-pekmezi-kavanoz.jpg"
          })),
          subtotal: subtotal,
          shippingCost: shippingCost,
          total: grandTotal,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            city: formData.city,
            district: formData.district || "",
            fullAddress: formData.address
          }
        };
        try {
          localStorage.setItem("pekefe_completed_order", JSON.stringify(completedOrderObject));
        } catch (e) {}

        setPaytrToken(data.token);
        setIsSubmitting(false);

        // Scroll to PayTR iframe container smoothly
        setTimeout(() => {
          const iframeEl = document.getElementById("paytr-iframe-container");
          if (iframeEl) {
            iframeEl.scrollIntoView({ behavior: "smooth" });
          }
        }, 150);

        return;
      } catch (paytrErr) {
        console.error("PayTR Token Error:", paytrErr);
        setIsSubmitting(false);
        setErrorMsg("PayTR ödeme servisine bağlanırken bir sorun oluştu.");
        return;
      }
    }

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
        paymentMethod: paymentMethod, // bankTransfer, openAccount
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
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#6b1d2f]/20">2</div>
          <span className="font-label-md text-primary font-bold text-xs md:text-sm">Teslimat & Ödeme</span>
        </div>
        <div className="w-10 md:w-16 h-[2px] bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-container text-gray-400 flex items-center justify-center font-bold text-xs">3</div>
          <span className="font-label-md text-gray-400 text-xs md:text-sm">Sipariş Onayı</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Area */}
        <div className="lg:col-span-8 space-y-8">

          {/* Section 1: Delivery Address */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">local_shipping</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Teslimat & İletişim Bilgileri</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">Siparişinizin ulaştırılacağı adresi ve iletişim bilgilerini giriniz.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">ADINIZ *</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="Ahmet"
                  type="text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">SOYADINIZ *</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="Yılmaz"
                  type="text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">TELEFON *</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="05XX XXX XX XX"
                  type="tel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">E-POSTA ADRESİ</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="ahmet@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">ŞEHİR *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none cursor-pointer"
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
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">İLÇE *</label>
                {formData.city && turkeyLocations[formData.city]?.length > 0 ? (
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                    placeholder="İlçe giriniz"
                    type="text"
                    required
                  />
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">AÇIK ADRES *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest focus:bg-surface focus:border-primary focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none resize-none"
                  placeholder="Mahalle, Sokak, Bina No, Daire No..."
                  rows={3}
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 2: Shipping Method & Cargo Carrier */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">package_2</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Kargo & Gönderim Seçenekleri</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Teslimat hızınızı ve kargo firmanızı belirleyin.</p>
                </div>
              </div>
              {totalCartDesi > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-primary">scale</span>
                  <span>Sepet Hacmi: <strong className="text-primary">{totalCartDesi} Desi/Kg</strong></span>
                </div>
              )}
            </div>

            {/* Carrier Selection */}
            <div>
              <div className="flex sm:hidden justify-between items-center mb-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">Kargo Firması Tercihi</label>
                {totalCartDesi > 0 && (
                  <span className="text-[11px] font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">scale</span>
                    <span>{totalCartDesi} Desi</span>
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeCarriers.map((c) => {
                  const fee = getCarrierTierFee(c, totalCartDesi);
                  const isCarrierAlwaysFree = Boolean(
                    c.isFreeShipping === true ||
                    c.isFreeShipping === "true" ||
                    c.isFree === true ||
                    c.alwaysFree === true ||
                    c.pricingType === "free"
                  );
                  const isReceiverPay = Boolean(
                    c.pricingType === "receiver_pay" ||
                    c.pricingType === "buyer_pays" ||
                    c.isReceiverPay === true
                  );
                  const isFree = !isReceiverPay && (isCarrierAlwaysFree || (subtotal >= Number(c.freeThreshold ?? siteSettings?.shippingThreshold ?? 5000)));
                  const isSelected = selectedCarrier.toLocaleLowerCase('tr').includes(c.name.toLocaleLowerCase('tr')) || c.name.toLocaleLowerCase('tr').includes(selectedCarrier.toLocaleLowerCase('tr'));
                  const logo = getCarrierLogo(c);

                  return (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => setSelectedCarrier(c.name)}
                      className={`p-4 rounded-2xl border-2 text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-between gap-3 min-h-[105px] relative group overflow-hidden ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary shadow-md ring-2 ring-primary/20 scale-[1.02]"
                          : "border-outline-variant/30 text-gray-700 bg-white hover:border-primary/40 hover:bg-surface-container-lowest"
                      }`}
                    >
                      {/* Selection Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-xs font-bold">check</span>
                        </div>
                      )}

                      {/* Logo Container */}
                      <div className="h-14 w-full flex items-center justify-center px-2 py-1 bg-white rounded-xl border border-slate-100 shadow-2xs overflow-hidden">
                        {logo ? (
                          <img src={logo} alt={c.name} className="max-h-12 w-auto max-w-[150px] md:max-w-[170px] object-contain transition-transform group-hover:scale-105" />
                        ) : (
                          <span className="text-base font-black text-on-surface">{c.name}</span>
                        )}
                      </div>

                      {/* Footer Info & Fee Pill */}
                      <div className="flex items-center justify-between w-full pt-2.5 border-t border-outline-variant/15">
                        <span className="text-[11px] font-bold text-on-surface-variant truncate max-w-[100px]">{c.name}</span>
                        <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full transition-colors ${
                          subtotal === 0 ? "hidden" : isReceiverPay
                            ? "bg-amber-500 text-white shadow-xs"
                            : isFree
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isSelected
                            ? "bg-primary text-white shadow-xs"
                            : "bg-surface-container-high text-on-surface"
                        }`}>
                          {subtotal === 0 ? "" : isReceiverPay ? "Kapıda Alıcı Öder" : isFree ? "ÜCRETSİZ" : `+₺${fee}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Carrier Information Banner according to Pricing Type */}
              <div className="mt-5">
                {isCurrentCarrierReceiverPay ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 flex items-start sm:items-center gap-3.5 shadow-xs animate-in fade-in duration-300">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-2xl">local_shipping</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-sm text-amber-900 dark:text-amber-200">
                          📦 Ücret Alıcı Ödemeli Teslimat ({selectedCarrier})
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                          Kapıda Ödeme
                        </span>
                      </div>
                      <p className="text-xs text-amber-800/95 dark:text-amber-300 font-medium leading-relaxed">
                        Bu siparişte kargo bedeli sepet tutarınıza <strong>eklenmemiştir (0 TL)</strong>. Kargo taşıma ücreti, siparişiniz adresinize ulaştığında <strong>kargo kuryesine kapıda doğrudan ödenecektir</strong>.
                      </p>
                    </div>
                  </div>
                ) : isShippingFree ? (
                  <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 flex items-center gap-3.5 shadow-xs animate-in fade-in duration-300">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-2xl">redeem</span>
                    </div>
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                        🎉 Tebrikler! Ücretsiz Kargo Ayrıcalığından Yararlanıyorsunuz
                      </h4>
                      <p className="text-xs text-emerald-800/90 dark:text-emerald-300 font-medium mt-0.5">
                        Siparişiniz <strong>{selectedCarrier}</strong> ile adresinize tamamen ücretsiz olarak ulaştırılacaktır.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-3 shadow-xs animate-in fade-in duration-300">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">schedule</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        🚚 Standart Güvenli Teslimat ({selectedCarrier})
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Kargo ücreti sipariş toplamına dâhil edilmiştir. Teslimat sırasında kapıda herhangi bir ek ücret ödemezsiniz.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Payment Method Tabs */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Ödeme Yöntemi Seçimi</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Tercih ettiğiniz güvenli ödeme yöntemini belirleyin.</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>256-bit SSL Güvenlik</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className={`grid grid-cols-1 ${activePaymentMethods.length === 2 ? 'sm:grid-cols-2' : activePaymentMethods.length >= 4 ? 'sm:grid-cols-2 md:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
              {activePaymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/5 shadow-sm text-primary"
                      : "border-outline-variant/30 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {method.badge && (
                    <span className="absolute -top-2.5 right-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      {method.badge}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-2xl">{method.icon}</span>
                  <span className="font-bold text-xs text-center">{method.label}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: CREDIT CARD / PAYTR */}
            {paymentMethod === "creditCard" && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                {paytrToken ? (
                  <div id="paytr-iframe-container" className="bg-slate-50 p-4 md:p-6 rounded-2xl border-2 border-emerald-500 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-emerald-600 text-2xl">verified_user</span>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800">PayTR 3D Secure Güvenli Ödeme</h3>
                          <p className="text-[11px] text-slate-500">Kart bilgileriniz PayTR 256-Bit SSL şifreli korumalı alanda işlenmektedir.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaytrToken(null)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-all cursor-pointer"
                      >
                        ← Kapat / Yeniden Dene
                      </button>
                    </div>

                    <div className="w-full min-h-[600px] rounded-xl overflow-hidden bg-white shadow-inner">
                      <iframe
                        src={`https://www.paytr.com/odeme/guvenli/${paytrToken}`}
                        id="paytriframe"
                        style={{ width: '100%', minHeight: '650px', border: 'none' }}
                        allow="payment"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Visual Credit Card Preview & Form Container */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl space-y-4 relative overflow-hidden border border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">KREDİ / BANKA KARTINIZ</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-white/10">VISA</span>
                          <span className="px-2 py-0.5 rounded bg-white/10">MASTER</span>
                          <span className="px-2 py-0.5 rounded bg-white/10">TROY</span>
                        </div>
                      </div>

                      {/* Live Card Number Preview */}
                      <div className="text-xl md:text-2xl font-mono tracking-widest text-slate-100 py-2">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>

                      <div className="flex justify-between items-end text-xs font-mono text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">KART SAHİBİ</span>
                          <span className="font-bold uppercase tracking-wider">{nameOnCard || "AD SOYAD"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">SON KULLANMA</span>
                          <span className="font-bold">{expiry || "AA/YY"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">KART ÜZERİNDEKİ İSİM *</label>
                        <input
                          type="text"
                          value={nameOnCard}
                          onChange={(e) => setNameOnCard(e.target.value.toUpperCase())}
                          placeholder="AHMET YILMAZ"
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none font-medium uppercase"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">KART NUMARASI *</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                            const formatted = val.replace(/(.{4})/g, "$1 ").trim();
                            setCardNumber(formatted);
                          }}
                          placeholder="4543 0000 0000 0000"
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none font-mono font-bold tracking-wider"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">SON KULLANMA TARİHİ *</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={expiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (val.length >= 3) {
                              val = `${val.slice(0, 2)}/${val.slice(2)}`;
                            }
                            setExpiry(val);
                          }}
                          placeholder="AA / YY"
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none font-mono font-bold text-center"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">CVV / GÜVENLİK KODU *</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                          className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm outline-none font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                        <div className="flex justify-between border-b border-outline-variant/20 pb-1.5">
                          <span className="text-on-surface-variant font-sans font-medium">Banka:</span>
                          <span className="font-bold text-on-surface">{bank.name} {bank.branch ? `- ${bank.branch}` : ""}</span>
                        </div>
                        <div className="flex justify-between border-b border-outline-variant/20 pb-1.5">
                          <span className="text-on-surface-variant font-sans font-medium">Alıcı Ünvanı:</span>
                          <span className="font-bold text-on-surface">
                            {siteSettings?.companyName || siteSettings?.companyNameField || "Pekefe Gıda San. ve Tic. Ltd. Şti."}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-on-surface-variant font-sans font-medium">IBAN:</span>
                          <span className="font-bold text-primary text-sm tracking-wider select-all">
                            {bank.iban || "TR42 0001 0002 0003 0004 0005 01"}
                            {bank.currency && bank.currency !== "TRY" ? ` (${bank.currency})` : ""}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                        <span className="text-on-surface-variant font-sans">Banka:</span>
                        <span className="font-bold text-on-surface">
                          {siteSettings?.bankName || "Ziraat Bankası - İspir Şubesi"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                        <span className="text-on-surface-variant font-sans">Alıcı Ünvanı:</span>
                        <span className="font-bold text-on-surface">
                          {siteSettings?.companyName || siteSettings?.companyNameField || "Pekefe Gıda San. ve Tic. Ltd. Şti."}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant font-sans">IBAN:</span>
                        <span className="font-bold text-primary text-sm tracking-wider select-all">
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
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-primary">verified</span>
                  <span>B2B Kurumsal Bayi Vadeli Cari Ödeme</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bu ödeme yöntemi yalnızca anlaşmalı onaylı B2B kurumsal bayilerimiz için geçerlidir. Sipariş tutarı cari hesabınıza borç olarak yansıtılacak ve belirlenen vadede tahsil edilecektir.
                </p>
                <div className="p-3 bg-surface rounded-xl border border-outline-variant/30 flex justify-between text-xs">
                  <span className="font-semibold text-gray-600">İşlem Türü:</span>
                  <span className="font-bold text-primary">Cari Hesap Vadeli Borçlandırma</span>
                </div>
              </div>
            )}

            {/* TAB 4: CASH ON DELIVERY */}
            {paymentMethod === "cashOnDelivery" && (
              <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 text-purple-900 font-bold text-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-xl">local_shipping</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-purple-900">Kapıda Ödeme (Kargo Teslimatı)</h4>
                    <p className="text-xs text-purple-700 mt-0.5">Siparişiniz kurye tarafından teslim edilirken ödeme yapın.</p>
                  </div>
                </div>

                <p className="text-xs text-purple-800 leading-relaxed">
                  Kargonuz teslim edilirken nakit veya kredi kartı (POS cihazı) ile kapıda ödeme yapabilirsiniz.
                  {codFee > 0 && ` Kapıda ödeme hizmet bedeli (+₺${codFee}) toplam tutara eklenmiştir.`}
                </p>

                <div className="p-3 bg-white rounded-xl border border-purple-200/80 flex justify-between text-xs">
                  <span className="font-semibold text-gray-600">Ödeme Yöntemi:</span>
                  <span className="font-bold text-purple-700">Teslimatta Nakit / Kredi Kartı POS</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Sticky Order Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-on-surface pb-4 border-b border-outline-variant/20">
              Sipariş Özeti ({cartItems.length} Kalem)
            </h3>

            {/* Cart Items Thumbnails */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                  <div className="w-12 h-12 rounded-lg bg-surface relative overflow-hidden flex-shrink-0 border border-outline-variant/30">
                    <Image src={item.img || item.image || "/premium-pekefe-kavanoz.png"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-on-surface truncate">{item.name}</div>
                    {item.variantLabel && (
                      <div className="text-[10px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                        {item.variantLabel}
                      </div>
                    )}
                    <div className="text-[10px] text-on-surface-variant">{item.quantity} Adet</div>
                  </div>
                  <div className="text-xs font-bold text-primary">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</div>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3 pt-4 border-t border-outline-variant/20 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Ürünler Ara Toplamı</span>
                <span className="font-bold text-on-surface">₺{subtotal.toLocaleString("tr-TR")}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/60">
                  <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                  <span>-₺{(couponDiscount % 1 === 0 ? couponDiscount.toLocaleString("tr-TR") : couponDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</span>
                </div>
              )}

              {bankDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Havale / EFT İndirimi (%{bankDiscountRate})</span>
                  <span>-₺{(bankDiscount % 1 === 0 ? bankDiscount.toLocaleString("tr-TR") : bankDiscount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</span>
                </div>
              )}

              {codFee > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span>Kapıda Ödeme Bedeli</span>
                  <span>+₺{codFee.toLocaleString("tr-TR")}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Kargo Bedeli ({selectedCarrier})</span>
                  <span className="font-bold text-on-surface">
                    {isCurrentCarrierReceiverPay ? (
                      <span className="text-amber-700 font-bold px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-xs">
                        Kapıda Alıcı Öder
                      </span>
                    ) : shippingCost === 0 ? (
                      <span className="text-emerald-600 font-bold">ÜCRETSİZ</span>
                    ) : (
                      `₺${shippingCost.toLocaleString("tr-TR")}`
                    )}
                  </span>
                </div>
                {isCurrentCarrierReceiverPay && (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-sm text-amber-600 shrink-0">info</span>
                    <span>Kargo bedeli sipariş teslimatında doğrudan kargo firmasına ödenecektir.</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-baseline">
                <span className="text-base font-bold text-on-surface">Genel Toplam</span>
                <span className="text-2xl font-bold text-primary">
                  ₺{(grandTotal % 1 === 0 ? grandTotal.toLocaleString("tr-TR") : grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-lowest text-[10px] text-on-surface-variant text-center font-semibold border border-outline-variant/30/80">
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
            {!paytrToken && (
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full py-4 bg-gradient-to-r from-[#6b1d2f] to-[#8b2d3f] text-white font-bold rounded-xl shadow-lg shadow-[#6b1d2f]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>PayTR Bağlantısı Kuruluyor...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span>
                      {paymentMethod === "creditCard"
                        ? "PayTR ile Güvenli Öde (3D Secure)"
                        : paymentMethod === "cashOnDelivery"
                        ? "Kapıda Ödemeli Siparişi Onayla"
                        : "Siparişi Onayla ve Öde"}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Security Badges */}
            <div className="pt-2 space-y-2 text-[11px] text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">verified_user</span>
                <span>256-bit SSL şifreleme ile verileriniz %100 güvendedir.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">assignment_return</span>
                <span>{siteSettings?.companyDefaultReturnDays ?? 14} gün içinde koşulsuz ücretsiz iade garantisi.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Dynamic Cross-Sell Recommendations Section ("Bu Ürünleri Alanlar Bunları da Tercih Etti") */}
      {recommendations.length > 0 && (
        <section className="mt-12 pt-8 border-t border-outline-variant/20">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-secondary font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                Müşterilerin Tercihi
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-primary mt-1">
                Bu Ürünleri Alanlar Bunları da Tercih Etti
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((p) => {
              const formattedPrice = `₺${Number(p.price || p.sale_price || 0).toLocaleString("tr-TR")}`;
              const tagLabel = p.tag || p.category || "Yöresel Lezzet";
              return (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container-low flex items-center justify-center border border-slate-100">
                      <Image
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={p.name}
                        src={p.image || "/premium-pekefe-kavanoz.png"}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute top-2 left-2 bg-secondary/90 text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold z-10 shadow-xs">
                        {tagLabel}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-1 mb-2">
                      {p.shortDesc || p.desc || "Geleneksel İspir Lezzeti"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between">
                    <span className="font-bold text-sm text-primary">{formattedPrice}</span>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(p, 1);
                        setToast({ isOpen: true, message: `${p.name} sepete eklendi!`, type: "success" });
                      }}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">add_shopping_cart</span>
                      <span>Ekle</span>
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

