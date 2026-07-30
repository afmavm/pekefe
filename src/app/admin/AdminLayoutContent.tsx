"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
const useSession = () => ({
  data: {
    user: {
      name: "Pekefe Yönetici",
      email: "admin@pekefe.com",
      role: "SUPER_ADMIN"
    }
  },
  status: "authenticated" as "authenticated" | "loading" | "unauthenticated"
});
const signOut = (options?: any) => {
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
};
import { useCMS, CMSProvider } from "@/context/CMSContext";
import { ProductProvider } from "@/context/ProductContext";
import { OrderProvider } from "@/context/OrderContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { IntegrationProvider } from "@/context/IntegrationContext";
import { toast } from "sonner";
// NextIntlClientProvider is handled in layout.tsx
import { PermissionProvider } from "@/components/PermissionContext";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Hammer,
  Users,
  Puzzle,
  Layers,
  Receipt,
  Palette,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  User,
  LogOut,
  ShieldAlert,
  Loader2,
  Check,
  Info,
  RefreshCw,
  Terminal,
  Settings,
  Sliders,
  Database,
  ArrowRight,
  SlidersHorizontal,
  Truck,
  Package,
  Tags,
  Ticket,
  BookOpen,
  Navigation,
  FootprintsIcon,
  Megaphone,
  ImageIcon,
  CreditCard,
  Banknote,
  DollarSign,
  BarChart3,
  MessageSquare,
  HeadphonesIcon,
  FileText,
  Store,
  Zap,
  TrendingUp,
  Star,
  Activity,
  Warehouse,
  ArrowLeftRight,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Scan,
  Layers3,
  CheckCheck,
  BellDot,
  ShoppingBag,
  Mail,
  History,
} from "lucide-react";

type SubItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  feature?: string;
  role?: string;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ElementType;
  description: string;
  subItems?: SubItem[];
  permission?: string;
  feature?: string;
  role?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// Complete multi-tier configuration mapping all subpages
