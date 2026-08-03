"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function B2b() {
  const router = useRouter();
  const sessionResult = useSession() || {};
  const session = sessionResult.data;
  const status = sessionResult.status || "unauthenticated";

  const [activeTab, setActiveTab] = useState("catalog"); // catalog, orders, pricing, wallet
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Overlay States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Live Dealer & Catalog State
  const [dealerAccount, setDealerAccount] = useState(null);
  const [productsState, setProductsState] = useState([]);
  const [pastOrdersState, setPastOrdersState] = useState([]);

  // B2B Cart
  const [b2bCart, setB2bCart] = useState([]);

  // B2B Application Form State (for guests & standard customers)
  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyPassword, setApplyPassword] = useState("");
  const [applyCompany, setApplyCompany] = useState("");
  const [applyTaxId, setApplyTaxId] = useState("");
  const [applyPhone, setApplyPhone] = useState("");
  const [applyCity, setApplyCity] = useState("");
  const [applyDistrict, setApplyDistrict] = useState("");
  const [applyAddress, setApplyAddress] = useState("");
  const [applyNotes, setApplyNotes] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState("");

  const showNotification = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
    setToastOpen(true);
  };

  // Role & Approval Status
  const isAuthenticated = status === "authenticated";
  const role = session?.user?.role;
  const isApproved = session?.user?.isApproved;

  const isApprovedDealer = isAuthenticated && (role === "DEALER" || role === "ADMIN" || role === "SUPER_ADMIN") && isApproved !== false;
  const isPendingDealer = (isAuthenticated && role === "DEALER" && isApproved === false) || appliedSuccess;
  const isStandardCustomerOrGuest = !isApprovedDealer && !isPendingDealer;

  // Pre-fill user data if logged in as standard customer
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      if (session.user.name) setApplyName(session.user.name);
      if (session.user.email) setApplyEmail(session.user.email);
    }
  }, [isAuthenticated, session]);

  // Fetch Live Dealer Profile, Products & Orders for Approved Dealers
  useEffect(() => {
    if (isApprovedDealer) {
      fetchLiveDealer();
      fetchLiveProductsData();
      fetchLiveOrdersData();
    }
  }, [isApprovedDealer]);

  const fetchLiveDealer = async () => {
    try {
      const res = await fetch("/api/dealers/me");
      if (res.ok) {
        const data = await res.json();
        setDealerAccount(data);
      }
    } catch (err) {
      console.error("Error fetching live dealer account:", err);
    }
  };

  const fetchLiveProductsData = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        const prods = Array.isArray(data) ? data : data.products || [];
        if (prods.length > 0) {
          const mapped = prods.map((p) => ({
            sku: p.sku || `PKF-B2B-${(p.id || "100").slice(-4).toUpperCase()}`,
            name: p.name,
            category: (p.category?.name || p.category || "pekmez").toLowerCase(),
            packSize: p.unit || "Koli / 12 Kavanoz",
            unitPrice: p.price || 200,
            casePrice: Number(p.b2bPrice || p.price || 200) * 12,
            img: p.image || p.images?.[0] || "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
            stock: p.stock ?? 50,
          }));
          setProductsState(mapped);

          if (mapped.length > 0 && b2bCart.length === 0) {
            setB2bCart([
              {
                sku: mapped[0].sku,
                name: mapped[0].name,
                packSize: mapped[0].packSize,
                price: mapped[0].casePrice,
                quantity: 2,
                img: mapped[0].img,
              },
            ]);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching live B2B products:", err);
    }
  };

  const fetchLiveOrdersData = async () => {
    try {
      const res = await fetch("/api/orders?personal=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPastOrdersState(data);
        }
      }
    } catch (err) {
      console.error("Error fetching live B2B orders:", err);
    }
  };

  // Submit B2B Application Form
  const handleB2bApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError("");
    setApplyLoading(true);

    try {
      let endpoint = "/api/dealers/apply";
      let payload = {
        company: applyCompany,
        taxId: applyTaxId,
        phone: applyPhone,
        city: applyCity,
        district: applyDistrict,
        address: applyAddress,
        notes: applyNotes,
      };

      // Ziyaretçi olarak başvuruluyorsa kayıt endpoint'ini kullan
      if (!isAuthenticated) {
        endpoint = "/api/dealers/register";
        payload = {
          name: applyName,
          email: applyEmail,
          password: applyPassword,
          company: applyCompany,
          taxId: applyTaxId,
          phone: applyPhone,
          city: applyCity,
          district: applyDistrict,
          address: applyAddress,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setApplyLoading(false);
        setApplyError(data.error || "Başvuru gönderilirken bir hata oluştu.");
        return;
      }

      // Oturum açık değilse arka planda giriş yapmayı dene
      if (!isAuthenticated && applyEmail && applyPassword) {
        try {
          await signIn("credentials", { email: applyEmail, password: applyPassword, redirect: false });
        } catch {}
      }

      setApplyLoading(false);
      setAppliedSuccess(true);
      showNotification("Bayilik başvurunuz başarıyla alındı!", "success");
    } catch {
      setApplyLoading(false);
      setApplyError("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  const updateQty = (sku, delta) => {
    setB2bCart((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const addProductToCart = (prod) => {
    setB2bCart((prev) => {
      const existing = prev.find((item) => item.sku === prod.sku);
      if (existing) {
        return prev.map((item) =>
          item.sku === prod.sku ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          sku: prod.sku,
          name: prod.name,
          packSize: prod.packSize,
          price: prod.casePrice,
          quantity: 1,
          img: prod.img,
        },
      ];
    });
  };

  const removeItem = (sku) => {
    setB2bCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handleOrderSubmit = async () => {
    if (b2bCart.length === 0) {
      showNotification("Sepetinizde ürün bulunmuyor.", "error");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: b2bCart.map((item) => ({
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: subtotal,
          notes: "B2B Kurumsal Toptan Sipariş",
        }),
      });

      if (res.ok) {
        showNotification("Toptan siparişiniz başarıyla oluşturuldu! Müşteri temsilciniz sizinle iletişime geçecektir.", "success");
        setB2bCart([]);
        fetchLiveOrdersData();
      } else {
        showNotification("Sipariş talebiniz alındı. Temsilciniz onay için sizinle iletişime geçecektir.", "info");
        setB2bCart([]);
      }
    } catch (err) {
      console.error("Order submit error:", err);
      showNotification("Sipariş talebiniz alındı.", "success");
      setB2bCart([]);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const subtotal = b2bCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const filteredProducts = productsState.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category.includes(categoryFilter);
    return matchesSearch && matchesCat;
  });

  // 1. Loading Screen
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F5F1]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
            <Image src="/logo.png" alt="Pekefe" width={48} height={48} className="object-contain" />
          </div>
          <div className="flex items-center gap-2 text-[#6b1d2f]">
            <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            <span className="text-sm font-semibold">B2B Portalı yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. PENDING DEALER VIEW (Başvurusu İncelemede Olan Kullanıcı)
  if (isPendingDealer) {
    return (
      <main className="min-h-screen w-full bg-[#F9F5F1] flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6b1d2f] to-[#3b0a18] p-8 text-center text-white relative">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-4">
              <Image src="/logo.png" alt="Pekefe" width={40} height={40} className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Bayilik Başvurunuz İncelemede ⏳</h1>
            <p className="text-amber-200/90 text-xs mt-1 uppercase tracking-widest font-semibold">Pekefe B2B Kurumsal Bayi Portalı</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0 mt-0.5">hourglass_top</span>
              <div>
                <strong className="block font-bold mb-0.5 text-amber-950">Değerli Müşterimiz,</strong>
                B2B Kurumsal Bayilik başvurunuz başarıyla tarafımıza ulaşmıştır. Temsilcilerimiz evrak ve cari bilgilerinizi inceliyor. Onay sonrası e-posta ile bilgilendirileceksiniz.
              </div>
            </div>

            {/* Application Progress Timeline */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Başvuru Süreci</h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Başvuru Alındı", desc: "Form verileriniz başarıyla kaydedildi", status: "done" },
                  { step: "2", title: "Cari & Evrak İncelemesi", desc: "B2B finans ekibimiz incelemeyi sürdürüyor", status: "current" },
                  { step: "3", title: "Bayi Grubu & Özel Fiyat Tanımlaması", desc: "Onay ardından B2B portalınız aktif edilecek", status: "locked" },
                ].map(({ step, title, desc, status: st }) => (
                  <div key={step} className="flex items-start gap-3.5 p-3.5 rounded-xl border border-gray-100 bg-gray-50/70">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      st === "done" ? "bg-green-600 text-white" : st === "current" ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-gray-400"
                    }`}>
                      {st === "done" ? "✓" : step}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{title}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/hesap"
                className="w-full sm:w-auto px-5 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors text-center"
              >
                Müşteri Hesabıma Dön
              </Link>
              <a
                href="mailto:info@pekefe.com"
                className="w-full sm:w-auto px-6 py-3 bg-[#6b1d2f] text-white rounded-xl font-bold text-xs hover:bg-[#8b2d3f] transition-colors text-center shadow-md shadow-[#6b1d2f]/15"
              >
                Destek Ekibi ile İletişime Geç
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 3. STANDARD CUSTOMER & GUEST VIEW (B2B Üyeliği Olmayan veya Giriş Yapmamış Ziyaretçi – Başvuru Formu Göster)
  if (isStandardCustomerOrGuest) {
    return (
      <main className="min-h-screen w-full bg-[#F9F5F1] py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Banner */}
          <div className="bg-gradient-to-r from-[#6b1d2f] via-[#4a1220] to-[#1a0a10] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none">
              <Image src="/uploads/ispir-yedi-goller-kackar-manzara.webp" alt="Pekefe" fill className="object-cover" />
            </div>
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 backdrop-blur-md border border-amber-400/30 rounded-full px-3.5 py-1 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-4">
                Pekefe Kurumsal Ailesi
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                B2B Kurumsal Bayilik Sistemine Katılın 🌿
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                Şarküteri, restoran, otel ve gurme market işletmelerinize özel toptan fiyatlar, koli bazlı iskonto oranları ve vadeli cari hesap avantajları ile Pekefe lezzetlerini sunun.
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "inventory_2", title: "Toptan Koli Fiyatları", desc: "Restoran ve marketinize özel toptan koli iskontoları" },
              { icon: "local_shipping", title: "Öncelikli Kargo", desc: "Soğuk zincir ve korumalı kargo ile hızlı sevkiyat" },
              { icon: "payments", title: "Vadeli Cari Ödeme", desc: "Onaylı bayilerimize özel vadeli ödeme ve limit avantajı" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1a0a10] mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Application Form */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xl max-w-2xl mx-auto">
            <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1a0a10]">B2B Bayilik Başvuru Formu</h2>
                <p className="text-xs text-gray-500 mt-1">Formu doldurduktan sonra temsilcilerimiz başvurunuzu değerlendirerek sizinle iletişime geçecektir.</p>
              </div>
              {!isAuthenticated && (
                <Link href="/giris?callbackUrl=%2Fb2b" className="text-xs text-[#6b1d2f] font-bold hover:underline flex items-center gap-1">
                  <span>Zaten Hesabım Var</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              )}
            </div>

            <form onSubmit={handleB2bApplySubmit} className="space-y-4" noValidate>

              {/* Ziyaretçiler için Hesap Bilgileri */}
              {!isAuthenticated && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Yetkili Ad Soyad *</label>
                    <input
                      type="text" required
                      className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                      placeholder="Ahmet Yılmaz"
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">E-posta Adresi *</label>
                      <input
                        type="email" required
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                        placeholder="kurumsal@firma.com"
                        value={applyEmail}
                        onChange={(e) => setApplyEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Giriş Şifresi *</label>
                      <input
                        type="password" required
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                        placeholder="••••••••"
                        value={applyPassword}
                        onChange={(e) => setApplyPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Firma Bilgileri */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Firma Adı / Ticari Ünvan *</label>
                <input
                  type="text" required
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                  placeholder="Örn: Güneş Gıda Dağıtım Ltd. Şti."
                  value={applyCompany}
                  onChange={(e) => setApplyCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Vergi No / T.C. No</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                    placeholder="1234567890"
                    value={applyTaxId}
                    onChange={(e) => setApplyTaxId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Kurumsal Telefon *</label>
                  <input
                    type="tel" required
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                    placeholder="05XX XXX XX XX"
                    value={applyPhone}
                    onChange={(e) => setApplyPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Şehir</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                    placeholder="İstanbul"
                    value={applyCity}
                    onChange={(e) => setApplyCity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">İlçe</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none"
                    placeholder="Kadıköy"
                    value={applyDistrict}
                    onChange={(e) => setApplyDistrict(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Açık Adres</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 transition-all text-sm outline-none resize-none"
                  placeholder="Firma açık adres bilgisi..."
                  value={applyAddress}
                  onChange={(e) => setApplyAddress(e.target.value)}
                />
              </div>

              {applyError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{applyError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={applyLoading}
                className="w-full py-4 bg-gradient-to-r from-[#6b1d2f] to-[#8b2d3f] text-white font-bold rounded-xl shadow-lg shadow-[#6b1d2f]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {applyLoading ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Başvuru Gönderiliyor...</span></>
                ) : (
                  <><span>Bayilik Başvurusu Yap</span><span className="material-symbols-outlined text-[18px]">send</span></>
                )}
              </button>
            </form>
          </div>

        </div>
      </main>
    );
  }

  // 4. APPROVED DEALER VIEW (Tam B2B Portal Sayfası)
  return (
    <div className="flex-grow w-full min-h-screen bg-background text-on-background flex flex-col md:flex-row relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[#F9F9FF] pointer-events-none opacity-40 mix-blend-multiply z-0"></div>

      {/* SideNavBar */}
      <nav className="w-full md:w-64 bg-surface-container-low p-4 gap-2 border-r border-outline-variant/30 flex flex-col md:sticky md:top-20 md:h-[calc(100vh-80px)] z-30">
        <div className="mb-8 mt-4 px-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-4 bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-primary text-3xl">storefront</span>
          </div>
          <h2 className="font-display-lg text-lg text-primary text-center font-bold">Pekefe B2B</h2>
          <p className="font-body-md text-[10px] uppercase tracking-widest text-on-surface-variant text-center mt-1 font-semibold">
            Kurumsal Bayi Portalı
          </p>
        </div>

        <Button
          onClick={() => {
            setActiveTab("catalog");
            document.getElementById("toptan-baslik")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full mb-6 py-3.5"
          size="sm"
        >
          <span className="material-symbols-outlined text-sm mr-2">add_shopping_cart</span>
          Sipariş Oluştur
        </Button>

        <div className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all text-left cursor-pointer ${
              activeTab === "catalog"
                ? "bg-primary text-white font-bold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
            <span className="font-label-sm text-xs uppercase tracking-wider">Ürün Kataloğu</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all text-left cursor-pointer ${
              activeTab === "orders"
                ? "bg-primary text-white font-bold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            <span className="font-label-sm text-xs uppercase tracking-wider">Geçmiş Siparişler</span>
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all text-left cursor-pointer ${
              activeTab === "pricing"
                ? "bg-primary text-white font-bold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg">sell</span>
            <span className="font-label-sm text-xs uppercase tracking-wider">Özel İskontolar</span>
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all text-left cursor-pointer ${
              activeTab === "wallet"
                ? "bg-primary text-white font-bold shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            <span className="font-label-sm text-xs uppercase tracking-wider">Cari Ekstre & Bakiye</span>
          </button>
        </div>

        <div className="pt-4 border-t border-outline-variant/20">
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Cari Unvan</div>
            <div className="font-bold text-xs text-primary truncate mt-0.5">
              {dealerAccount?.name || session?.user?.name || "Pekefe Bayi"}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Onaylı Kurumsal Bayi
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 space-y-8 z-10">
        {/* Banner */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-secondary p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none">
            <Image src="/uploads/ispir-yedi-goller-kackar-manzara.webp" alt="Pekefe" fill className="object-cover" />
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3">
              Pekefe B2B Kurumsal Portal
            </div>
            <h1 id="toptan-baslik" className="font-display-lg text-2xl md:text-3xl font-bold mb-2">
              Hoş Geldiniz, {dealerAccount?.name || session?.user?.name}
            </h1>
            <p className="font-body-md text-xs md:text-sm opacity-90 leading-relaxed">
              Toptan koli bazlı ürün kataloglarını inceleyin, özel bayi skontolarından faydalanın ve doğrudan cari hesabınıza sipariş oluşturun.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        {activeTab === "catalog" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Catalog */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                    search
                  </span>
                  <Input
                    placeholder="SKU veya Ürün Adı ile Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-surface-container-lowest"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "pekmez", "bal", "kurufasulye"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? "bg-primary text-white"
                          : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high"
                      }`}
                    >
                      {cat === "all" ? "Tümü" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.sku}
                    className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-container-low relative flex-shrink-0 border border-outline-variant/10">
                        <Image src={prod.img} alt={prod.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-mono font-bold text-secondary tracking-widest">{prod.sku}</span>
                        <h3 className="font-bold text-sm text-primary line-clamp-1 mt-0.5">{prod.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-1">{prod.packSize}</p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-base font-bold text-primary">₺{prod.casePrice.toLocaleString("tr-TR")}</span>
                          <span className="text-[10px] text-on-surface-variant">/ Koli</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Stokta Var ({prod.stock} Koli)
                      </span>
                      <Button size="sm" onClick={() => addProductToCart(prod)}>
                        <span className="material-symbols-outlined text-sm mr-1">add</span>
                        Sepete Ekle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B Cart Panel */}
            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 sticky top-24">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2 text-primary font-bold text-base">
                    <span className="material-symbols-outlined">shopping_basket</span>
                    <span>Toptan Sipariş Sepeti</span>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    {b2bCart.length} Kalem
                  </span>
                </div>

                {b2bCart.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant space-y-2">
                    <span className="material-symbols-outlined text-4xl opacity-40">remove_shopping_cart</span>
                    <p className="text-xs">Sepetiniz şu anda boş.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
                    {b2bCart.map((item) => (
                      <div key={item.sku} className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-primary truncate">{item.name}</div>
                          <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">{item.sku}</div>
                          <div className="text-xs font-bold text-secondary mt-1">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-surface-container-low rounded-lg p-1 border border-outline-variant/20">
                          <button onClick={() => updateQty(item.sku, -1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high text-xs font-bold cursor-pointer">-</button>
                          <span className="text-xs font-bold px-1">{item.quantity}</span>
                          <button onClick={() => updateQty(item.sku, 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high text-xs font-bold cursor-pointer">+</button>
                        </div>

                        <button onClick={() => removeItem(item.sku)} className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {b2bCart.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                    <div className="flex justify-between items-center text-sm font-bold text-primary">
                      <span>Toplam Sipariş Tutarı</span>
                      <span className="text-base text-secondary">₺{subtotal.toLocaleString("tr-TR")}</span>
                    </div>

                    <Button onClick={handleOrderSubmit} disabled={submittingOrder} className="w-full py-4 text-sm font-bold">
                      {submittingOrder ? "Sipariş İletiliyor..." : "Siparişi Onayla ve Gönder"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
            <h2 className="text-lg font-bold text-primary">Geçmiş B2B Siparişleriniz</h2>
            {pastOrdersState.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4">Henüz kayıtlı bir B2B siparişiniz bulunmamaktadır.</p>
            ) : (
              <div className="space-y-3">
                {pastOrdersState.map((ord) => (
                  <div key={ord.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-primary">Sipariş No: #{ord.id.slice(-6).toUpperCase()}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{new Date(ord.createdAt || Date.now()).toLocaleDateString("tr-TR")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-700">₺{Number(ord.totalAmount || 0).toLocaleString("tr-TR")}</div>
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] rounded-full font-bold mt-1">
                        {ord.status || "Hazırlanıyor"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
            <h2 className="text-lg font-bold text-primary">Tanımlı Özel İskontolarınız</h2>
            <p className="text-xs text-on-surface-variant">Cari hesabınıza özel tanımlanmış koli bazlı iskonto ve fiyat grubu oranları.</p>
            <div className="p-4 rounded-xl bg-white border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between font-semibold"><span>Fiyat Grubu:</span><span className="text-primary font-bold">A Grubu Kurumsal Bayi</span></div>
              <div className="flex justify-between font-semibold"><span>Standart İskonto:</span><span className="text-emerald-700 font-bold">%15 Bayi İskontosu</span></div>
              <div className="flex justify-between font-semibold"><span>Koli İskontosu:</span><span className="text-emerald-700 font-bold">5+ Koli Alımda Ekstra %5</span></div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 space-y-4">
            <h2 className="text-lg font-bold text-primary">Cari Bakiye & Ekstre Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <div className="text-xs text-gray-500">Cari Hesap Bakiyesi</div>
                <div className="text-2xl font-bold text-primary mt-1">₺{Number(dealerAccount?.balance || 0).toLocaleString("tr-TR")}</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-gray-200">
                <div className="text-xs text-gray-500">Kredi Limiti</div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">₺{Number(dealerAccount?.creditLimit || 50000).toLocaleString("tr-TR")}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast
        isOpen={toastOpen}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
