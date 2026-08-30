"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  History, 
  Tag, 
  Wallet, 
  ShieldCheck, 
  Truck, 
  BadgePercent, 
  CheckCircle2, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  HelpCircle,
  FileText,
  Clock
} from "lucide-react";
import { Toast } from "@/components/ui/Toast";

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

  // B2B Application Form State
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

  const isApprovedDealer = isAuthenticated && (role === "DEALER" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "USER") && isApproved !== false;
  const isPendingDealer = (isAuthenticated && role === "DEALER" && isApproved === false) || appliedSuccess;
  const isStandardCustomerOrGuest = !isAuthenticated || isPendingDealer === false && isApprovedDealer === false;

  // Pre-fill user data if logged in
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      if (session.user.name) setApplyName(session.user.name);
      if (session.user.email) setApplyEmail(session.user.email);
    }
  }, [isAuthenticated, session]);

  // Fetch Live Dealer Profile, Products & Orders
  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveDealer();
      fetchLiveProductsData();
      fetchLiveOrdersData();
    }
  }, [isAuthenticated]);

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

  const getProductPackDetails = (product) => {
    const name = (product.name || "").toLowerCase();
    const cat = (product.category?.name || product.category || "").toLowerCase();
    const rawPrice = Number(product.price || 300);

    // 1. Pestil & Köme (Paket/Kutu)
    if (name.includes("pestil") || name.includes("köme") || name.includes("kome") || cat.includes("pestil")) {
      const multiplier = 10;
      return {
        packSize: "Koli (10 Paket - 500g)",
        multiplier,
        casePrice: Number(product.b2bPrice || rawPrice) * multiplier,
        unitType: "Koli",
      };
    }

    // 2. Kuru Fasulye & Bakliyat (Paket)
    if (name.includes("fasulye") || name.includes("bakliyat") || cat.includes("fasulye") || cat.includes("bakliyat")) {
      const multiplier = 10;
      return {
        packSize: "Koli (10 Paket - 1 Kg)",
        multiplier,
        casePrice: Number(product.b2bPrice || rawPrice) * multiplier,
        unitType: "Koli",
      };
    }

    // 3. Bal & Arı Ürünleri (Kavanoz)
    if (name.includes("bal") || name.includes("polen") || name.includes("propolis") || cat.includes("bal")) {
      const multiplier = 12;
      return {
        packSize: "Koli (12 Kavanoz)",
        multiplier,
        casePrice: Number(product.b2bPrice || rawPrice) * multiplier,
        unitType: "Koli",
      };
    }

    // 4. Pekmez & Şurup (Kavanoz)
    if (name.includes("pekmez") || cat.includes("pekmez")) {
      const multiplier = 12;
      return {
        packSize: "Koli (12 Kavanoz)",
        multiplier,
        casePrice: Number(product.b2bPrice || rawPrice) * multiplier,
        unitType: "Koli",
      };
    }

    // 5. Genel / Özel ambalaj
    const multiplier = 12;
    return {
      packSize: product.unit && product.unit !== "Adet" ? `Koli (10 ${product.unit})` : "Koli (12 Adet)",
      multiplier,
      casePrice: Number(product.b2bPrice || rawPrice) * multiplier,
      unitType: "Koli",
    };
  };

  const fetchLiveProductsData = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        const prods = Array.isArray(data) ? data : data.products || [];
        if (prods.length > 0) {
          const mapped = prods.map((p) => {
            const rawPrice = Number(p.price || 300);
            const pack = getProductPackDetails(p);
            return {
              sku: p.sku || `PKF-B2B-${String(p.id || "100").slice(-4).toUpperCase()}`,
              name: p.name,
              category: (p.category?.name || p.category || "pekmez").toLowerCase(),
              packSize: pack.packSize,
              unitPrice: rawPrice,
              casePrice: pack.casePrice,
              img: p.image || p.images?.[0] || "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
              stock: p.stock ?? 50,
            };
          });
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
    showNotification(`${prod.name} toptan sepete eklendi.`, "success");
  };

  const removeItem = (sku) => {
    setB2bCart((prev) => prev.filter((item) => item.sku !== sku));
  };

  const subtotal = b2bCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleOrderSubmit = async () => {
    if (b2bCart.length === 0) {
      showNotification("Sepetinizde ürün bulunmuyor.", "error");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: b2bCart.map((item) => ({
            id: item.sku,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentMethod: "openAccount",
          cargoCompany: "Yurtiçi Kargo",
          notes: "B2B Kurumsal Toptan Sipariş",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showNotification("Toptan B2B siparişiniz başarıyla oluşturuldu!", "success");
        setB2bCart([]);
        fetchLiveOrdersData();
        router.push(`/sepet/onay?orderId=${data.orderId}`);
      } else {
        showNotification("Sipariş talebiniz alındı. Temsilciniz sizinle iletişime geçecektir.", "info");
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

  const filteredProducts = productsState.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category.includes(categoryFilter);
    return matchesSearch && matchesCat;
  });

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatDate = (raw) => {
    if (!raw) return new Date().toLocaleDateString("tr-TR");
    try {
      const p = new Date(raw);
      if (!isNaN(p.getTime())) return p.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch {}
    return raw;
  };

  // 1. Loading Screen
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f6] dark:bg-[#0e0f11]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#6b1d2f] text-white shadow-xl flex items-center justify-center">
            <Store className="w-8 h-8 text-amber-300 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-[#6b1d2f] dark:text-amber-400">Pekefe B2B Portalı Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // 2. GUEST VIEW (Giriş Yapmamış veya Standart Müşteri Başvuru Ekranı)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen w-full bg-[#fbf9f6] dark:bg-[#0e0f11] py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Banner */}
          <div className="bg-gradient-to-r from-[#6b1d2f] via-[#4a1220] to-[#1a0a10] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 rounded-full px-3.5 py-1 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4">
                Pekefe Kurumsal Ailesi
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-black leading-tight mb-4">
                B2B Kurumsal Bayilik Sistemine Katılın
              </h1>
              <p className="text-white/80 text-sm md:text-base leading-relaxed">
                Şarküteri, restoran, otel ve gurme market işletmelerinize özel toptan fiyatlar, koli bazlı iskonto oranları ve vadeli cari hesap avantajları ile Pekefe lezzetlerini sunun.
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Toptan Koli Fiyatları</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Restoran ve marketinize özel toptan koli iskontoları</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Öncelikli Kargo</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Soğuk zincir ve korumalı kargo ile hızlı sevkiyat</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Vadeli Cari Ödeme</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Onaylı bayilerimize özel vadeli ödeme ve limit avantajı</p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-2xl mx-auto">
            <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#6b1d2f] dark:text-rose-400">B2B Bayilik Başvuru Formu</h2>
                <p className="text-xs text-slate-500 mt-1">Formu doldurduktan sonra temsilcilerimiz başvurunuzu değerlendirerek sizinle iletişime geçecektir.</p>
              </div>
              <Link href="/giris?callbackUrl=%2Fb2b" className="text-xs text-[#6b1d2f] font-bold hover:underline flex items-center gap-1 shrink-0">
                <span>Zaten Hesabım Var</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <form onSubmit={handleB2bApplySubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Yetkili Ad Soyad *</label>
                <input
                  type="text" required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                  placeholder="Ahmet Yılmaz"
                  value={applyName}
                  onChange={(e) => setApplyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">E-posta Adresi *</label>
                  <input
                    type="email" required
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                    placeholder="kurumsal@firma.com"
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Giriş Şifresi *</label>
                  <input
                    type="password" required
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                    placeholder="••••••••"
                    value={applyPassword}
                    onChange={(e) => setApplyPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Firma Adı / Ticari Ünvan *</label>
                <input
                  type="text" required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                  placeholder="Örn: Güneş Gıda Dağıtım Ltd. Şti."
                  value={applyCompany}
                  onChange={(e) => setApplyCompany(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Vergi No / T.C. No</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                    placeholder="1234567890"
                    value={applyTaxId}
                    onChange={(e) => setApplyTaxId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Kurumsal Telefon *</label>
                  <input
                    type="tel" required
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                    placeholder="05XX XXX XX XX"
                    value={applyPhone}
                    onChange={(e) => setApplyPhone(e.target.value)}
                  />
                </div>
              </div>

              {applyError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {applyError}
                </div>
              )}

              <button
                type="submit"
                disabled={applyLoading}
                className="w-full py-4 bg-[#6b1d2f] hover:bg-[#831843] text-white font-bold rounded-2xl shadow-lg shadow-[#6b1d2f]/20 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {applyLoading ? "Başvuru Gönderiliyor..." : "Bayilik Başvurusu Yap"}
              </button>
            </form>
          </div>

        </div>
      </main>
    );
  }

  // 3. APPROVED DEALER VIEW (Tam B2B Portal Sayfası)
  return (
    <div className="flex-grow w-full min-h-screen bg-[#fbf9f6] dark:bg-[#0e0f11] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      
      {/* SideNavBar */}
      <nav className="w-full md:w-72 bg-white dark:bg-slate-900 p-5 border-r border-slate-200/80 dark:border-slate-800 flex flex-col md:sticky md:top-20 md:h-[calc(100vh-80px)] z-30 shadow-xs">
        <div className="mb-6 px-2 flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-[#6b1d2f] text-white flex items-center justify-center shadow-lg shadow-[#6b1d2f]/20 mb-3">
            <Store className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="font-serif text-lg text-[#6b1d2f] dark:text-rose-400 font-bold text-center">Pekefe B2B</h2>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 text-center font-bold">
            Kurumsal Bayi Portalı
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab("catalog");
            document.getElementById("toptan-baslik")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full mb-6 py-3 px-4 bg-[#6b1d2f] hover:bg-[#831843] text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Sipariş Oluştur</span>
        </button>

        <div className="flex-1 space-y-1.5">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer text-sm font-bold ${
              activeTab === "catalog"
                ? "bg-[#6b1d2f] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Ürün Kataloğu</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer text-sm font-bold ${
              activeTab === "orders"
                ? "bg-[#6b1d2f] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Geçmiş Siparişler</span>
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer text-sm font-bold ${
              activeTab === "pricing"
                ? "bg-[#6b1d2f] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Özel İskontolar</span>
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer text-sm font-bold ${
              activeTab === "wallet"
                ? "bg-[#6b1d2f] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Cari Ekstre & Bakiye</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Cari Ünvan</div>
            <div className="font-bold text-xs text-[#6b1d2f] dark:text-rose-400 truncate mt-0.5">
              {dealerAccount?.name || session?.user?.name || "Muhammed AKÇELİK"}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Onaylı Kurumsal Bayi
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 space-y-8">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#6b1d2f] via-[#7d2036] to-[#4a1220] p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3">
              Pekefe B2B Kurumsal Portal
            </span>
            <h1 id="toptan-baslik" className="font-serif text-2xl md:text-3xl font-black mb-2">
              Hoş Geldiniz, {dealerAccount?.name || session?.user?.name || "Değerli İş Ortağımız"}
            </h1>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed">
              Toptan koli bazlı ürün kataloglarını inceleyin, özel bayi skontolarından faydalanın ve doğrudan cari hesabınıza sipariş oluşturun.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        {activeTab === "catalog" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Catalog */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    placeholder="SKU veya Ürün Adı ile Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-[#6b1d2f]"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "pekmez", "bal", "kurufasulye"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? "bg-[#6b1d2f] text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
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
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-1 relative shrink-0 border border-slate-100 overflow-hidden">
                        <Image src={prod.img} alt={prod.name} fill className="object-contain" sizes="80px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 tracking-wider block">{prod.sku}</span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mt-0.5">{prod.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{prod.packSize}</p>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-lg font-mono font-black text-[#6b1d2f] dark:text-rose-400">₺{formatCurrency(prod.casePrice)}</span>
                          <span className="text-[10px] font-bold text-slate-400">/ Koli</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Stokta ({prod.stock} Koli)
                      </span>
                      <button
                        onClick={() => addProductToCart(prod)}
                        className="px-4 py-2 bg-[#6b1d2f] hover:bg-[#831843] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Sepete Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B Cart Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-24">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-[#6b1d2f] dark:text-rose-400 font-bold text-base">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Toptan Sipariş Sepeti</span>
                  </div>
                  <span className="bg-[#6b1d2f]/10 text-[#6b1d2f] dark:text-rose-300 text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                    {b2bCart.length} Kalem
                  </span>
                </div>

                {b2bCart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs">Toptan sepetiniz boş.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
                    {b2bCart.map((item) => (
                      <div key={item.sku} className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
                          <div className="text-xs font-mono font-black text-[#6b1d2f] dark:text-rose-400 mt-1">₺{formatCurrency(item.price * item.quantity)}</div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                          <button onClick={() => updateQty(item.sku, -1)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 text-xs font-bold cursor-pointer"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-mono font-bold px-1">{item.quantity}</span>
                          <button onClick={() => updateQty(item.sku, 1)} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 text-xs font-bold cursor-pointer"><Plus className="w-3 h-3" /></button>
                        </div>

                        <button onClick={() => removeItem(item.sku)} className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {b2bCart.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-baseline text-sm font-bold text-slate-900 dark:text-white">
                      <span>Toplam Toptan Tutar</span>
                      <span className="text-xl font-mono font-black text-[#6b1d2f] dark:text-rose-400">₺{formatCurrency(subtotal)}</span>
                    </div>

                    <button
                      onClick={handleOrderSubmit}
                      disabled={submittingOrder}
                      className="w-full py-3.5 bg-[#6b1d2f] hover:bg-[#831843] text-white font-bold rounded-2xl shadow-md text-sm cursor-pointer transition-all"
                    >
                      {submittingOrder ? "Sipariş İletiliyor..." : "Siparişi Onayla ve Gönder"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
            <h2 className="text-xl font-serif font-bold text-[#6b1d2f] dark:text-rose-400">Geçmiş B2B Siparişleriniz</h2>
            {pastOrdersState.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Henüz kayıtlı bir B2B siparişiniz bulunmamaktadır.</p>
            ) : (
              <div className="space-y-3">
                {pastOrdersState.map((ord) => (
                  <div key={ord.id} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-black text-sm text-slate-900 dark:text-white">#{ord.id}</div>
                      <div className="text-xs text-slate-500 mt-1">{formatDate(ord.date || ord.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-base text-[#6b1d2f] dark:text-rose-400">₺{formatCurrency(ord.total ?? ord.totalAmount ?? ord.amount)}</div>
                      <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-full font-bold mt-1">
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
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5">
            <h2 className="text-xl font-serif font-bold text-[#6b1d2f] dark:text-rose-400">Tanımlı Özel İskontolarınız</h2>
            <p className="text-xs text-slate-500">Cari hesabınıza özel tanımlanmış koli bazlı iskonto ve fiyat grubu oranları.</p>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700 space-y-3 text-sm">
              <div className="flex justify-between font-semibold"><span>Fiyat Grubu:</span><span className="text-[#6b1d2f] font-bold">Gold Kurumsal Bayi</span></div>
              <div className="flex justify-between font-semibold"><span>Standart İskonto:</span><span className="text-emerald-700 font-bold">%15 Bayi İskontosu</span></div>
              <div className="flex justify-between font-semibold"><span>Koli İskontosu:</span><span className="text-emerald-700 font-bold">5+ Koli Alımda Ekstra %5</span></div>
            </div>
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
            <h2 className="text-xl font-serif font-bold text-[#6b1d2f] dark:text-rose-400">Cari Bakiye & Ekstre Bilgileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Hesap Bakiyesi</div>
                <div className="text-3xl font-mono font-black text-[#6b1d2f] dark:text-rose-400 mt-2">₺{formatCurrency(dealerAccount?.balance || 0)}</div>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kullanılabilir Kredi Limiti</div>
                <div className="text-3xl font-mono font-black text-emerald-700 dark:text-emerald-400 mt-2">₺{formatCurrency(dealerAccount?.creditLimit || 150000)}</div>
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