const navGroups: NavGroup[] = [
  {
    label: "GENEL BAKIŞ",
    items: [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Widgets, AI Analizleri ve Nakit Akışı",
        permission: "view_dashboard",
      },
      {
        name: "AI Asistan",
        href: "/admin/ai-assistant",
        icon: Zap,
        description: "Doğal dille ERP veritabanı sorgula",
        permission: "use_ai_assistant",
      },
    ],
  },
  {
    label: "OPERASYONLAR",
    items: [
      {
        name: "Siparişler",
        icon: ShoppingCart,
        description: "B2B & B2C Ortak Sipariş Havuzu",
        feature: "b2b",
        subItems: [
          { name: "Sipariş Listesi", href: "/admin/orders", icon: ShoppingCart },
          { name: "Kargo Takibi", href: "/admin/cargo", icon: Truck },
        ],
      },
      {
        name: "Envanter & Depo",
        icon: ClipboardList,
        description: "Çoklu Depo Yönetimi & Stok Hareketleri",
        feature: "inventory",
        subItems: [
          { name: "Ürünler", href: "/admin/stock", icon: Package, permission: "edit_stock" },
          { name: "Fırsat Ürünleri", href: "/admin/deals", icon: Tags },
          { name: "Stok Durumu", href: "/admin/inventory/stock-status", icon: Layers3, permission: "edit_stock" },
          { name: "Stok Hareketleri", href: "/admin/inventory/movements", icon: Activity, permission: "edit_stock" },
          { name: "Depolar", href: "/admin/inventory/warehouses", icon: Warehouse, permission: "edit_stock" },
          { name: "Raf Yönetimi", href: "/admin/inventory/shelves", icon: Scan, permission: "edit_stock" },
          { name: "Depolar Arası Transfer", href: "/admin/inventory/transfers", icon: ArrowLeftRight, permission: "edit_stock" },
          { name: "Sayım İşlemleri", href: "/admin/inventory/cycle-count", icon: ClipboardCheck, permission: "edit_stock" },
          { name: "Kritik Stoklar", href: "/admin/inventory/critical", icon: AlertTriangle, permission: "edit_stock" },
          { name: "Envanter Raporları", href: "/admin/inventory/reports", icon: FileBarChart, permission: "edit_stock" },
        ],
      },
      {
        name: "Üretim & MRP",
        icon: Hammer,
        description: "Reçete Yönetimi & BOM Ağacı",
        feature: "production",
        subItems: [
          { name: "Üretim Planları", href: "/admin/production/plans", icon: Hammer },
          { name: "Üretim Emirleri", href: "/admin/production/orders", icon: ClipboardCheck },
          { name: "Ürün Reçeteleri (BOM)", href: "/admin/production/recipes", icon: Layers3 },
          { name: "İş İstasyonları & Rotalar", href: "/admin/production/workstations", icon: Sliders },
          { name: "Fire & Hurda Takibi", href: "/admin/production/waste", icon: AlertTriangle },
          { name: "Üretim Raporları", href: "/admin/production/reports", icon: FileBarChart },
        ],
      },
    ],
  },
  {
    label: "CARİ VE SATIŞ",
    items: [
      {
        name: "Müşteri ve Bayiler",
        icon: Users,
        description: "Bayi Yönetimi, Başvurular ve İskontolar",
        feature: "b2b",
        subItems: [
          { name: "Cari Hesaplar", href: "/admin/dealers?view=general", icon: Users },
          { name: "Bayi Yönetimi", href: "/admin/dealers?view=b2b", icon: Store },
          { name: "Bayilik Başvuruları", href: "/admin/applications", icon: ClipboardCheck },
          { name: "Fiyat & İskontolar", href: "/admin/pricing", icon: Tags },
        ],
      },
      {
        name: "CRM & Destek",
        icon: MessageSquare,
        description: "Bayi Destek Talepleri & CRM",
        feature: "b2b",
        subItems: [
          { name: "Destek Talepleri", href: "/admin/tickets", icon: MessageSquare },
        ],
      },
    ],
  },
  {
    label: "FİNANS VE MUHASEBE",
    items: [
      {
        name: "Ön Muhasebe",
        icon: Receipt,
        description: "B2B Evrakları & Fatura Takibi",
        feature: "accounting",
        subItems: [
          { name: "Finans Genel", href: "/admin/finance", icon: CreditCard },
          { name: "Faturalar", href: "/admin/invoices", icon: Receipt, permission: "approve_invoice" },
          { name: "Ödemeler", href: "/admin/payments", icon: Banknote },
          { name: "e-İrsaliye Yönetimi", href: "/admin/despatch", icon: Truck, permission: "create_despatch" },
        ],
      },
      {
        name: "Genel Muhasebe (ERP)",
        icon: BarChart3,
        description: "Çift Kayıtlı Defter, Yevmiye & Mizan",
        feature: "accounting",
        subItems: [
          { name: "Muhasebe Dashboard", href: "/admin/muhasebe", icon: BarChart3, permission: "view_dashboard" },
          { name: "Satış & Alış Belgesi", href: "/admin/muhasebe/belgeler", icon: Receipt },
          { name: "Gelir & Gider", href: "/admin/muhasebe/gelir-gider", icon: DollarSign },
          { name: "Cari Mizan", href: "/admin/muhasebe/cari", icon: Users },
          { name: "Banka Hesapları", href: "/admin/muhasebe/banka", icon: Store },
          { name: "Yevmiye Fişleri", href: "/admin/muhasebe/yevmiye", icon: BookOpen },
          { name: "Satın Alma Talepleri", href: "/admin/muhasebe/purchase-requisitions", icon: ClipboardList },
          { name: "Gelen Faturalar", href: "/admin/muhasebe/gelen-faturalar", icon: FileText, permission: "approve_invoice" },
          { name: "Tedarikçi Ödemeleri", href: "/admin/muhasebe/tedarikci-odemeleri", icon: Banknote, permission: "approve_invoice" },
          { name: "Antigravity Engine", href: "/admin/muhasebe/antigravity", icon: Zap, permission: "use_ai_assistant" },
        ],
      },
    ],
  },
  {
    label: "SİSTEM VE CMS",
    items: [
      {
        name: "CMS & Sayfa Sihirbazı",
        icon: Layers,
        description: "Blok Tabanlı İçerik Yönetimi & CMS",
        subItems: [
          { name: "Site Editörü", href: "/admin/site-editor", icon: Layers },
          { name: "Sayfalar", href: "/admin/pages", icon: FileText },
          { name: "Navbar Düzenle", href: "/admin/navbar", icon: Navigation },
          { name: "Footer Düzenle", href: "/admin/footer", icon: FootprintsIcon },
          { name: "Popup Yönetimi", href: "/admin/popup", icon: Megaphone },
          { name: "SEO Ayarları", href: "/admin/seo", icon: Search },
          { name: "Medya Kütüphanesi", href: "/admin/media", icon: ImageIcon },
          { name: "Blog Yönetimi", href: "/admin/blog", icon: BookOpen },
        ],
      },
      {
        name: "Sistem Ayarları",
        icon: Settings,
        description: "Sistem, Tema & Yetkilendirmeler",
        subItems: [
          { name: "Tema Ayarları", href: "/admin/theme", icon: Palette },
          { name: "Kampanya Ayarları", href: "/admin/campaigns", icon: SlidersHorizontal },
          { name: "Sistem Raporları", href: "/admin/reports", icon: BarChart3 },
          { name: "Bayi Geri Bildirimleri", href: "/admin/feedback", icon: MessageSquare },
          { name: "Veritabanı Yedekleme", href: "/admin/backup", icon: Database },
          { name: "Pazaryeri Bağlantı", href: "/admin/integrations", icon: Puzzle },
          { name: "E-posta Şablonları", href: "/admin/email-templates", icon: Mail },
          { name: "E-posta Geçmişi", href: "/admin/email-history", icon: History },
          { name: "E-posta Ayarları", href: "/admin/email-settings", icon: Settings },
        ],
      },
      {
        name: "Süper Yönetici (SaaS)",
        href: "/admin/super-admin",
        icon: Sliders,
        description: "Şirket modülleri ve lisans ayarları",
        role: "SUPER_ADMIN",
      },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard & Genel Bakış",
  "/admin/ai-assistant": "AI Patron Asistanı (NL2SQL)",
  "/admin/orders": "Sipariş Listesi & Havuz",
  "/admin/cargo": "Kargo Takip Entegrasyonu",
  "/admin/stock": "Ürünler & Stok Listesi",
  "/admin/inventory": "Envanter & Depo Genel Bakış",
  "/admin/inventory/stock-status": "Stok Durumu",
  "/admin/inventory/movements": "Stok Hareketleri & Audit Log",
  "/admin/inventory/warehouses": "Depolar & Şube Hiyerarşisi",
  "/admin/inventory/shelves": "Raf Yönetimi (WMS)",
  "/admin/inventory/transfers": "Depolar Arası Transfer",
  "/admin/inventory/cycle-count": "Sayım İşlemleri",
  "/admin/inventory/critical": "Kritik Stok Takibi",
  "/admin/inventory/reports": "Envanter Raporları",
  "/admin/production/plans": "Üretim Planları",
  "/admin/production/orders": "Üretim Emirleri (Work Orders)",
  "/admin/production/recipes": "Ürün Reçeteleri (BOM)",
  "/admin/production/workstations": "İş İstasyonları & Rotalar",
  "/admin/production/waste": "Fire & Hurda Takibi",
  "/admin/production/reports": "Üretim Raporları",
  "/admin/dealers": "Bayi Yönetim Portali",
  "/admin/applications": "Bayilik Başvuruları",
  "/admin/pricing": "Fiyat Listeleri & İskontolar",
  "/admin/campaigns": "Kampanya & Promosyon Yönetimi",
  "/admin/integrations": "Pazaryeri Bağlantı Merkezi",
  "/admin/site-editor": "CMS Canlı Görsel Editör",
  "/admin/pages": "Statik Sayfalar & Blog",
  "/admin/navbar": "Menü & Navigasyon Ayarları",
  "/admin/footer": "Footer & Link Yönetimi",
  "/admin/popup": "Popup & Duyuru Yönetimi",
  "/admin/seo": "Arama Motoru Optimizasyonu (SEO)",
  "/admin/media": "Medya Dosyaları Kütüphanesi",
  "/admin/blog": "Blog & İçerik Yönetimi",
  "/admin/finance": "Finansal Durum & Analiz",
  "/admin/invoices": "E-Fatura & Cari Faturalar",
  "/admin/despatch": "e-İrsaliye (GİB Despatch Advice) Yönetimi",
  "/admin/payments": "Tahsilat & Ödeme Listesi",
  "/muhasebe": "Muhasebe Dashboard",
  "/muhasebe/gelir-gider": "Gelir & Gider Yönetimi",
  "/muhasebe/cari": "Cari Hesap Mizanı",
  "/muhasebe/banka": "Banka Hesap Kontrolleri",
  "/muhasebe/yevmiye": "Yevmiye & Defter Kayıtları",
  "/muhasebe/purchase-requisitions": "Satın Alma Talepleri",
  "/muhasebe/purchase-requisitions/new": "Yeni Satın Alma Talebi",
  "/muhasebe/gelen-faturalar": "Gelen e-Fatura Kontrol Paneli",
  "/muhasebe/tedarikci-odemeleri": "Tedarikçi Ödemeleri & Fatura Kapatma (Tediye)",
  "/muhasebe/antigravity": "Antigravity Akıllı Dağıtım Modülü",
  "/admin/muhasebe": "Muhasebe Dashboard",
  "/admin/muhasebe/gelir-gider": "Gelir & Gider Yönetimi",
  "/admin/muhasebe/cari": "Cari Hesap Mizanı",
  "/admin/muhasebe/banka": "Banka Hesap Kontrolleri",
  "/admin/muhasebe/yevmiye": "Yevmiye & Defter Kayıtları",
  "/admin/theme": "Tema Konfigürasyonu",
  "/admin/reports": "Sistem Raporları",
  "/admin/feedback": "Bayi Geri Bildirimleri",
  "/admin/tickets": "Destek Talepleri",
  "/admin/backup": "Veritabanı Yedekleme ve Geri Yükleme",
  "/admin/super-admin": "Süper Yönetici (SaaS)",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { cmsData } = useCMS();
  const pathname = usePathname();
  const router = useRouter();

  const userPermissions = (session?.user as any)?.permissions || [];
  const userRole = session?.user?.role || "";
  const companyFeatures = (session?.user as any)?.companyFeatures || ['b2b', 'b2c', 'production', 'inventory', 'accounting'];
  const isPro = companyFeatures.includes("production");
  
  const can = (permissionName: string): boolean => {
    return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userPermissions.includes(permissionName);
  };

  const hasFeature = (feature: string | undefined): boolean => {
    if (!feature) return true;
    return companyFeatures.includes(feature);
  };

  const filteredNavGroups = navGroups.map((group) => {
    const filteredItems = group.items.map((item) => {
      // Role constraint
      if (item.role && userRole !== item.role) {
        return null;
      }

      // Feature constraint
      if (item.feature && !hasFeature(item.feature)) {
        return null;
      }

      if (item.permission && !can(item.permission)) {
        return null;
      }

      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((sub) => {
          if (sub.role && userRole !== sub.role) {
            return false;
          }
          if (sub.feature && !hasFeature(sub.feature)) {
            return false;
          }
          return !sub.permission || can(sub.permission);
        });

        if (filteredSubItems.length === 0 && !item.href) {
          return null;
        }

        return {
          ...item,
          subItems: filteredSubItems,
        };
      }

      return item;
    }).filter(Boolean) as NavItem[];

    return {
      ...group,
      items: filteredItems,
    };
  }).filter((group) => group.items.length > 0);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleSidebarUpgrade = async () => {
    setUpgrading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const { upgradeCompanyToProAction } = await import("@/modules/cms/super-admin/superActions");
      const result = await upgradeCompanyToProAction();
      if (result.success) {
        setUpgradeSuccess(true);
        toast.success("Tebrikler! Şirketiniz başarıyla PRO pakete yükseltildi.");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err.message || "Yükseltme işlemi sırasında bir hata oluştu.");
      setUpgrading(false);
    }
  };

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    orders: any[];
    products: any[];
    dealers: any[];
  }>({ orders: [], products: [], dealers: [] });
  const [searching, setSearching] = useState(false);

  const siteName = cmsData?.siteName || "Pekefe";
  const primaryColor = cmsData?.primaryColor || "#6b1d2f";

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const latestNotifIdRef = useRef<string | null>(null);

  const playOrderSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      // A pleasant two-tone chime: D5 then F#5
      const playTone = (freq: number, startAt: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + startAt + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + duration);
      };
      playTone(587.33, 0, 0.35);  // D5
      playTone(739.99, 0.3, 0.45); // F#5
    } catch (err) {
      console.warn("Could not play notification sound:", err);
    }
  };

  const playTicketSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const playTone = (freq: number, startAt: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + startAt);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + startAt + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + duration);
      };
      playTone(880.00, 0, 0.15);    // A5 chime 1
      playTone(880.00, 0.18, 0.3);  // A5 chime 2
    } catch (err) {
      console.warn("Could not play ticket notification sound:", err);
    }
  };

  const playApplicationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 bell chime
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (err) {
      console.warn("Could not play application notification sound:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const list = data.notifications || [];
      const newUnread = data.unreadCount || 0;

      // Check if we have a previous latest notification ID stored
      if (latestNotifIdRef.current && list.length > 0) {
        const index = list.findIndex((n: any) => n.id === latestNotifIdRef.current);
        const newItems = index === -1 ? list : list.slice(0, index);

        // Process from oldest new item to newest
        newItems.reverse().forEach((notif: any) => {
          if (notif.type === "TICKET") {
            playTicketSound();
            toast.info(notif.title, {
              description: notif.message,
              duration: 8000,
              icon: "🎫"
            });
          } else if (notif.type === "APPLICATION" || notif.type === "DEALER_APPLICATION") {
            playApplicationSound();
            toast.success(notif.title, {
              description: notif.message,
              duration: 8000,
              icon: "🤝"
            });
          } else {
            playOrderSound();
            toast.success(notif.title, {
              description: notif.message,
              duration: 8000,
              icon: "📦"
            });
          }
        });
      }

      if (list.length > 0) {
        latestNotifIdRef.current = list[0].id;
      }

      prevUnreadCountRef.current = newUnread;
      setNotifications(list);
      setUnreadCount(newUnread);
    } catch (e) {
      // silently fail
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      await fetchNotifications();
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      await fetchNotifications();
      toast.success("Tüm bildirimler okundu olarak işaretlendi.");
    } catch (e) {}
  };

  const isActive = (href: string) => {
    const path = pathname || "";
    const stripped = path.replace(/^\/(tr|en)/, "");
    if (href === "/admin") return stripped === "/admin" || stripped === "/admin/dashboard";
    return stripped.startsWith(href);
  };

  // One-time mount: set light mode, restore sidebar state, register keyboard shortcut
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
    }
    setMounted(true);
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expand the active group on route change — but keep already-open groups
  useEffect(() => {
    const autoExpand: string[] = [];
    filteredNavGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some((sub) => isActive(sub.href));
          if (hasActiveSub) {
            autoExpand.push(item.name);
          }
        }
      });
    });
    if (autoExpand.length > 0) {
      setExpandedItems((prev) => {
        const merged = [...new Set([...prev, ...autoExpand])];
        return merged;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Real-time notification polling: initial load + every 8 seconds
  useEffect(() => {
    prevUnreadCountRef.current = -1; // sentinel so first load never plays sound
    fetchNotifications().then(() => {
      prevUnreadCountRef.current = unreadCount;
    });
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ orders: [], products: [], dealers: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Global search error:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const toggleSidebarCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("admin-sidebar-collapsed", String(nextState));
  };

  const toggleItemExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const getPageTitle = () => {
    const path = pathname || "";
    const stripped = path.replace(/^\/(tr|en)/, "");
    const match = Object.keys(PAGE_TITLES)
      .filter((k) => stripped === k || stripped.startsWith(k + "/"))
      .sort((a, b) => b.length - a.length)[0];
    return match ? PAGE_TITLES[match] : "Yönetim Paneli";
  };

  const isFullBleed = pathname?.includes("/admin/site-editor");

  useEffect(() => {
    const handleClickOutside = () => setUserMenuOpen(false);
    if (userMenuOpen) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4 w-full">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-xs uppercase tracking-widest">
          Oturum Doğrulanıyor...
        </p>
      </div>
    );
  }

  const ERP_ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "WAREHOUSE_SUPERVISOR", "SALES_STAFF"];
  if (!session || !ERP_ROLES.includes(session.user?.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 p-10 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Yetkisiz Erişim</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Bu yönetim paneline erişebilmek için Süper Yönetici yetkilerine sahip olmanız gerekmektedir.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              prefetch={false}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all"
            >
              Giriş Ekranına Git
            </Link>
            <Link
              href="/"
              prefetch={false}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
            >
              Site Ana Sayfası
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isFullBleed) {
    return <div className="w-full h-screen overflow-hidden bg-slate-50">{children}</div>;
  }

  const userInitials = session.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  const handleSimulateSync = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Pazaryerleri verileri eşitleniyor...",
        success: "Trendyol, Hepsiburada ve N11 stokları güncellendi!",
        error: "Bağlantı hatası oluştu.",
      }
    );
    const newNotif = {
      id: Date.now(),
      type: "success",
      text: "Otomatik senkronizasyon kuyruğu başarıyla tamamlandı.",
      time: "Şimdi",
    };
    setNotifications([newNotif, ...notifications]);
  };

  return (
    <PermissionProvider>
      <div className="flex h-screen bg-slate-100 overflow-hidden w-full font-sans antialiased">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════════════ SIDEBAR — Light style matching Suggest. template ═══════════════════ */}
      <aside
        className={[
          "fixed md:relative z-50 md:z-auto shrink-0 no-print",
          isCollapsed ? "w-[72px]" : "w-[240px]",
          "bg-white border-r border-slate-200",
          "flex flex-col h-full",
          "transform transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <Link href="/admin" prefetch={false} className="flex items-center gap-2.5 leading-none">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-sm text-slate-800 tracking-tight leading-none">
                  Pekefe<span className="text-orange-500">ERP</span>
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  Cloud Panel
                </span>
              </div>
            )}
          </Link>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-orange-500 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
          {filteredNavGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed ? (
                <div className="text-[10px] tracking-[0.15em] font-extrabold text-slate-400 uppercase px-2 mb-2 select-none">
                  {group.label}
                </div>
              ) : (
                <div className="h-[1px] bg-slate-100 my-3 mx-1" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isExpanded = expandedItems.includes(item.name);
                  const hasActiveSub = item.subItems?.some((sub) => isActive(sub.href)) ?? false;
                  const isParentActive = item.href ? isActive(item.href) : hasActiveSub;

                  return (
                    <div key={item.name} className="relative group/tooltip">
                      <button
                        onClick={() => {
                          if (isCollapsed) toggleSidebarCollapse();
                          if (item.subItems) {
                            toggleItemExpand(item.name);
                          } else if (item.href) {
                            router.push(item.href);
                          }
                        }}
                        className={[
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                          isParentActive
                            ? "bg-orange-50 text-orange-600"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ItemIcon
                            className={[
                              "w-4 h-4 shrink-0",
                              isParentActive ? "text-orange-500" : "text-slate-400",
                            ].join(" ")}
                          />
                          {!isCollapsed && (
                            <span className="truncate text-[13px]">{item.name}</span>
                          )}
                        </div>
                        {!isCollapsed && item.subItems && (
                          <ChevronDown
                            className={[
                              "w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0",
                              isExpanded ? "rotate-180 text-orange-500" : "",
                            ].join(" ")}
                          />
                        )}
                      </button>

                      {/* Sub-items */}
                      {!isCollapsed && item.subItems && (
                        <div
                          className={`grid transition-all duration-200 ease-in-out ${
                            isExpanded
                              ? "grid-rows-[1fr] opacity-100 mt-1"
                              : "grid-rows-[0fr] opacity-0 pointer-events-none"
                          }`}
                        >
                          <div className="overflow-hidden ml-3.5 pl-4 border-l-2 border-slate-100 space-y-0.5 py-0.5">
                            {item.subItems.map((sub) => {
                              const SubIcon = sub.icon;
                              const subActive = isActive(sub.href);
                              return (
                                <Link
                                  key={sub.name + '-' + sub.href}
                                  href={sub.href}
                                  prefetch={false}
                                  className={[
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all",
                                    subActive
                                      ? "text-orange-600 bg-orange-50 font-semibold"
                                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                                  ].join(" ")}
                                >
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${subActive ? "text-orange-500" : "text-slate-400"}`} />
                                  <span>{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Collapsed tooltip */}
                      {isCollapsed && (
                        <div className="absolute left-full top-0 ml-3 w-52 bg-white border border-slate-200 text-xs rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 shadow-lg z-50 p-2 pointer-events-auto">
                          <div className="px-2 py-1.5 border-b border-slate-100 mb-1 font-bold text-slate-700 text-xs">
                            {item.name}
                          </div>
                          <div className="space-y-0.5">
                            {item.subItems ? (
                              item.subItems.map((sub) => {
                                const SubIcon = sub.icon;
                                const subActive = isActive(sub.href);
                                return (
                                  <Link
                                    key={sub.name + '-' + sub.href}
                                    href={sub.href}
                                    prefetch={false}
                                    className={[
                                      "flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all",
                                      subActive ? "text-orange-600 font-semibold bg-orange-50" : ""
                                    ].join(" ")}
                                  >
                                    <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{sub.name}</span>
                                  </Link>
                                );
                              })
                            ) : (
                              <Link
                                href={item.href || "#"}
                                prefetch={false}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
                              >
                                <item.icon className="w-3.5 h-3.5 text-slate-400" />
                                <span>Git</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-100 bg-white shrink-0 space-y-1">
          <button
            onClick={toggleSidebarCollapse}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Menüyü Daralt</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>

        {/* Upgrade to Pro card / Premium status */}
        {!isCollapsed && (
          !isPro ? (
            <div className="m-3 p-4 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wide">Pro'ya Geç!</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Gelişmiş AI analizleri ve tüm özellikleri açın.
                </p>
                <button 
                  onClick={() => setUpgradeModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  Pro'ya Yükselt
                </button>
              </div>
            </div>
          ) : (
            <div className="m-3 p-3.5 bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-600/20 rounded-2xl text-white relative overflow-hidden flex items-center gap-3 shadow-md">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-lg" />
              <div className="w-9 h-9 bg-white/20 border border-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-white fill-current animate-pulse" />
              </div>
              <div className="relative">
                <p className="text-xs font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">PRO ÜYELİK</p>
                <p className="text-[10px] text-amber-50 font-bold mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">Tüm ERP modülleri aktif</p>
              </div>
            </div>
          )
        )}
      </aside>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50">
        {/* Top Header */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-4 md:px-6 justify-between shrink-0 z-30 no-print">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title - desktop */}
            <div className="hidden md:flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-700">{getPageTitle()}</h1>
            </div>

            {/* Page title - mobile */}
            <div className="md:hidden">
              <h1 className="text-sm font-bold text-slate-800">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Global Search */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition text-left"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Ara...</span>
              <kbd className="hidden sm:block px-1.5 py-0.5 text-[9px] bg-white text-slate-400 rounded border border-slate-200 font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* View store */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500 rounded-xl transition bg-white"
            >
              <Globe className="w-3.5 h-3.5" />
              Mağaza
            </a>

            {/* Sync */}
            <button
              onClick={handleSimulateSync}
              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
              title="Pazaryeri Senkronizasyonu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => { setNotificationsOpen(true); fetchNotifications(); }}
              className="relative p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition"
            >
              {unreadCount > 0 ? <BellDot className="w-4 h-4 text-orange-500" /> : <Bell className="w-4 h-4" />}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-lg animate-bounce">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <div className="w-[1px] h-5 bg-slate-200" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((v) => !v);
                }}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 hover:bg-slate-100 rounded-xl transition"
              >
                <div className="w-7 h-7 bg-orange-500 text-white font-black rounded-lg flex items-center justify-center text-xs shadow-sm">
                  {userInitials}
                </div>
                <span className="hidden md:block text-xs font-semibold text-slate-700 max-w-[90px] truncate">
                  {session.user?.name || "Admin"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {session.user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {session.user?.email}
                    </p>
                  </div>
                  <Link
                    href="/admin/theme"
                    prefetch={false}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Sistem Profilim
                  </Link>
                  <a
                    href="/"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Mağazayı Görüntüle
                  </a>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center gap-2 w-full px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {children}
        </main>
      </div>

      {/* ═══════════════════ COMMAND PALETTE ═══════════════════ */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Arama yapın (Sipariş ID, ürün adı, cari kod...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-slate-700 placeholder-slate-400 text-sm focus:outline-none w-full"
                autoFocus
              />
              {searching ? (
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
              ) : (
                <kbd className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-400 rounded border border-slate-200 font-mono">
                  ESC
                </kbd>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] p-4 space-y-4">
              {searchQuery.length < 2 ? (
                <div className="space-y-3">
                  <div className="text-[10px] tracking-widest font-extrabold text-slate-400 uppercase">
                    Hızlı Modül Navigasyonu
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {navGroups.flatMap((g) => g.items).flatMap((item) => {
                      if (item.subItems) {
                        return item.subItems.map((sub) => ({
                          name: sub.name,
                          href: sub.href,
                          icon: sub.icon,
                          desc: item.name
                        }));
                      }
                      return [{
                        name: item.name,
                        href: item.href || "#",
                        icon: item.icon,
                        desc: "Genel Özet"
                      }];
                    }).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.name + item.href}
                          onClick={() => {
                            router.push(item.href);
                            setCommandPaletteOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 text-left transition"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{item.name}</p>
                            <p className="text-[9px] text-slate-400 truncate max-w-[140px]">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.orders.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] tracking-widest font-extrabold text-slate-400 uppercase flex items-center gap-1.5">
                        <ShoppingCart className="w-3 h-3 text-orange-500" />
                        Siparişler
                      </div>
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {searchResults.orders.map((order) => (
                          <button
                            key={order.id}
                            onClick={() => {
                              router.push(`/admin/orders`);
                              setCommandPaletteOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left transition"
                          >
                            <div>
                              <p className="text-xs font-mono font-bold text-slate-700">
                                #{order.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {order.currentAccount?.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-800">
                                ₺{order.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </p>
                              <span className="inline-flex px-1.5 py-0.5 text-[8px] font-semibold bg-orange-50 text-orange-600 rounded border border-orange-100 mt-1">
                                {order.status}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.products.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] tracking-widest font-extrabold text-slate-400 uppercase flex items-center gap-1.5">
                        <ClipboardList className="w-3 h-3 text-violet-500" />
                        Ürünler & Stok
                      </div>
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {searchResults.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              router.push(`/admin/inventory`);
                              setCommandPaletteOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left transition"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-700">{product.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-800">
                                ₺{product.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Stok: {product.stock}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.dealers.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] tracking-widest font-extrabold text-slate-400 uppercase flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-emerald-500" />
                        Bayiler & Cari Hesaplar
                      </div>
                      <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {searchResults.dealers.map((dealer) => (
                          <button
                            key={dealer.id}
                            onClick={() => {
                              router.push(`/admin/dealers`);
                              setCommandPaletteOpen(false);
                              setSearchQuery("");
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 text-left transition"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-700">{dealer.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{dealer.email || "E-posta yok"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-800">
                                ₺{dealer.balance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                              </p>
                              <span className="inline-flex px-1.5 py-0.5 text-[8px] font-semibold bg-emerald-50 text-emerald-600 rounded border border-emerald-100 mt-1">
                                {dealer.type}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.orders.length === 0 &&
                    searchResults.products.length === 0 &&
                    searchResults.dealers.length === 0 && (
                      <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                        <Info className="w-6 h-6 text-slate-300" />
                        Kayıt bulunamadı.
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <div className="flex gap-3">
                <span><kbd className="px-1 bg-white border border-slate-200 rounded text-[9px]">↑↓</kbd> Gezin</span>
                <span><kbd className="px-1 bg-white border border-slate-200 rounded text-[9px]">Enter</kbd> Seç</span>
              </div>
              <span>Atak ERP Cloud</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PREMIUM NOTIFICATIONS DRAWER ═══════════════════ */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setNotificationsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-[380px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <BellDot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Bildirimler</h3>
                  <p className="text-[10px] text-orange-100 mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} okunmamış sipariş bildirimi` : "Tüm bildirimler okundu"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-bold transition"
                    title="Tümünü Okundu İşaretle"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Tümünü Oku
                  </button>
                )}
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                    <Bell className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Henüz bildirim yok</p>
                  <p className="text-[11px] text-slate-400 mt-1">Yeni siparişler burada görünecek</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!item.isRead) markAsRead(item.id);
                        if (item.orderId) {
                          setNotificationsOpen(false);
                          router.push(`/admin/orders`);
                        } else if (item.type === "APPLICATION" || item.type === "DEALER_APPLICATION") {
                          setNotificationsOpen(false);
                          router.push(`/admin/applications`);
                        }
                      }}
                      className={[
                        "w-full text-left px-4 py-4 flex items-start gap-3.5 transition-all hover:bg-orange-50/60 group",
                        !item.isRead ? "bg-orange-50/40" : "bg-white"
                      ].join(" ")}
                    >
                      {/* Icon Avatar */}
                      <div className={[
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition",
                        !item.isRead ? "bg-orange-500 text-white shadow-sm" : "bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500"
                      ].join(" ")}>
                        {item.type === "TICKET" ? (
                          <Ticket className="w-4.5 h-4.5" />
                        ) : item.type === "APPLICATION" || item.type === "DEALER_APPLICATION" ? (
                          <ClipboardList className="w-4.5 h-4.5" />
                        ) : (
                          <ShoppingBag className="w-4.5 h-4.5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={[
                          "text-xs leading-snug",
                          !item.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"
                        ].join(" ")}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {item.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                          {new Date(item.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!item.isRead && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center gap-2">
              <button
                onClick={() => { fetchNotifications(); toast.info("Bildirimler yenilendi."); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-500 rounded-xl text-[11px] font-bold transition"
              >
                <RefreshCw className="w-3 h-3" />
                Yenile
              </button>
              <button
                onClick={() => {
                  setNotificationsOpen(false);
                  router.push("/admin/orders");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[11px] font-bold transition shadow-sm"
              >
                <ShoppingBag className="w-3 h-3" />
                Tüm Siparişler
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium Upgrade Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
            onClick={() => !upgrading && setUpgradeModalOpen(false)}
          />
          
          {/* Content Card */}
          <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl shadow-2xl p-6 text-center space-y-6 animate-scale-up">
            <button
              onClick={() => !upgrading && setUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
              disabled={upgrading}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto text-amber-600 border border-amber-100">
              <Star className="w-6 h-6 fill-current animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">Şirketinizi PRO'ya Yükseltin</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Tüm kilitli ERP modüllerini, AI analitik asistanını ve sınırsız özellikleri anında açın.
              </p>
            </div>

            {/* Price tag */}
            <div className="py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-slate-800">1.250 TL</span>
              <span className="text-xs font-semibold text-slate-400">/ ay + KDV</span>
            </div>

            {/* Action */}
            <div>
              {upgradeSuccess ? (
                <button
                  disabled
                  className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" /> Yükseltildi!
                </button>
              ) : (
                <button
                  onClick={handleSidebarUpgrade}
                  disabled={upgrading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {upgrading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Yükseltiliyor...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" /> Şimdi Yükselt
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionProvider>
  );
}

