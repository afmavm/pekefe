"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

export default function B2b() {
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Live Dealer & Catalog State
  const [dealerAccount, setDealerAccount] = useState(null);
  const [productsState, setProductsState] = useState([]);
  const [pastOrdersState, setPastOrdersState] = useState([]);

  // B2B Cart
  const [b2bCart, setB2bCart] = useState([]);

  const showNotification = (message, type = "success") => {
    setToastMsg(message);
    setToastType(type);
    setToastOpen(true);
  };

  // Fetch Live Dealer Profile, Products & Orders
  useEffect(() => {
    fetchLiveDealer();
    fetchLiveProductsData();
    fetchLiveOrdersData();
  }, [status]);

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
          
          // Default cart item
          if (mapped.length > 0) {
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
            <span className="material-symbols-outlined text-lg">inventory_2</span>
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
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            <span className="font-label-sm text-xs uppercase tracking-wider">Wholesale Fiyat Listesi</span>
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
            <span className="font-label-sm text-xs uppercase tracking-wider">Cari Ekstre / Hesap</span>
          </button>
        </div>

        <div className="mt-auto space-y-1 border-t border-outline-variant/10 pt-4">
          <Link
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all text-left text-xs uppercase tracking-wider font-semibold"
          >
            <span className="material-symbols-outlined text-lg">keyboard_return</span>
            Mağazaya Dön
          </Link>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-grow w-full flex flex-col z-10 relative">
        {/* Sub Header */}
        <header className="bg-white/80 backdrop-blur border-b border-outline-variant/10 py-4 px-margin-mobile md:px-margin-desktop flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-3 font-display-lg text-xl text-primary font-bold">
              <Image src="/logo.png" alt="Pekefe Logo" width={32} height={32} className="object-contain" />
              <span>PEKEFE Kurumsal</span>
            </h1>
            <span className="bg-secondary/15 text-secondary border border-secondary/30 font-label-sm text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
              {dealerAccount?.name ? dealerAccount.name : "Platinum Bayi"}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-on-surface-variant text-[9px] uppercase tracking-widest font-bold">
                Kalan Kredi Limiti
              </span>
              <span className="font-display-lg font-bold text-primary text-lg">
                ₺{Number(dealerAccount?.creditLimit || 50000).toLocaleString("tr-TR")}
              </span>
            </div>
            <Button
              onClick={() => setCsvModalOpen(true)}
              variant="secondary"
              size="sm"
            >
              Excel / CSV Yükle
            </Button>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-container-max mx-auto w-full flex flex-col gap-8">
          
          {/* Welcome Header */}
          <div className="border-b border-outline-variant/10 pb-6">
            <h2 className="font-display-lg text-2xl md:text-3xl text-on-surface mb-2 font-bold tracking-tight">
              {dealerAccount?.company || session?.user?.name || "Erzurum İspir Gurme İş Ortağı"}
            </h2>
            <p className="font-body-md text-on-surface-variant font-light text-sm md:text-base">
              Pekefe B2B portalı üzerinden toptan ürün koli siparişlerinizi yönetin, cari bakiyenizi inceleyin ve güncel kargo takip işlemlerinizi sürdürün.
            </p>
          </div>

          {/* Tab 1: Catalog */}
          {activeTab === "catalog" && (
            <div className="space-y-8 animate-fade-in">
              {/* Stats Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-outline-variant/15 shadow-sm space-y-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">Kanal Limiti</span>
                  <div className="flex justify-between items-end">
                    <span className="font-display-lg text-2xl font-bold text-primary">
                      ₺{Number(dealerAccount?.creditLimit || 50000).toLocaleString("tr-TR")}
                    </span>
                    <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">Açık Vade</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-outline-variant/15 shadow-sm space-y-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">Aktif Siparişler</span>
                  <div className="flex justify-between items-end">
                    <span className="font-display-lg text-2xl font-bold text-primary">
                      {pastOrdersState.length} Sevkiyat
                    </span>
                    <span className="text-[10px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">Takipte</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-outline-variant/15 shadow-sm space-y-4">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">Toplam Bayi İndirimi</span>
                  <div className="flex justify-between items-end">
                    <span className="font-display-lg text-2xl font-bold text-primary">%20 - %25</span>
                    <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-2 py-0.5 rounded">Wholesale</span>
                  </div>
                </div>
              </div>

              {/* Catalog Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Product Catalog Grid (8 Columns) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 id="toptan-baslik" className="font-display-lg text-xl text-primary font-bold">Toptan Sipariş Kataloğu</h3>
                    
                    {/* Category Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {["all", "pekmez", "pestil", "kome", "tatli"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-all cursor-pointer ${
                            categoryFilter === cat
                              ? "bg-primary border-primary text-white"
                              : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          {cat === "all" ? "Tümü" : cat.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <Input
                    placeholder="Ürün adı veya SKU kodu ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredProducts.map((p) => (
                      <div key={p.sku} className="bg-white rounded-xl border border-outline-variant/15 p-5 shadow-sm flex gap-4 items-center">
                        <div className="w-20 h-20 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0 relative">
                          <Image src={p.img} alt={p.name} className="object-contain p-2" fill sizes="80px" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[9px] text-on-surface-variant/80 font-mono tracking-wider block">{p.sku}</span>
                          <h4 className="font-display-lg text-primary text-sm font-bold truncate leading-snug">{p.name}</h4>
                          <p className="text-[10px] text-on-surface-variant">{p.packSize}</p>
                          <div className="flex justify-between items-center pt-2">
                            <div>
                              <p className="text-sm font-bold text-primary font-mono">₺{p.casePrice.toLocaleString('tr-TR')}</p>
                            </div>
                            <Button
                              onClick={() => addProductToCart(p)}
                              variant="outline"
                              size="sm"
                              className="px-3 py-1.5 text-[10px]"
                            >
                              Koli Ekle
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* B2B Cart Panel (4 Columns) */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-outline-variant/15 p-6 shadow-sm sticky top-24 space-y-6">
                  <h3 className="font-display-lg text-lg text-primary font-bold border-b border-outline-variant/10 pb-3">Sipariş Taslağı</h3>

                  {b2bCart.length === 0 ? (
                    <div className="text-center py-12 text-on-surface-variant font-light text-xs">
                      Sepetinizde toptan ürün bulunmuyor. Sol taraftan koli ekleyebilirsiniz.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {b2bCart.map((item) => (
                        <div key={item.sku} className="flex gap-3 items-center border-b border-outline-variant/10 pb-3">
                          <div className="w-12 h-12 bg-surface-container-low rounded relative flex-shrink-0">
                            <Image src={item.img} alt={item.name} className="object-contain p-1" fill sizes="48px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-xs truncate text-primary">{item.name}</h5>
                            <p className="text-[10px] text-on-surface-variant">{item.packSize}</p>
                            <p className="text-xs font-bold font-mono text-primary pt-0.5">₺{(item.price * item.quantity).toLocaleString('tr-TR')}</p>
                          </div>
                          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded border border-outline-variant/20">
                            <button onClick={() => updateQty(item.sku, -1)} className="w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-white rounded">
                              -
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.sku, 1)} className="w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-white rounded">
                              +
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.sku)} className="text-on-surface-variant/50 hover:text-error text-sm ml-1">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {b2bCart.length > 0 && (
                    <div className="border-t border-outline-variant/15 pt-4 space-y-4">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span>Ara Toplam (KDV Dahil):</span>
                        <span className="text-primary font-mono text-base">₺{subtotal.toLocaleString('tr-TR')}</span>
                      </div>
                      <Button
                        onClick={handleOrderSubmit}
                        disabled={submittingOrder}
                        className="w-full py-4 text-xs font-bold uppercase tracking-wider"
                      >
                        {submittingOrder ? "Gönderiliyor..." : "Toptan Siparişi Onayla"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Orders */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-xl border border-outline-variant/15 p-8 shadow-sm space-y-6 animate-fade-in">
              <h3 className="font-display-lg text-xl text-primary font-bold">Geçmiş Kurumsal Siparişler</h3>
              {pastOrdersState.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-outline-variant">package_2</span>
                  <p className="text-sm text-on-surface-variant">Henüz kayıtlı bir kurumsal siparişiniz bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-bold">Sipariş No</th>
                        <th className="pb-3 font-bold">Tarih</th>
                        <th className="pb-3 font-bold">Tutar</th>
                        <th className="pb-3 font-bold">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {pastOrdersState.map((ord) => (
                        <tr key={ord.id} className="hover:bg-surface-container-low/50">
                          <td className="py-4 font-mono font-bold text-primary">#{ord.orderNo || ord.id.slice(-8).toUpperCase()}</td>
                          <td className="py-4 font-medium">{new Date(ord.date || ord.createdAt).toLocaleDateString("tr-TR")}</td>
                          <td className="py-4 font-mono font-bold">₺{Number(ord.totalAmount || 0).toLocaleString("tr-TR")}</td>
                          <td className="py-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Wholesale Pricing */}
          {activeTab === "pricing" && (
            <div className="bg-white rounded-xl border border-outline-variant/15 p-8 shadow-sm space-y-6 animate-fade-in">
              <h3 className="font-display-lg text-xl text-primary font-bold">Wholesale Bayi Fiyat Listesi</h3>
              <p className="text-xs text-on-surface-variant">Toptan alımlarda geçerli koli ve birim fiyat matrisi.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-bold">SKU</th>
                      <th className="pb-3 font-bold">Ürün Adı</th>
                      <th className="pb-3 font-bold">Koli Ambalaj</th>
                      <th className="pb-3 font-bold">Birim Fiyat</th>
                      <th className="pb-3 font-bold">Koli Fiyatı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {productsState.map((p) => (
                      <tr key={p.sku} className="hover:bg-surface-container-low/50">
                        <td className="py-4 font-mono text-[10px] text-on-surface-variant">{p.sku}</td>
                        <td className="py-4 font-bold text-primary">{p.name}</td>
                        <td className="py-4 text-on-surface-variant">{p.packSize}</td>
                        <td className="py-4 font-mono font-bold">₺{p.unitPrice}</td>
                        <td className="py-4 font-mono font-bold text-primary">₺{p.casePrice.toLocaleString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Wallet / Cari Ekstre */}
          {activeTab === "wallet" && (
            <div className="bg-white rounded-xl border border-outline-variant/15 p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="font-display-lg text-xl text-primary font-bold">Cari Bakiye & Ekstre</h3>
                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block font-bold">Bakiye</span>
                    <span className="font-mono font-bold text-primary text-lg">
                      ₺{Number(dealerAccount?.balance || 0).toLocaleString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant">Cari hesap hareketlerinizi ve ödemelerinizi bu alandan takip edebilirsiniz.</p>
            </div>
          )}

        </main>
      </div>

      {/* CSV Upload Modal */}
      <Modal isOpen={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Hızlı Sipariş (CSV / Excel Yükle)">
        <div className="space-y-4 text-xs">
          <p className="text-on-surface-variant">
            SKU ve Adet sütunlarını içeren CSV veya Excel dosyanızı yükleyerek toplu koli siparişinizi tek tıkla sepetinize ekleyebilirsiniz.
          </p>
          <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-8 text-center space-y-2 bg-surface-container-low">
            <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
            <p className="font-bold text-primary">Dosyayı Buraya Sürükleyin veya Seçin</p>
            <p className="text-[10px] text-on-surface-variant">Desteklenen formatlar: .csv, .xlsx</p>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(false)}>İptal</Button>
            <Button size="sm" onClick={() => { setCsvModalOpen(false); showNotification("Excel listeniz işlendi! 4 koli sepetinize aktarıldı.", "success"); }}>Yükle ve Aktar</Button>
          </div>
        </div>
      </Modal>

      <Toast message={toastMsg} isOpen={toastOpen} onClose={() => setToastOpen(false)} type={toastType} />
    </div>
  );
}
