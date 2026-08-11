"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/modules/catalog/store";
import { useCMS } from "@/context/CMSContext";
import { 
  X, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  Phone, 
  Microscope,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { calculateCartDiscounts, CartDiscountSettings } from "@/modules/orders/server/discount-calculator";
import { Input } from "@/components/ui/Input";
import { turkeyLocations } from "@/data/turkey-locations";


interface CheckoutDrawerProps {
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function CheckoutDrawer({ onClose, onSuccess }: CheckoutDrawerProps) {
  const { data: session } = useSession();
  const t = useTranslations("Home");
  const { cmsData } = useCMS();
  const cities = React.useMemo(() => Object.keys(turkeyLocations).sort((a, b) => a.localeCompare(b, 'tr')), []);

  const whatsappNumber = cmsData?.socialWhatsapp ? cmsData.socialWhatsapp.replace(/\D/g, "") : "905441494851";
  const whatsappUrl = cmsData?.socialWhatsapp
    ? (cmsData.socialWhatsapp.startsWith("http") || cmsData.socialWhatsapp.startsWith("wa.me")
        ? (cmsData.socialWhatsapp.startsWith("http") ? cmsData.socialWhatsapp : `https://${cmsData.socialWhatsapp}`)
        : `https://wa.me/${whatsappNumber}`)
    : "https://wa.me/905441494851";

  const {
    items: cart,
    clearCart,
    removeItem,
    updateQuantity
  } = useCartStore();

  // Checkout Form States
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<"creditCard" | "havale">("creditCard");
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: ""
  });

  // User Saved Addresses States
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    addressTitle: "",
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    district: "",
    fullAddress: "",
    isDefault: false
  });

  // Recipient details (conditional)
  const [isDifferentRecipient, setIsDifferentRecipient] = useState(false);
  const [recipientData, setRecipientData] = useState({
    name: "",
    phone: ""
  });

  // Dynamic discount settings loaded from API
  const [discountSettings, setDiscountSettings] = useState<CartDiscountSettings>({
    cartDiscountType: "none",
    cartDiscountValue: 0,
    cartDiscountMinAmount: 0,
    bankTransferDiscountRate: 0
  });

  const currentUser = session?.user ? {
    name: session.user.name || session.user.email || "",
    email: session.user.email || ""
  } : null;

  const fetchCheckoutInit = async () => {
    try {
      const url = currentUser?.email
        ? `/api/checkout/initiate?email=${encodeURIComponent(currentUser.email)}`
        : `/api/checkout/initiate`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.discountSettings) {
          setDiscountSettings(data.discountSettings);
        }
        if (currentUser?.email && data.addresses && data.addresses.length > 0) {
          setUserAddresses(data.addresses);
          const defaultAddr = data.addresses.find((addr: any) => addr.isDefault) || data.addresses[0];
          setSelectedAddressId(defaultAddr.id);
          setFormData({
            name: `${defaultAddr.firstName} ${defaultAddr.lastName}`,
            phone: defaultAddr.phone,
            city: `${defaultAddr.city} / ${defaultAddr.district}`,
            address: defaultAddr.fullAddress
          });
          setShowAddAddressForm(false);
        } else {
          setUserAddresses([]);
          setSelectedAddressId("");
          if (currentUser?.email) {
            setShowAddAddressForm(true);
          }
        }
      }
    } catch (err) {
      console.error("Error initiating checkout:", err);
    }
  };

  useEffect(() => {
    fetchCheckoutInit();
  }, [currentUser?.email]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === "new") {
      setShowAddAddressForm(true);
      setFormData({ name: "", phone: "", city: "", address: "" });
    } else {
      const selected = userAddresses.find(addr => addr.id === addressId);
      if (selected) {
        setFormData({
          name: `${selected.firstName} ${selected.lastName}`,
          phone: selected.phone,
          city: `${selected.city} / ${selected.district}`,
          address: selected.fullAddress
        });
        setShowAddAddressForm(false);
      }
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!addressFormData.addressTitle || !addressFormData.firstName || !addressFormData.lastName || 
        !addressFormData.phone || !addressFormData.city || !addressFormData.district || !addressFormData.fullAddress) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      const response = await fetch("/api/user/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addressFormData,
          email: currentUser.email
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Adres eklenirken bir hata oluştu.");
      }

      toast.success("Yeni adres başarıyla kaydedildi!");
      await fetchCheckoutInit();
      setAddressFormData({
        addressTitle: "",
        firstName: "",
        lastName: "",
        phone: "",
        city: "",
        district: "",
        fullAddress: "",
        isDefault: false
      });
    } catch (error: any) {
      toast.error(error.message || "Adres kaydedilemedi.");
    }
  };

  const changeQty = (id: string, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;
    updateQuantity(id, newQty);
  };

  const getCartSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // CMS'den kargo bilgileri
  const shippingFeeFromCMS = Number(cmsData?.shippingFee ?? 0);
  const shippingThreshold = Number(cmsData?.shippingThreshold ?? 0);

  const getCartBreakdown = () => {
    const serverCartItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      cartDiscountRate: item.cartDiscountRate || 0
    }));

    // Ham subtotal (indirim öncesi)
    const rawSubtotal = serverCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Kargo: eşik ham subtotal üzerinden kontrol edilmeli
    const isFreeShipping = shippingThreshold > 0 && rawSubtotal >= shippingThreshold;
    const shipping = isFreeShipping ? 0 : shippingFeeFromCMS;

    // Tüm indirimleri uygula (kargo dahil)
    const breakdown = calculateCartDiscounts(
      serverCartItems,
      discountSettings,
      selectedPayment === "creditCard" ? "creditCard" : "bankTransfer",
      shipping,
      0
    );

    return {
      rawSubtotal,
      discountedSubtotal: breakdown.discountedSubtotal,
      itemDiscountTotal: breakdown.itemDiscountTotal,
      cartDiscount: breakdown.cartDiscount,
      bankTransferDiscount: breakdown.bankTransferDiscount,
      bankTransferDiscountRate: breakdown.bankTransferDiscountRate,
      totalDiscount: breakdown.totalDiscount,
      shipping: breakdown.shipping,
      isFreeShipping,
      grandTotal: breakdown.grandTotal
    };
  };

  const getCartTotal = () => getCartBreakdown().grandTotal;

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const isSavedAddressUsed = currentUser && selectedAddressId !== "new" && !showAddAddressForm;

    const finalName = isSavedAddressUsed
      ? (isDifferentRecipient ? recipientData.name : formData.name)
      : formData.name;

    const finalPhone = isSavedAddressUsed
      ? (isDifferentRecipient ? recipientData.phone : formData.phone)
      : formData.phone;

    if (!finalName || !finalPhone || !formData.city || !formData.address) {
      toast.error("Lütfen tüm adres ve teslimat bilgilerini doldurun.");
      return;
    }

    if (selectedPayment === "creditCard") {
      if (!cardData.number || cardData.number.length < 19) {
        toast.error("Lütfen geçerli bir kart numarası giriniz.");
        return;
      }
      if (!cardData.expiry || cardData.expiry.length < 5) {
        toast.error("Lütfen son kullanma tarihini giriniz (AA/YY).");
        return;
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        toast.error("Lütfen geçerli bir CVV kodu giriniz.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedAddress = userAddresses.find(addr => addr.id === selectedAddressId);
      const checkoutPayload = {
        cart: cart.map(item => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        cartTotal: getCartTotal(),
        paymentMethod: selectedPayment === "creditCard" ? "creditCard" : "bankTransfer",
        name: finalName,
        phone: finalPhone,
        address: `${formData.city} - ${formData.address} [Ödeme: ${selectedPayment === 'creditCard' ? 'Kredi Kartı' : `Havale/EFT (-${discountSettings.bankTransferDiscountRate}%)`}]`,
        shippingFee: getCartBreakdown().shipping,
        selectedCarrierName: shippingFeeFromCMS > 0 ? "Kargo" : "Alıcıya Ait",
        ...(selectedPayment === "creditCard" && {
          cardNumber: cardData.number.replace(/\s/g, ""),
          expDate: cardData.expiry,
          cvv: cardData.cvv
        }),
        ...(selectedAddress && {
          shippingAddress: {
            addressTitle: selectedAddress.addressTitle,
            firstName: isDifferentRecipient ? (finalName.split(' ')[0] || '') : selectedAddress.firstName,
            lastName: isDifferentRecipient ? (finalName.split(' ').slice(1).join(' ') || '') : selectedAddress.lastName,
            phone: finalPhone,
            city: selectedAddress.city,
            district: selectedAddress.district,
            fullAddress: selectedAddress.fullAddress
          },
          billingAddress: {
            addressTitle: selectedAddress.addressTitle,
            firstName: selectedAddress.firstName,
            lastName: selectedAddress.lastName,
            phone: selectedAddress.phone,
            city: selectedAddress.city,
            district: selectedAddress.district,
            fullAddress: selectedAddress.fullAddress
          }
        })
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Sipariş verilirken bir hata oluştu.");
      }

      onSuccess(resData.orderId);
      clearCart();
      onClose();
      setFormData({ name: "", phone: "", city: "", address: "" });
      setRecipientData({ name: "", phone: "" });
      setIsDifferentRecipient(false);
      toast.success("Siparişiniz başarıyla alındı!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Bir bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      ></div>

      {/* Drawer Container */}
      <div className="relative w-full max-w-[420px] bg-[#0f1318] border-l border-white/[0.06] h-full flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10 animate-slide-left">
        
        {/* Drawer Header — Premium Amber Gradient */}
        <div className="px-6 pt-6 pb-5 flex items-center justify-between shrink-0 relative overflow-hidden">
          {/* Header ambient glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/8 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-base tracking-tight">{t("cart_title")}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[11px] font-bold">
                  {getCartItemCount()} {t("products")}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="relative z-10 w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-white/[0.06]" />

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-5">
                <ShoppingBag className="w-9 h-9 text-slate-600" />
              </div>
              <h4 className="text-white font-bold text-base mb-1">{t("cart_empty_title")}</h4>
              <p className="text-slate-500 text-sm">{t("cart_empty_desc")}</p>
              <button 
                onClick={() => { onClose(); handleScrollTo("urunler"); }}
                className="mt-7 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 text-amber-400 text-sm font-bold px-7 py-3 rounded-2xl transition-all cursor-pointer"
              >
                {t("cart_browse")}
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="group flex items-center gap-4 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-amber-500/25 rounded-2xl p-3.5 transition-all duration-200">
                {/* Product Image */}
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-white/5 flex items-center justify-center flex-none relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : null}
                  <Microscope className={`w-6 h-6 text-amber-500/50 ${item.image ? 'hidden' : ''}`} />
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-[13px] font-bold leading-snug line-clamp-2">{item.name}</h4>
                  <p className="text-amber-400 text-sm font-extrabold mt-1.5 tracking-tight">{item.price.toLocaleString('tr-TR')} ₺</p>
                </div>
                
                {/* Qty Controls + Remove */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-0 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => changeQty(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black text-white text-sm w-8 text-center border-x border-white/10">{item.quantity}</span>
                    <button 
                      onClick={() => changeQty(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Checkout Form */}
        {cart.length > 0 && (
          <div className="border-t border-white/[0.06] px-5 pt-5 pb-5 bg-[#0f1318] space-y-4 shrink-0 overflow-y-auto max-h-[62%]">
            
            {/* Price Summary Card */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-2.5">
              {(() => {
                const bd = getCartBreakdown();
                return (
                  <>
                    {/* Ara Toplam */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm font-medium">Ara Toplam</span>
                      <span className="text-slate-200 text-sm font-semibold">{bd.rawSubtotal.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ₺</span>
                    </div>

                    {/* Ürün bazlı indirim */}
                    {bd.itemDiscountTotal > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs font-medium">Ürün İndirimi</span>
                        <span className="text-emerald-400 text-xs font-bold">−{bd.itemDiscountTotal.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ₺</span>
                      </div>
                    )}

                    {/* Kampanya indirimi */}
                    {bd.cartDiscount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs font-medium">Kampanya İndirimi</span>
                        <span className="text-emerald-400 text-xs font-bold">−{bd.cartDiscount.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ₺</span>
                      </div>
                    )}

                    {/* Havale indirimi */}
                    {bd.bankTransferDiscount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs font-medium">Havale İndirimi ({bd.bankTransferDiscountRate}%)</span>
                        <span className="text-emerald-400 text-xs font-bold">−{bd.bankTransferDiscount.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ₺</span>
                      </div>
                    )}

                    {/* Kargo */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm font-medium">Kargo</span>
                      {shippingFeeFromCMS > 0 ? (
                        bd.isFreeShipping ? (
                          <span className="text-emerald-400 text-sm font-bold">Ücretsiz 🎉</span>
                        ) : (
                          <span className="text-slate-200 text-sm font-semibold">{bd.shipping.toLocaleString('tr-TR')} ₺</span>
                        )
                      ) : (
                        <span className="text-amber-400 text-sm font-semibold">Alıcıya Ait</span>
                      )}
                    </div>

                    {/* Ücretsiz kargo eşiği notu */}
                    {shippingFeeFromCMS > 0 && !bd.isFreeShipping && shippingThreshold > 0 && (
                      <p className="text-[11px] text-slate-500 text-right">
                        <span className="text-amber-500 font-bold">{(shippingThreshold - bd.rawSubtotal).toLocaleString('tr-TR')} ₺</span> daha alışveriş yapın → kargo bedava!
                      </p>
                    )}
                    {shippingFeeFromCMS === 0 && (
                      <p className="text-[11px] text-slate-600 text-right">Kargo ücreti teslimat sırasında tahsil edilir</p>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-white/[0.08] my-1" />

                    {/* Grand Total */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-black text-base uppercase tracking-widest">{t("cart_total")}</span>
                      <div className="text-right">
                        <div className="text-amber-400 font-black text-2xl tracking-tight">{bd.grandTotal.toLocaleString('tr-TR', {minimumFractionDigits: 0, maximumFractionDigits: 2})} ₺</div>
                        <p className="text-slate-600 text-[10px] mt-0.5 uppercase tracking-wider">KDV Dahil</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Saved Address Picker */}
                {currentUser && userAddresses.length > 0 && (
                  <div className="col-span-2 space-y-1.5 text-left">
                    <label className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">{t("checkout_address_label")}</label>
                    <select
                      value={selectedAddressId || userAddresses[0].id}
                      onChange={(e) => handleAddressSelect(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-colors"
                    >
                      {userAddresses.map((addr: any) => (
                        <option key={addr.id} value={addr.id}>
                          📍 {addr.addressTitle} ({addr.firstName} {addr.lastName} - {addr.city})
                        </option>
                      ))}
                      <option value="new">{t("checkout_new_address")}</option>
                    </select>
                  </div>
                )}

                {/* Add New Address Panel */}
                {currentUser && (showAddAddressForm || userAddresses.length === 0) && (
                  <div className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-3 animate-fade-in text-left">
                    <h4 className="text-slate-200 text-xs font-bold flex items-center gap-1.5 border-b border-white/[0.08] pb-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Yeni Adres Ekle</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="Adres Başlığı (örn. Ev, İş) *" 
                        required
                        value={addressFormData.addressTitle}
                        onChange={(e) => setAddressFormData({ ...addressFormData, addressTitle: e.target.value })}
                        className="col-span-2 w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                      <input 
                        type="text" 
                        placeholder="Ad *" 
                        required
                        value={addressFormData.firstName}
                        onChange={(e) => setAddressFormData({ ...addressFormData, firstName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                      <input 
                        type="text" 
                        placeholder="Soyad *" 
                        required
                        value={addressFormData.lastName}
                        onChange={(e) => setAddressFormData({ ...addressFormData, lastName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                      <Input 
                        type="phone" 
                        placeholder="Telefon *" 
                        required
                        value={addressFormData.phone}
                        onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                        className="col-span-2 w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                      <select 
                        required
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value, district: "" })}
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-150 outline-none transition-colors appearance-none"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-100">İl Seçin</option>
                        {cities.map(c => <option key={c} value={c} className="bg-slate-900 text-slate-100">{c}</option>)}
                      </select>
                      <select 
                        required
                        disabled={!addressFormData.city}
                        value={addressFormData.district}
                        onChange={(e) => setAddressFormData({ ...addressFormData, district: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-150 outline-none transition-colors appearance-none disabled:opacity-50"
                      >
                        <option value="" disabled className="bg-slate-900 text-slate-100">İlçe Seçin</option>
                        {addressFormData.city && (turkeyLocations[addressFormData.city] || []).map(d => (
                          <option key={d} value={d} className="bg-slate-900 text-slate-100">{d}</option>
                        ))}
                      </select>
                      <textarea 
                        placeholder="Açık Adres *" 
                        required
                        rows={2}
                        value={addressFormData.fullAddress}
                        onChange={(e) => setAddressFormData({ ...addressFormData, fullAddress: e.target.value })}
                        className="col-span-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition-colors resize-none"
                      ></textarea>
                      <label className="col-span-2 flex items-center gap-2 cursor-pointer pt-1">
                        <input 
                          type="checkbox"
                          checked={addressFormData.isDefault}
                          onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                          className="w-4 h-4 rounded bg-white/5 border-white/20 text-amber-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-slate-400 text-[11.5px] font-medium">Varsayılan adres olarak kaydet</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAddAddressSubmit}
                        className="col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0B0F17] font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(245,158,11,0.3)]"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Adresi Profilime Kaydet</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Address details & recipient toggle for logged in users */}
                {currentUser && !showAddAddressForm && userAddresses.length > 0 && (
                  <>
                    {/* Selected Address Details Card */}
                    {(() => {
                      const selected = userAddresses.find(addr => addr.id === selectedAddressId);
                      if (!selected) return null;
                      return (
                        <div className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-xs space-y-2 text-slate-300">
                          <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5 border-b border-white/[0.08] pb-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>{selected.addressTitle}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-2 gap-x-3 pt-1 text-left">
                            <div>
                              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Teslim Alacak Kişi</span>
                              <span className="text-sm font-semibold text-slate-100">{selected.firstName} {selected.lastName}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Telefon</span>
                              <span className="text-sm font-semibold text-slate-100">{selected.phone}</span>
                            </div>
                            <div className="col-span-2 mt-1">
                              <span className="text-slate-500 font-bold block text-[10px] uppercase tracking-wider">Teslimat Adresi</span>
                              <span className="text-sm font-semibold text-slate-100">{selected.fullAddress} - {selected.district} / {selected.city}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Different Recipient Toggle */}
                    <label className="col-span-2 flex items-center gap-2 cursor-pointer py-1.5 text-left">
                      <input 
                        type="checkbox"
                        id="different_recipient_checkbox"
                        checked={isDifferentRecipient}
                        onChange={(e) => setIsDifferentRecipient(e.target.checked)}
                        className="w-4 h-4 rounded bg-white/5 border-white/20 text-amber-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-slate-400 text-xs font-semibold">Alıcı başkası olacak</span>
                    </label>

                    {/* Different Recipient Input Fields */}
                    {isDifferentRecipient && (
                      <div className="col-span-2 grid grid-cols-2 gap-2.5 animate-fade-in text-left">
                        <div className="col-span-2">
                          <input 
                            type="text" 
                            id="recipient_name_input"
                            placeholder="Alıcının Adı Soyadı *" 
                            required
                            value={recipientData.name}
                            onChange={(e) => setRecipientData({ ...recipientData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="phone" 
                            id="recipient_phone_input"
                            placeholder="Alıcının Telefon Numarası *" 
                            required
                            value={recipientData.phone}
                            onChange={(e) => setRecipientData({ ...recipientData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Standard Address Inputs for Guest Users */}
                {!currentUser && (
                  <>
                    <input 
                      type="text" 
                      id="guest_name_input"
                      placeholder="Ad Soyad *" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-2 w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                    />
                    <Input 
                      type="phone" 
                      id="guest_phone_input"
                      placeholder="Telefon Numarası *" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                    />
                    <input 
                      type="text" 
                      id="guest_city_input"
                      placeholder="İl / İlçe *" 
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                    />
                    <textarea 
                      id="guest_address_textarea"
                      placeholder="Teslimat Adresi *" 
                      required
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="col-span-2 w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors resize-none"
                    ></textarea>
                  </>
                )}
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t("checkout_payment_method") || "ÖDEME YÖNTEMİ"}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedPayment("creditCard")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${selectedPayment === "creditCard" ? "border-amber-500 bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-md shadow-amber-500/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"}`}
                  >
                    <span className="text-xs font-bold">Kredi Kartı</span>
                    <span className="text-[10px] text-amber-600/90 font-bold mt-0.5">Online Güvenli Ödeme</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSelectedPayment("havale")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${selectedPayment === "havale" ? "border-amber-500 bg-amber-500/10 text-amber-500 dark:text-amber-400 shadow-md shadow-amber-500/10" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"}`}
                  >
                    <span className="text-xs font-bold">{t("checkout_bank_transfer")}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{t("checkout_bank_discount")}</span>
                  </button>
                </div>
              </div>

              {/* Credit Card Input Form */}
              {selectedPayment === "creditCard" && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 space-y-3 animate-fade-in text-left">
                  <h4 className="text-slate-200 text-xs font-bold flex items-center gap-1.5 border-b border-white/[0.08] pb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Kart Bilgileri</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-3">
                      <input 
                        type="text" 
                        placeholder="Kart Numarası *" 
                        required
                        maxLength={19}
                        value={cardData.number}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                          setCardData({ ...cardData, number: formatted.slice(0, 19) });
                        }}
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        placeholder="Son Kullanma (AA/YY) *" 
                        required
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value.length > 2) {
                            value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                          }
                          setCardData({ ...cardData, expiry: value.slice(0, 5) });
                        }}
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <input 
                        type="password" 
                        placeholder="CVV *" 
                        required
                        maxLength={3}
                        value={cardData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setCardData({ ...cardData, cvv: value.slice(0, 3) });
                        }}
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="relative w-full overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-[#0B0F17] font-black text-base py-4.5 rounded-2xl transition-all duration-300 shadow-[0_4px_24px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.5)] active:scale-[0.98] flex items-center justify-center gap-2.5 mt-3 group"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-[#0B0F17]/60 border-t-[#0B0F17] rounded-full animate-spin"></span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{t("checkout_complete")}</span>
                  </>
                )}
              </button>

              {/* WhatsApp Support */}
              <a 
                href={whatsappUrl} 
                target="_blank"
                className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/25 hover:border-[#25D366]/50 active:scale-[0.98] text-[#25D366] font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-300"
              >
                <Phone className="w-4.5 h-4.5" />
                <span>Müşteri Hizmetleri · WhatsApp</span>
              </a>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
