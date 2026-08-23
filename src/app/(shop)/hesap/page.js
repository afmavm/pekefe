"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/Toast";

export default function Hesap() {
  const router = useRouter();
  const sessionResult = useSession() || {};
  const session = sessionResult.data;
  const status = sessionResult.status || "unauthenticated";
  const [activeTab, setActiveTab] = useState("orders"); // orders, addresses, info, favorites
  const [showPassword, setShowPassword] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Live State
  const [infoForm, setInfoForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const [savingInfo, setSavingInfo] = useState(false);
  const [savedInfoSuccess, setSavedInfoSuccess] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savedPassSuccess, setSavedPassSuccess] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "info" });

  const showNotification = (message, type = "info") => {
    setToast({ isOpen: true, message, type });
  };

  const getFavoritesKey = () => {
    return session?.user?.email ? `pekefe_favorites_${session.user.email}` : "pekefe_favorites";
  };

  const loadFavorites = () => {
    if (typeof window !== "undefined") {
      const favoritesKey = getFavoritesKey();
      // Try modern key first, fallback to legacy keys if exists
      let raw = localStorage.getItem(favoritesKey);
      if (!raw && session?.user?.email) {
        raw = localStorage.getItem(`favorites_${session.user.email}`) || localStorage.getItem("favorites");
      }
      const favs = JSON.parse(raw || "[]");
      setFavoritesList(favs);
    }
  };

  const removeFavoriteItem = (id) => {
    const favoritesKey = getFavoritesKey();
    let favs = JSON.parse(localStorage.getItem(favoritesKey) || "[]");
    favs = favs.filter(item => String(item.id) !== String(id) && String(item.sku) !== String(id));
    localStorage.setItem(favoritesKey, JSON.stringify(favs));
    setFavoritesList(favs);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pekefe_favorites_changed"));
    }
    showNotification("Ürün favorilerinizden çıkarıldı.", "info");
  };

  // Auth Guard – redirect unauthenticated users to /giris
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/giris?callbackUrl=%2Fhesap");
    }
  }, [status, router]);

  // Fetch Live Data on Load
  useEffect(() => {
    loadFavorites();
    if (status === "authenticated") {
      fetchUserData();
      fetchOrdersData();
      fetchAddressesData();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pekefe_favorites_changed", loadFavorites);
      return () => window.removeEventListener("pekefe_favorites_changed", loadFavorites);
    }
  }, [status, session]);

  const fetchUserData = async () => {
    try {
      setLoadingUser(true);
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const fullName = data.user.name || session?.user?.name || "";
          const nameParts = fullName.trim().split(" ");
          setInfoForm({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: data.user.email || session?.user?.email || "",
            phone: data.currentAccount?.phone || "",
          });
          if (data.currentAccount) {
            setLoyaltyPoints(Number(data.currentAccount.loyaltyPoints || 0));
          }
        }
      }
    } catch (err) {
      console.error("Error fetching live user profile:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchOrdersData = async () => {
    try {
      const res = await fetch("/api/orders?personal=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.error("Error fetching live user orders:", err);
    }
  };

  const fetchAddressesData = async () => {
    try {
      const res = await fetch("/api/user/address");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        }
      }
    } catch (err) {
      console.error("Error fetching live user addresses:", err);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${infoForm.firstName} ${infoForm.lastName}`.trim(),
          phone: infoForm.phone,
        }),
      });

      if (res.ok) {
        setSavedInfoSuccess(true);
        showNotification("Kişisel bilgileriniz başarıyla güncellendi.", "success");
        setTimeout(() => setSavedInfoSuccess(false), 3000);
      } else {
        const errData = await res.json();
        showNotification(errData.error || "Bilgiler güncellenirken hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Error updating info:", err);
      showNotification("Bağlantı hatası oluştu.", "error");
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification("Yeni şifreleriniz birbiriyle eşleşmiyor.", "error");
      return;
    }

    setSavingPass(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        setSavedPassSuccess(true);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        showNotification("Şifreniz başarıyla güncellendi.", "success");
        setTimeout(() => setSavedPassSuccess(false), 3000);
      } else {
        const errData = await res.json();
        showNotification(errData.error || "Şifre güncellenirken hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      showNotification("Bağlantı hatası oluştu.", "error");
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = () => {
    showNotification("Güvenli çıkış yapılıyor...", "info");
    signOut({ callbackUrl: "/giris" });
  };

  // Helper for Order Status Display
  const renderOrderStatusBadge = (statusStr) => {
    switch (statusStr) {
      case "COMPLETED":
      case "DELIVERED":
        return (
          <span className="px-4 py-1.5 rounded-full bg-green-100 text-green-800 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Tamamlandı
          </span>
        );
      case "SHIPPED":
        return (
          <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
            Kargoya Verildi
          </span>
        );
      case "PREPARING":
      case "APPROVED":
        return (
          <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
            Hazırlanıyor
          </span>
        );
      default:
        return (
          <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            İşleniyor
          </span>
        );
    }
  };

  const loyaltyTier = loyaltyPoints >= 2000 ? "PEKEFE USTASI" : loyaltyPoints >= 500 ? "PEKEFE GURMESİ" : "PEKEFE DOSTU";

  if (status === "loading") {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Hesap Bilgileri Yükleniyor...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 tracking-wide">Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
      {/* Hero Section / Header */}
      <div className="mb-12">
        <h1 className="font-headline-lg text-[32px] md:text-headline-lg text-on-surface mb-2">Hesabım</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {session?.user ? (
            <>Hoş geldiniz, <strong className="text-primary font-bold">{infoForm.firstName || session.user.name || "Değerli Müşterimiz"}</strong>. Siparişlerinizi ve hesap detaylarınızı buradan yönetebilirsiniz.</>
          ) : (
            <>Siparişlerinizi ve hesap detaylarınızı görüntülemek için lütfen giriş yapınız.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
            <nav className="flex flex-col">
              <button
                onClick={() => setActiveTab("orders")}
                className={`relative flex items-center gap-3 px-6 py-4 font-label-md transition-all text-left cursor-pointer ${
                  activeTab === "orders" ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
              >
                {activeTab === "orders" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "orders" ? "'FILL' 1" : "'FILL' 0" }}>
                  package
                </span>
                <span>Siparişlerim ({orders.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`relative flex items-center gap-3 px-6 py-4 font-label-md transition-all text-left cursor-pointer ${
                  activeTab === "addresses" ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
              >
                {activeTab === "addresses" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <span className="material-symbols-outlined">location_on</span>
                <span>Adreslerim ({addresses.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`relative flex items-center gap-3 px-6 py-4 font-label-md transition-all text-left cursor-pointer ${
                  activeTab === "info" ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
              >
                {activeTab === "info" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "info" ? "'FILL' 1" : "'FILL' 0" }}>
                  person
                </span>
                <span>Hesap Bilgileri</span>
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`relative flex items-center gap-3 px-6 py-4 font-label-md transition-all text-left cursor-pointer ${
                  activeTab === "favorites" ? "bg-surface-container-low text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
                }`}
              >
                {activeTab === "favorites" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <span className="material-symbols-outlined">favorite</span>
                <span>Favorilerim</span>
              </button>
              <hr className="border-outline-variant/20 mx-6 my-2" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-6 py-4 text-error hover:bg-error-container/20 transition-all font-label-md text-left cursor-pointer"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Güvenli Çıkış Yap</span>
              </button>
            </nav>
          </div>

          {/* Loyalty Card / Special Promo */}
          <div className="bg-gradient-to-br from-[#5c1729] to-[#3b0d19] text-white rounded-xl p-6 relative overflow-hidden group shadow-lg border border-amber-400/20">
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[160px] text-amber-300">stars</span>
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="font-label-sm text-xs opacity-80 uppercase tracking-widest text-amber-300 mb-1">{loyaltyTier}</p>
                  <h4 className="font-headline-md text-xl leading-none font-bold">Sadakat Kartı</h4>
                </div>
                <span className="material-symbols-outlined text-3xl text-amber-300">verified</span>
              </div>
              <div className="mb-6">
                <p className="font-label-sm text-xs opacity-70 mb-1">Pekefe Lezzet Puanı</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tracking-tight text-amber-300 font-mono">{Number(loyaltyPoints).toLocaleString("tr-TR")} PTS</p>
                  <span className="text-xs text-amber-200/80 font-bold font-mono">≈ ₺{(Number(loyaltyPoints) * 0.01).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-[10px] text-amber-200/60 mt-0.5">100 PTS = 1 ₺ (%1 Değerinde)</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="font-label-sm text-xs font-semibold">{infoForm.firstName} {infoForm.lastName}</p>
                <span className="material-symbols-outlined opacity-50">contactless</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Tab content area */}
        <section className="lg:col-span-9">
          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-[24px] md:text-headline-md text-on-surface font-bold">Siparişlerim</h2>
              </div>

              {orders.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/30 text-center space-y-4">
                  <span className="material-symbols-outlined text-5xl text-outline-variant">package_2</span>
                  <h3 className="font-bold text-lg text-on-surface">Henüz Geçmiş Siparişiniz Bulunmamaktadır</h3>
                  <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                    İspir yaylalarının geleneksel lezzetlerini keşfetmek için hemen alışverişe başlayabilirsiniz.
                  </p>
                  <Link
                    href="/"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-label-md uppercase tracking-wider hover:opacity-90 transition-all shadow-md mt-2"
                  >
                    Mağazayı İncele
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div className="flex gap-8">
                          <div>
                            <p className="text-on-surface-variant text-[11px] font-label-md uppercase tracking-wider mb-1">Sipariş Tarihi</p>
                            <p className="font-body-md font-semibold">
                              {order.formattedDate || (() => {
                                const raw = order.date || order.createdAt;
                                if (!raw) return "Tarih Belirtilmedi";
                                const d = new Date(raw);
                                if (!isNaN(d.getTime())) {
                                  return d.toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', year: 'numeric' });
                                }
                                return String(raw).split(" ")[0] || String(raw);
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant text-[11px] font-label-md uppercase tracking-wider mb-1">Sipariş No</p>
                            <p className="font-body-md font-semibold">#{order.orderNumber || order.orderNo || (order.id ? order.id.slice(-8).toUpperCase() : "000000")}</p>
                          </div>
                          <div>
                            <p className="text-on-surface-variant text-[11px] font-label-md uppercase tracking-wider mb-1">Toplam</p>
                            <p className="font-body-md font-bold text-primary font-mono">
                              ₺{Number(order.totalAmount ?? order.total ?? order.amount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        {renderOrderStatusBadge(order.status)}
                      </div>

                      <div className="flex flex-wrap gap-4 pt-6 border-t border-outline-variant/20">
                        <Link
                          href={`/sepet/onay?orderId=${order.id}`}
                          className="bg-primary text-white px-6 py-3 rounded-lg font-label-md hover:opacity-95 transition-all shadow-sm active:scale-95 cursor-pointer text-xs uppercase tracking-wider font-bold"
                        >
                          Sipariş Detayı
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-md text-on-surface font-bold">Kaydedilmiş Adreslerim</h2>
                <button
                  onClick={() => showNotification("Adres ekleme formu sipariş teslimat ekranında aktif durumdadır.", "info")}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-label-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider"
                >
                  Yeni Adres Ekle
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-surface-container-lowest p-10 rounded-xl border border-outline-variant/30 text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">location_off</span>
                  <p className="text-sm text-on-surface-variant">Henüz kayıtlı bir adresiniz bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm relative">
                      <h3 className="font-bold text-lg mb-2 text-primary">{addr.title || "Teslimat Adresi"}</h3>
                      <p className="text-on-surface-variant font-body-md mb-2 font-semibold">{addr.recipient || `${infoForm.firstName} ${infoForm.lastName}`}</p>
                      <p className="text-on-surface font-body-md mb-2">{addr.fullAddress}</p>
                      <p className="text-on-surface font-body-md font-bold">{addr.district} / {addr.city}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="space-y-8">
              <div className="mb-4">
                <h2 className="font-headline-md text-on-surface font-bold">Hesap Bilgilerim</h2>
              </div>

              {/* Personal Information Section */}
              <div className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-2xl">badge</span>
                  <h2 className="font-headline-md text-xl font-bold">Kişisel Profil Bilgileri</h2>
                </div>
                <form onSubmit={handleInfoSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      Ad
                    </label>
                    <input
                      name="firstName"
                      value={infoForm.firstName}
                      onChange={(e) => setInfoForm({ ...infoForm, firstName: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                      type="text"
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      Soyad
                    </label>
                    <input
                      name="lastName"
                      value={infoForm.lastName}
                      onChange={(e) => setInfoForm({ ...infoForm, lastName: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                      type="text"
                      autoComplete="family-name"
                      required
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      E-posta Adresi
                    </label>
                    <input
                      name="email"
                      disabled
                      value={infoForm.email}
                      className="w-full bg-slate-100 border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-slate-500 cursor-not-allowed opacity-80"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      Telefon Numarası
                    </label>
                    <input
                      name="phone"
                      value={infoForm.phone}
                      onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                      type="tel"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div className="sm:col-span-2 pt-4 flex justify-end">
                    <button
                      className={`font-label-md text-label-md px-10 py-4 rounded-lg transition-all shadow-md active:scale-95 duration-200 cursor-pointer ${
                        savedInfoSuccess ? "bg-green-700 text-white" : "bg-primary text-white hover:opacity-95"
                      }`}
                      type="submit"
                      disabled={savingInfo}
                    >
                      {savingInfo ? "Güncelleniyor..." : savedInfoSuccess ? "Başarıyla Güncellendi ✓" : "Değişiklikleri Kaydet"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Update Section */}
              <div className="bg-surface-container-lowest p-8 rounded-xl premium-shadow border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
                  <h2 className="font-headline-md text-xl font-bold">Şifre Güncelleme</h2>
                </div>
                <form onSubmit={handlePassSubmit} className="space-y-6">
                  <div className="max-w-md space-y-2 group">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary material-symbols-outlined cursor-pointer"
                      >
                        {showPassword ? "visibility_off" : "visibility"}
                      </button>
                    </div>
                  </div>

                  <div className="max-w-md space-y-2 group">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-wider block transition-colors group-focus-within:text-primary">
                      Yeni Şifre Tekrar
                    </label>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:border-primary transition-all"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      className={`font-label-md text-label-md px-10 py-4 rounded-lg transition-all shadow-md active:scale-95 duration-200 cursor-pointer ${
                        savedPassSuccess ? "bg-green-700 text-white" : "bg-primary text-white hover:opacity-95"
                      }`}
                      type="submit"
                      disabled={savingPass}
                    >
                      {savingPass ? "Güncelleniyor..." : savedPassSuccess ? "Şifre Güncellendi ✓" : "Şifreyi Güncelle"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === "favorites" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline-md text-on-surface font-bold">
                  Favorilerim {favoritesList.length > 0 ? `(${favoritesList.length})` : ""}
                </h2>
              </div>

              {favoritesList.length === 0 ? (
                <div className="bg-surface-container-lowest p-10 rounded-xl border border-outline-variant/30 text-center space-y-4">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">favorite</span>
                  <p className="text-sm text-on-surface-variant">Henüz favorilere eklenmiş bir lezzet bulunmamaktadır.</p>
                  <Link
                    href="/kategoriler"
                    className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-label-md uppercase tracking-wider hover:opacity-90 transition-all shadow-md mt-2 text-xs font-bold"
                  >
                    Koleksiyonları Keşfet
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoritesList.map((fav) => (
                    <div key={fav.id || fav.sku} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative">
                      <button
                        onClick={() => removeFavoriteItem(fav.id || fav.sku)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition cursor-pointer z-10"
                        title="Favorilerden Çıkar"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 p-2">
                          <Image
                            src={fav.img || fav.image || "/premium-pekefe-kavanoz.png"}
                            alt={fav.name}
                            fill
                            className="object-contain p-1 group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-on-surface text-sm truncate">{fav.name}</h3>
                          <p className="text-amber-700 font-bold text-sm font-mono mt-1">{fav.price}</p>
                          {fav.weight && <span className="text-[10px] text-slate-400 font-semibold uppercase">{fav.weight}</span>}
                        </div>
                      </div>
                      <Link
                        href={`/urun/${fav.id || fav.sku}`}
                        className="w-full py-2.5 bg-slate-900 hover:bg-amber-600 text-white font-bold text-xs rounded-xl text-center transition block shadow-sm"
                      >
                        Ürünü İncele
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <Toast message={toast.message} isOpen={toast.isOpen} onClose={() => setToast({ ...toast, isOpen: false })} type={toast.type} />
    </div>
  );
}

