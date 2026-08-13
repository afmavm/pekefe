"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { getCart, updateCartQty, removeFromCart } from "@/utils/cartStorage";
import { useSession, signOut } from "next-auth/react";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import { useCMS } from "@/context/CMSContext";

const stripHtml = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const translateImage = (url) => {
  if (!url) return url;
  if (url.includes("/pekefe-dut-pekmezi-kavanoz.jpg") || url.includes("/geleneksel-pekmez.jpg") || url.includes("/geleneksel-pekmez.png")) {
    return "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
  }
  if (url.includes("/premium-pekefe-kavanoz.png")) {
    return "/premium-pekefe-kavanoz-tr.png";
  }
  return url;
};

export default function Header() {
  const { cmsData } = useCMS();
  const [logoSrc, setLogoSrc] = useState(cmsData?.logoUrl || "/logo.png");

  useEffect(() => {
    setLogoSrc(cmsData?.logoUrl || "/logo.png");
  }, [cmsData?.logoUrl]);

  const pathname = usePathname();
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOpenSearch = () => setSearchOpen(true);
    window.addEventListener("open_global_search", handleOpenSearch);
    return () => window.removeEventListener("open_global_search", handleOpenSearch);
  }, []);

  const sessionResult = useSession() || {};
  const session = sessionResult.data;
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "ADMIN";
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Hesabım";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const items = getCart();
    setCartItems(Array.isArray(items) ? items : []);
    const handleCartChange = () => {
      const updated = getCart();
      setCartItems(Array.isArray(updated) ? updated : []);
    };
    window.addEventListener("pekefe_cart_changed", handleCartChange);
    return () => window.removeEventListener("pekefe_cart_changed", handleCartChange);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const updateQty = (id, delta) => updateCartQty(id, delta);
  const removeItem = (id) => removeFromCart(id);

  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const subtotal = safeItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
  const cartCount = safeItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const getLinkClass = (path) => {
    const base = "whitespace-nowrap transition-colors pb-1 text-xs lg:text-xs xl:text-sm font-medium";
    const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);
    return isActive
      ? `${base} text-primary border-b-2 border-primary font-bold`
      : `${base} text-on-surface hover:text-primary`;
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <nav className="bg-surface/95 backdrop-blur-md sticky top-0 z-50 transition-all premium-shadow border-b border-outline-variant/10" aria-label="Ana Navigasyon">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-16 md:h-20 gap-2 sm:gap-4">

          {/* Brand Logo */}
          <div className="flex items-center shrink-0 z-10">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 font-display-lg text-headline-md tracking-tight text-primary hover:opacity-90 transition-opacity">
              <Image
                src={logoSrc}
                onError={() => setLogoSrc("/logo.png")}
                alt={cmsData?.siteName || "PEKEFE Logo"}
                width={52}
                height={52}
                priority
                className="h-10 md:h-13 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
              <span className="font-bold text-xl md:text-2xl tracking-tight text-[#6b1d2f] dark:text-amber-400">
                {cmsData?.siteName ? cmsData.siteName.split(" ")[0] : "Pekefe"}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 xl:gap-8" role="menubar" aria-label="Birincil Menü">
            <Link href="/" className={getLinkClass("/")}>Mağaza</Link>
            <Link href="/kategoriler" className={getLinkClass("/kategoriler")}>Kategoriler</Link>
            <Link href="/hikayemiz" className={getLinkClass("/hikayemiz")}>Hikayemiz</Link>
            <Link href="/tesisimiz" className={getLinkClass("/tesisimiz")}>Tesisimiz</Link>
            <Link href="/blog" className={getLinkClass("/blog")}>Blog</Link>
            <Link href="/b2b" className={getLinkClass("/b2b")}>B2B</Link>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* User Profile Button */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-2 rounded-full hover:bg-surface-container-low active:bg-surface-container-high transition-all relative group cursor-pointer"
                aria-label="Kullanıcı Menüsü"
                aria-expanded={profileOpen}
              >
                {isLoggedIn ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-white text-xs md:text-sm font-bold flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      {userInitial}
                    </div>
                    <svg className={`w-3 h-3 text-primary transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-primary text-xl md:text-2xl">person</span>
                )}
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isLoggedIn ? (
                    <>
                      {/* User Info Header */}
                      <div className="px-4 py-4 bg-primary/5 border-b border-outline-variant/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary text-white text-base font-bold flex items-center justify-center">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{userName}</p>
                            <p className="text-xs text-on-surface-variant truncate">{session?.user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link href="/hesap" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                          <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                          Hesabım
                        </Link>
                        <Link href="/hesap" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                          <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span>
                          Siparişlerim
                        </Link>
                        <Link href="/b2b" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                          <span className="material-symbols-outlined text-[18px] text-primary">business</span>
                          {session?.user?.role === "DEALER" && session?.user?.isApproved !== false ? "B2B Bayi Portalı" : "B2B Bayilik Başvurusu"}
                        </Link>
                        {isAdmin && (
                          <Link href="/admin/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-secondary hover:bg-secondary/5 transition-colors border-t border-outline-variant/10">
                            <span className="material-symbols-outlined text-[18px] text-secondary">admin_panel_settings</span>
                            Yönetim Paneli
                          </Link>
                        )}
                        <div className="border-t border-outline-variant/10 mt-1 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Çıkış Yap
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest View */}
                      <div className="px-4 py-4 bg-primary/5 border-b border-outline-variant/10">
                        <p className="font-bold text-sm text-on-surface">Hesabınıza Giriş Yapın</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">Siparişlerinizi takip edin, özel tekliflerden yararlanın.</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <Link
                          href="/giris"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">login</span>
                          Giriş Yap
                        </Link>
                        <Link
                          href="/kayit"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_add</span>
                          Üye Ol
                        </Link>
                        <div className="border-t border-outline-variant/10 pt-3 space-y-1">
                          <Link href="/b2b" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-primary transition-colors py-1">
                            <span className="material-symbols-outlined text-[14px]">business</span>
                            B2B Bayilik Başvurusu
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Global Advanced Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1 px-2 py-1.5 md:px-3 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low hover:border-primary/40 transition-all cursor-pointer text-primary"
              aria-label="Gelişmiş Arama Motoru"
              title="Gelişmiş Arama Motoru"
            >
              <span className="material-symbols-outlined text-primary text-xl">search</span>
              <span className="hidden lg:inline text-xs font-semibold text-on-surface-variant">Arama Yap...</span>
              <kbd className="hidden xl:inline-block px-1.5 py-0.5 bg-surface-container-high border border-outline-variant/20 rounded text-[9px] font-mono text-on-surface-variant font-bold">⌘K</kbd>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="p-2 rounded-full hover:bg-surface-container-low transition-all relative cursor-pointer active:scale-95"
              aria-label="Sepet Çekmecesini Aç"
            >
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-secondary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-label-sm font-bold shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setMobileMenuOpen((prev) => !prev);
              }}
              className="md:hidden p-2 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all cursor-pointer text-primary flex items-center justify-center w-10 h-10 border border-outline-variant/20"
              aria-label="Menü"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 stroke-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 stroke-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-outline-variant/10 bg-surface-container-lowest/98 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="max-w-container-max mx-auto px-margin-mobile py-4 space-y-1.5">
              {[
                { href: "/", label: "Mağaza", icon: "storefront" },
                { href: "/kategoriler", label: "Kategoriler", icon: "grid_view" },
                { href: "/hikayemiz", label: "Hikayemiz", icon: "history_edu" },
                { href: "/tesisimiz", label: "Tesisimiz", icon: "factory" },
                { href: "/blog", label: "Blog & Yazılar", icon: "article" },
                { href: "/b2b", label: "B2B Bayilik Portalı", icon: "business_center" },
              ].map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    (href === "/" ? pathname === "/" : pathname.startsWith(href))
                      ? "bg-primary/10 text-primary font-bold shadow-sm"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg text-primary">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Slide-over Premium Shopping Cart Drawer */}
      <Drawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`SEPETİNİZ (${cartCount})`}
      >
        <div className="flex flex-col h-full justify-between">
          {safeItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <span className="material-symbols-outlined text-outline text-4xl">shopping_bag</span>
              <p className="text-on-surface-variant font-light">Sepetiniz boş.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCartOpen(false);
                  router.push("/");
                }}
                className="mt-4"
              >
                Alışverişe Başla
              </Button>
            </div>
          ) : (
            <div className="flex flex-col justify-between flex-1 gap-6">
              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {safeItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center border-b border-outline-variant/10 pb-4">
                    <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 p-1 flex items-center justify-center relative">
                      <Image
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                        src={translateImage(item.img || item.image || "/premium-pekefe-kavanoz.png")}
                        alt={item.name}
                        width={64}
                        height={64}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-primary text-xs truncate" title={stripHtml(item.name)}>{stripHtml(item.name)}</h4>
                      {item.variantLabel && (
                        <span className="text-[10px] text-[#6b1d2f] font-bold block">{stripHtml(item.variantLabel)}</span>
                      )}
                      <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-1">{stripHtml(item.desc || item.meta)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-outline-variant/20 rounded bg-white" role="group" aria-label={`${item.name} adedi`}>
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="px-2 py-0.5 hover:bg-surface-container text-xs cursor-pointer font-bold"
                            aria-label={`${item.name} adetini azalt`}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono" aria-live="polite" aria-atomic="true">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="px-2 py-0.5 hover:bg-surface-container text-xs cursor-pointer font-bold"
                            aria-label={`${item.name} adetini artır`}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-bold font-mono text-on-surface">
                          ₺{(item.price * item.quantity).toLocaleString("tr-TR")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-on-surface-variant hover:text-error cursor-pointer p-1 flex-shrink-0 transition-colors"
                      aria-label={`${item.name} ürününü kaldır`}
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-outline-variant/10 pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-primary">
                  <span>Toplam Tutar:</span>
                  <span className="font-mono text-base" aria-live="polite">₺{subtotal.toLocaleString("tr-TR")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/sepet" className="w-full" onClick={() => setCartOpen(false)}>
                    <Button variant="outline" className="w-full text-xs" size="sm">
                      Sepeti Gör
                    </Button>
                  </Link>
                  <Link href="/sepet/odeme" className="w-full" onClick={() => setCartOpen(false)}>
                    <Button className="w-full text-xs" size="sm">
                      Ödeme Adımı
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Global Advanced Search Engine Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
