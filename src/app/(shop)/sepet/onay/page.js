"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clearCart, clearAppliedCoupon } from "@/utils/cartStorage";
import { trackPurchase } from "@/lib/gtm-ecommerce";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  Award,
  MapPin,
  CreditCard,
  ArrowRight,
  Home,
  ShoppingBag,
  ShieldCheck,
  Landmark,
  Copy,
  Check,
  Printer,
  MessageCircle,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";

function SepetOnayContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");
  const queryOid = searchParams.get("oid");
  const [completedOrder, setCompletedOrder] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    let parsedOrder = null;
    try {
      let storedData =
        localStorage.getItem("pekefe_completed_order") ||
        sessionStorage.getItem("pekefe_completed_order");
      if (!storedData && typeof document !== "undefined") {
        const match = document.cookie.match(
          new RegExp("(?:^|; )pekefe_completed_order=([^;]*)")
        );
        if (match && match[1]) storedData = decodeURIComponent(match[1]);
      }
      if (storedData) {
        const parsed = JSON.parse(storedData);
        parsedOrder = parsed;
        if (!queryOrderId || parsed.orderId === queryOrderId) {
          setCompletedOrder(parsed);
        }
      }
    } catch (e) {
      console.error("Error reading completed order from storage:", e);
    }

    // PayTR 3D Secure onay dönüşünde siparişi sunucuya anında kesinleştir (yalnızca kredi kartı / PayTR akışında)
    if (
      queryOid ||
      (parsedOrder?.orderId &&
        (!parsedOrder?.paymentMethod || parsedOrder?.paymentMethod === "creditCard"))
    ) {
      fetch("/api/checkout/confirm-paytr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oid: queryOid || "",
          orderId: queryOrderId || parsedOrder?.orderId || "",
          completedOrder: parsedOrder,
        }),
      }).catch(() => {});
    }

    // Güncel ayarlar ve banka hesaplarını canlı yükle
    const ts = Date.now();
    fetch(`/api/settings?t=${ts}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSiteSettings(data);
      })
      .catch(() => {});

    if (parsedOrder?.paymentMethod === "bankTransfer") {
      fetch(`/api/accounting/banks?t=${ts}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data || [];
          setBankAccounts(list);
        })
        .catch(() => {});
    }

    if (queryOrderId) {
      fetch(`/api/orders?personal=true`)
        .then((r) => (r.ok ? r.json() : []))
        .then((ordersList) => {
          if (Array.isArray(ordersList)) {
            const found = ordersList.find(
              (o) => o.id === queryOrderId || o.orderNumber === queryOrderId
            );
            if (found) {
              setCompletedOrder((prev) => ({
                ...prev,
                orderId: found.id || queryOrderId,
                date: found.date || prev?.date,
                total: Number(found.total ?? found.amount ?? 0),
                subtotal: Number(found.total ?? found.amount ?? 0),
                shippingCost: Number(found.shippingFee || 0),
                paymentMethod:
                  found.method === "Banka Havalesi"
                    ? "bankTransfer"
                    : found.method === "Açık Hesap"
                    ? "openAccount"
                    : found.method === "Kapıda Ödeme"
                    ? "cashOnDelivery"
                    : "creditCard",
                cargoCompany: found.cargoCompany || prev?.cargoCompany || "Sürat Kargo",
                items:
                  Array.isArray(found.items) && found.items.length > 0
                    ? found.items
                    : prev?.items || [],
                shippingAddress: {
                  name: found.client || found.customerName || prev?.shippingAddress?.name,
                  address: found.address || prev?.shippingAddress?.address,
                  phone: found.phone || prev?.shippingAddress?.phone,
                },
              }));
            }
          }
        })
        .catch((err) => console.error("Error fetching order by query id:", err));
    }

    clearCart();
    clearAppliedCoupon();
  }, [queryOrderId, queryOid]);

  // GTM / Google Ads Purchase Conversion Event (idempotent per orderId) + Retention Cart Recovery
  useEffect(() => {
    if (!completedOrder?.orderId) return;
    trackPurchase({
      orderId: completedOrder.orderId,
      total: completedOrder.total,
      subtotal: completedOrder.subtotal,
      shippingCost: completedOrder.shippingCost,
      coupon: completedOrder.coupon?.code || completedOrder.couponCode || null,
      items: completedOrder.items || [],
    });

    const emailVal =
      completedOrder?.shippingAddress?.email || completedOrder?.email || "";
    const phoneVal =
      completedOrder?.shippingAddress?.phone || completedOrder?.phone || "";
    if (emailVal || phoneVal) {
      fetch("/api/retention/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recover",
          email: emailVal,
          phone: phoneVal,
          orderId: completedOrder.orderId,
        }),
      }).catch(() => {});
    }
  }, [completedOrder]);

  const handleCopy = (text, key) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(String(text || ""));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2200);
    }
  };

  const orderNum =
    completedOrder?.orderId || "PKF-" + Math.floor(100000 + Math.random() * 900000);

  const formatDate = (raw) => {
    if (!raw)
      return new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    try {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    } catch {}
    if (typeof raw === "string" && raw.trim().length > 3 && !raw.includes("Invalid")) {
      return raw;
    }
    return new Date().toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (val) =>
    Number(val || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const formatIban = (raw) =>
    String(raw || "")
      .replace(/\s+/g, "")
      .toUpperCase()
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const orderDate = formatDate(completedOrder?.date);
  const items = completedOrder?.items || [];
  const subtotal =
    completedOrder?.subtotal ??
    items.reduce((a, b) => a + Number(b.price || 0) * Number(b.quantity || 1), 0);
  const shippingCost = Number(completedOrder?.shippingCost ?? 0);
  const bankDiscount = Number(completedOrder?.bankDiscount ?? 0);
  const total = Number(completedOrder?.total ?? Math.max(0, subtotal - bankDiscount + shippingCost));
  const shippingAddress = completedOrder?.shippingAddress;
  const isBankTransfer = completedOrder?.paymentMethod === "bankTransfer";

  const paymentMethodLabel =
    completedOrder?.paymentMethod === "bankTransfer"
      ? "Banka Havalesi / EFT"
      : completedOrder?.paymentMethod === "openAccount"
      ? "B2B Vadeli Açık Hesap"
      : completedOrder?.paymentMethod === "cashOnDelivery"
      ? "Kapıda Ödeme"
      : "Kredi / Banka Kartı (3D Secure)";

  const activeBanks = (bankAccounts || []).filter((b) => b?.status === "active" && b?.iban);
  const banksToDisplay =
    activeBanks.length > 0
      ? activeBanks
      : siteSettings?.bankIban
      ? [
          {
            id: "cms-bank",
            bankName: siteSettings.bankName || "HALKBANK",
            branch: "",
            accountHolder: siteSettings.companyName || "İLHAN EFE",
            iban: siteSettings.bankIban,
          },
        ]
      : [];

  const waPhoneDigits = String(siteSettings?.socialWhatsapp || siteSettings?.contactPhone || "905342709140").replace(/\D/g, "");
  const normalizedWaPhone = waPhoneDigits.startsWith("0")
    ? "9" + waPhoneDigits
    : waPhoneDigits.length === 10
    ? "90" + waPhoneDigits
    : waPhoneDigits;
  const waSupportUrl = `https://wa.me/${normalizedWaPhone}?text=${encodeURIComponent(
    `Merhaba PEKEFE, #${orderNum} numaralı siparişim hakkında bilgi almak istiyorum.`
  )}`;

  return (
    <div className="w-full bg-gradient-to-b from-[#faf6f2] via-[#fdfbf9] to-[#f7f2ec] text-slate-900 min-h-screen py-8 sm:py-12">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 3-Step Completed Progress Bar */}
        <div className="flex items-center justify-center gap-2 sm:gap-5 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-800">Sepetim</span>
          </div>
          <div className="w-8 sm:w-16 h-[2px] bg-emerald-500 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-800">Teslimat &amp; Ödeme</span>
          </div>
          <div className="w-8 sm:w-16 h-[2px] bg-[#6b1d2f] rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#6b1d2f] text-amber-300 flex items-center justify-center text-xs font-bold shadow-md shadow-[#6b1d2f]/25 ring-4 ring-[#6b1d2f]/10">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <span className="text-xs sm:text-sm font-black text-[#6b1d2f]">Sipariş Onayı</span>
          </div>
        </div>

        {/* Luxury Hero Confirmation Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#521222] via-[#6b1d2f] to-[#3f0e1a] text-white shadow-xl shadow-[#6b1d2f]/15 border border-[#8b2b41]/40">
          {/* Subtle Decorative Glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-rose-400/10 blur-3xl" />

          <div className="relative p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <div className="relative shrink-0">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-amber-300/40 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10 sm:w-11 sm:h-11 text-amber-300" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[#6b1d2f] shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-[11px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  {isBankTransfer ? "Sipariş Alındı · Havale Bekleniyor" : "Siparişiniz Onaylandı"}
                </div>
                <h1 className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white">
                  Teşekkür Ederiz, Siparişiniz Alındı!
                </h1>
                <p className="text-rose-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
                  {isBankTransfer
                    ? "Banka havalesi / EFT ödeme bilgileriniz e-posta adresinize gönderildi. Ödeme teyidinin ardından İspir'in doğal lezzetleri aynı gün özenle kargoya hazırlanacaktır."
                    : "İspir yaylalarının katkısız doğal lezzetlerini sizin için tazelik kontrolünden geçirip özenle paketlemeye başladık."}
                </p>
              </div>
            </div>

            {/* Order Number Pill & Print */}
            <div className="flex flex-col items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200/90 block">
                    SİPARİŞ NUMARANIZ
                  </span>
                  <span className="font-mono font-black text-base sm:text-lg text-white tracking-wider">
                    #{orderNum}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(orderNum, "orderNum")}
                  className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer print:hidden"
                  title="Sipariş Numarasını Kopyala"
                >
                  {copiedKey === "orderNum" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => typeof window !== "undefined" && window.print()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 hover:text-white transition cursor-pointer print:hidden"
              >
                <Printer className="w-3.5 h-3.5" /> Sipariş Özetini Yazdır
              </button>
            </div>
          </div>
        </section>

        {/* Priority Bank Transfer Instructions Card (Shown Immediately Below Hero for Bank Transfer) */}
        {isBankTransfer && (
          <section className="rounded-3xl bg-gradient-to-br from-amber-50 via-[#fffcf5] to-orange-50/70 border-2 border-amber-300/80 shadow-md p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-[#6b1d2f]">
                    Banka Havalesi / EFT Ödeme Bilgileri
                  </h2>
                  <p className="text-xs text-amber-900/80 font-medium">
                    Aynı bilgiler e-posta adresinize de otomatik olarak gönderildi.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-center">
                <CheckCircle2 className="w-3.5 h-3.5" /> E-posta İletildi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                    ÖDENECEK NET TUTAR
                  </span>
                  <span className="font-mono font-black text-2xl text-[#6b1d2f]">
                    ₺{formatPrice(total)}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900">
                  Havale / EFT / FAST
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                    HAVALE AÇIKLAMA KODU (ZORUNLU)
                  </span>
                  <span className="font-mono font-black text-lg text-[#6b1d2f]">
                    #{orderNum}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(orderNum, "transferRef")}
                  className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                >
                  {copiedKey === "transferRef" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" /> Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Kodu Kopyala
                    </>
                  )}
                </button>
              </div>
            </div>

            {banksToDisplay.length > 0 && (
              <div className="space-y-3">
                {banksToDisplay.map((b, i) => {
                  const formatted = formatIban(b.iban);
                  const copyKey = b.id || `bank-${i}`;
                  return (
                    <div
                      key={copyKey}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-800">
                          {b.bankName}
                          {b.branch ? ` · ${b.branch}` : ""}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-600">
                          Alıcı Ünvanı:{" "}
                          <strong className="text-slate-900">
                            {b.accountHolder || siteSettings?.companyName || "İLHAN EFE"}
                          </strong>
                        </div>
                        <div className="font-mono font-black text-base sm:text-lg text-[#6b1d2f] tracking-wider pt-0.5">
                          {formatted}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(formatted.replace(/\s+/g, ""), copyKey)}
                        className="px-4 py-2.5 rounded-xl bg-[#6b1d2f] hover:bg-[#521222] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition shadow-sm"
                      >
                        {copiedKey === copyKey ? (
                          <>
                            <Check className="w-4 h-4 text-amber-300" /> IBAN Kopyalandı
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> IBAN Kopyala
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left 7 Columns: Items, Price Breakdown & Delivery Timeline */}
          <div className="lg:col-span-7 space-y-6">
            {/* Order Summary & Items Card */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-slate-900">
                      Sipariş Özeti
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {items.length} kalem ürün seçildi
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
                  <Truck className="w-3.5 h-3.5 text-[#6b1d2f]" />
                  {completedOrder?.cargoCompany || "Sürat Kargo"}
                </span>
              </div>

              {items.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#faf6f2] border border-slate-200/70 shrink-0 relative overflow-hidden">
                          <Image
                            className="object-cover"
                            alt={item.name || "PEKEFE Ürün"}
                            src={
                              item.img ||
                              item.image ||
                              "/pekefe-dut-pekmezi-kavanoz-tr.jpg"
                            }
                            fill
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
                            {item.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {item.variantLabel && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                                {item.variantLabel}
                              </span>
                            )}
                            <span>
                              {item.quantity} adet × ₺{formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-black text-base sm:text-lg text-[#6b1d2f]">
                          ₺{formatPrice((item.price || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl">
                  Sipariş kalemleri hesabınızdaki <strong>Siparişlerim</strong> bölümünde listelenmektedir.
                </div>
              )}

              {/* Totals Breakdown */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Ürünler Ara Toplamı</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₺{formatPrice(subtotal)}
                  </span>
                </div>

                {bankDiscount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Havale / EFT İndirimi</span>
                    <span className="font-mono">-₺{formatPrice(bankDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-600">
                  <span>Kargo Bedeli</span>
                  {shippingCost === 0 ? (
                    <span className="font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs">
                      ÜCRETSİZ
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-slate-900">
                      ₺{formatPrice(shippingCost)}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-slate-200">
                  <div>
                    <span className="font-serif font-bold text-lg text-slate-900 block">
                      Genel Toplam
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      KDV Dâhil
                    </span>
                  </div>
                  <span className="font-mono font-black text-2xl sm:text-3xl text-[#6b1d2f]">
                    ₺{formatPrice(total)}
                  </span>
                </div>
              </div>
            </section>

            {/* 3-Step Visual Delivery Journey */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-slate-900 mb-5 flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-[#6b1d2f]" /> Siparişiniz Nasıl Ulaşacak?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative p-4 rounded-2xl bg-[#faf6f2] border border-[#6b1d2f]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-[#6b1d2f] text-white flex items-center justify-center text-xs font-black">
                      1
                    </span>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Tamamlandı
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">Sipariş Kaydı</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Sipariş detaylarınız e-posta adresinize iletildi.
                  </p>
                </div>

                <div className="relative p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <p className="font-bold text-slate-900 text-sm">Taze Paketleme</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    İspir&apos;den cam koruma ambalajıyla özenle hazırlanır.
                  </p>
                </div>

                <div className="relative p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <span className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <p className="font-bold text-slate-900 text-sm">Hızlı Sevkiyat</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Kargo takip kodunuz SMS ve e-posta ile paylaşılır.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right 5 Columns: Order Info, Address, Loyalty & WhatsApp Help */}
          <div className="lg:col-span-5 space-y-6">
            {/* Order Metadata & Shipping Address */}
            <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-[#6b1d2f]" /> Sipariş Detayları
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    isBankTransfer
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {isBankTransfer ? "Ödeme Bekliyor" : "Hazırlanıyor"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" /> Tarih
                  </span>
                  <p className="font-bold text-slate-800 text-xs sm:text-sm">{orderDate}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" /> Tahmini Teslimat
                  </span>
                  <p className="font-bold text-slate-800 text-xs sm:text-sm">2–3 İş Günü</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                  <CreditCard className="w-3 h-3" /> Ödeme Yöntemi
                </span>
                <p className="font-bold text-slate-900 text-sm">{paymentMethodLabel}</p>
              </div>

              {/* Delivery Address */}
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6b1d2f]" /> Teslimat Adresi
                </span>
                <div className="bg-[#faf6f2] p-4 rounded-2xl border border-[#6b1d2f]/10 text-sm text-slate-700 space-y-1">
                  {shippingAddress ? (
                    <>
                      {shippingAddress.name && (
                        <p className="font-bold text-[#6b1d2f]">{shippingAddress.name}</p>
                      )}
                      <p className="text-xs sm:text-sm leading-relaxed">
                        {shippingAddress.address ||
                          shippingAddress.fullAddress ||
                          shippingAddress.street ||
                          "Adres Bilgisi Kaydedildi"}
                      </p>
                      {shippingAddress.city && (
                        <p className="text-xs text-slate-500 font-semibold">
                          {shippingAddress.district ? `${shippingAddress.district} / ` : ""}
                          {shippingAddress.city}
                        </p>
                      )}
                      {shippingAddress.phone && (
                        <p className="font-mono text-xs font-bold text-slate-700 pt-1">
                          Tel: {shippingAddress.phone}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs">{completedOrder?.address || "Adres Bilgisi Kaydedildi"}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Loyalty Points Card */}
            <section className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-[#fffbf0] to-orange-50/60 border border-amber-300/60 flex items-center gap-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/25 border border-amber-400/50 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">
                  Kazanılan Sadakat Puanı
                </p>
                <p className="font-mono font-black text-lg text-amber-950">
                  +{formatPrice(total)} Lezzet Puanı
                </p>
              </div>
            </section>

            {/* Quick WhatsApp Support Card */}
            <section className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Bir Sorunuz mu Var?</h4>
                  <p className="text-xs text-slate-500">
                    Siparişinizle ilgili WhatsApp hattımızdan anında destek alabilirsiniz.
                  </p>
                </div>
              </div>
              <a
                href={waSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Destek Hattına Yaz
              </a>
            </section>
          </div>
        </div>

        {/* Bottom Primary CTA Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 print:hidden">
          <Link
            href="/hesap"
            className="w-full sm:w-auto px-9 py-4 bg-[#6b1d2f] hover:bg-[#521222] text-white font-bold text-sm sm:text-base rounded-2xl text-center transition-all shadow-lg shadow-[#6b1d2f]/20 flex items-center justify-center gap-2.5 group"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Siparişlerimi Görüntüle</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-9 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm sm:text-base rounded-2xl text-center transition-all flex items-center justify-center gap-2.5 shadow-2xs"
          >
            <Home className="w-5 h-5 text-[#6b1d2f]" />
            <span>Alışverişe Devam Et</span>
          </Link>
        </div>

        {/* Brand Footer Note */}
        <footer className="pt-8 border-t border-slate-200/70 text-center max-w-xl mx-auto">
          <p className="font-serif italic text-slate-500 text-sm">
            &ldquo;İspir&apos;in yüksek yaylalarından sofranıza uzanan bu eşsiz lezzet yolculuğunda bizi tercih ettiğiniz için teşekkür ederiz.&rdquo;
          </p>
          <p className="text-[11px] font-mono font-extrabold text-[#6b1d2f] uppercase tracking-[0.2em] mt-2">
            PEKEFE İSPİR YÖRESEL ÜRÜNLER
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function SepetOnay() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500 font-mono text-sm">
          Sipariş onayınız yükleniyor...
        </div>
      }
    >
      <SepetOnayContent />
    </Suspense>
  );
}
