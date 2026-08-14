"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Plus, Search, Eye, Trash2, FileText, ChevronDown, X,
  Receipt, ShoppingCart, Package, Truck, RefreshCw, Building,
  DollarSign, Users, BarChart3, CheckCircle, Clock, AlertCircle,
  ArrowUpRight, ArrowDownLeft, Printer, Download,
  BadgeCheck, Layers, Send,
  Globe, CheckCheck, Banknote, Zap,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const BELGE_TIPLERI_SATIS = [
  { value: "SATIS_FATURA",   label: "Satış Fatura",           icon: Receipt,    color: "blue",   aciklama: "KDV'li satış belgesi" },
  { value: "TEKLIF",         label: "Teklif",                 icon: FileText,   color: "violet", aciklama: "Ön onay teklifi" },
  { value: "SIPARIS",        label: "Sipariş",                icon: ShoppingCart, color: "amber", aciklama: "Sipariş onayı" },
  { value: "IRSALIYE",       label: "İrsaliye",               icon: Truck,      color: "emerald", aciklama: "Mal çıkış belgesi" },
  { value: "KUR_FARKI",      label: "Kur Farkı",              icon: Globe,      color: "sky",    aciklama: "Döviz kur farkı" },
  { value: "MUSTAHSIL",      label: "Müstahsil",              icon: Package,    color: "orange", aciklama: "Çiftçi alım belgesi" },
  { value: "GIDER_PUSULASI", label: "Gider Pusulası",         icon: Banknote,   color: "rose",   aciklama: "Vergi kesen belge" },
  { value: "SMM",            label: "Serbest Meslek Makbuzu", icon: BadgeCheck, color: "purple", aciklama: "SMM belgesi" },
  { value: "KONSINYE",       label: "Konsinye",               icon: Layers,     color: "teal",   aciklama: "Emanet mal" },
  { value: "DEMIRBAS",       label: "Demirbaş",               icon: Building,   color: "slate",  aciklama: "Sabit kıymet" },
  { value: "SATISTAND_IADE", label: "Satıştan İade",          icon: ArrowDownLeft, color: "red", aciklama: "Müşteri iadesi" },
];

const BELGE_TIPLERI_ALIS = [
  { value: "ALIS_FATURA",      label: "Alış Fatura",           icon: Receipt,    color: "indigo", aciklama: "KDV'li alış belgesi" },
  { value: "TEKLIF",           label: "Teklif",                icon: FileText,   color: "violet", aciklama: "Tedarikçi teklifi" },
  { value: "SIPARIS",          label: "Sipariş",               icon: ShoppingCart, color: "amber", aciklama: "Alış siparişi" },
  { value: "IRSALIYE",         label: "İrsaliye",              icon: Truck,      color: "emerald", aciklama: "Mal giriş belgesi" },
  { value: "KUR_FARKI",        label: "Kur Farkı",             icon: Globe,      color: "sky",    aciklama: "Döviz kur farkı" },
  { value: "MUSTAHSIL",        label: "Müstahsil",             icon: Package,    color: "orange", aciklama: "Çiftçi alım belgesi" },
  { value: "GIDER_PUSULASI",   label: "Gider Pusulası",        icon: Banknote,   color: "rose",   aciklama: "Vergi kesen belge" },
  { value: "SMM",              label: "Serbest Meslek Makbuzu", icon: BadgeCheck, color: "purple", aciklama: "SMM belgesi" },
  { value: "KONSINYE",         label: "Konsinye",              icon: Layers,     color: "teal",   aciklama: "Emanet alış" },
  { value: "DEMIRBAS",         label: "Demirbaş",              icon: Building,   color: "slate",  aciklama: "Sabit kıymet alımı" },
  { value: "ALISTANDAN_IADE",  label: "Alıştan İade",          icon: ArrowUpRight, color: "red",  aciklama: "Tedarikçiye iade" },
  { value: "SAC_IRSALIYE",     label: "Sac İrsaliye",          icon: Layers,     color: "zinc",   aciklama: "Metal/sac irsaliyesi" },
];

const KDV_ORANLARI = [0, 1, 8, 10, 18, 20];
const DOVIZ_BIRIMLERI = ["TRY", "USD", "EUR", "GBP", "CHF"];

const MASRAF_MERKEZLERI = [
  { kod: "MKT-100", label: "Pazarlama & Satış",    renk: "#f97316" },
  { kod: "RND-200", label: "Ar & Ge",              renk: "#8b5cf6" },
  { kod: "OPS-300", label: "Operasyon & Lojistik", renk: "#06b6d4" },
  { kod: "ADM-400", label: "Genel Yönetim",        renk: "#64748b" },
  { kod: "URT-500", label: "Üretim",               renk: "#10b981" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  TASLAK:       { label: "Taslak",      color: "text-slate-600",   bg: "bg-slate-100",  dot: "bg-slate-400"  },
  ONAYLANDI:    { label: "Onaylandı",   color: "text-blue-700",    bg: "bg-blue-50",    dot: "bg-blue-500"   },
  GONDERILDI:   { label: "Gönderildi", color: "text-violet-700",  bg: "bg-violet-50",  dot: "bg-violet-500" },
  ODENDI:       { label: "Ödendi",      color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500"},
  KISMI:        { label: "Kısmi",       color: "text-amber-700",   bg: "bg-amber-50",   dot: "bg-amber-500"  },
  VADESI_GECTI: { label: "Vadesi Geçti",color: "text-red-700",    bg: "bg-red-50",     dot: "bg-red-500"    },
  IPTAL:        { label: "İptal",       color: "text-slate-500",   bg: "bg-slate-100",  dot: "bg-slate-300"  },
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface MasrafDagitim { kod: string; oran: number; tutar: number; }
interface FifoItem      { faturaNo: string; tarih: string; kalanTutar: number; eslesme?: number; }

interface Belge {
  id: string;
  belgeTipi: string;
  yonelim: "SATIS" | "ALIS";
  belgeTarih: string;
  belgeNo: string;
  cariId: string;
  cariAd: string;
  islemTutari: number;
  kdvTutar: number;
  genelToplam: number;
  kdvOrani: number;
  iskontoOrani: number;
  doviz: string;
  aciklama: string;
  durum: string;
  kalemler: { id: string; tanim: string; miktar: number; birimFiyat: number; kdvOrani: number; toplam: number }[];
  olusturmaTarih: string;
}

interface CurrentAccount {
  id: string;
  name: string;
  cariKod?: string;
  balance: number;
  taxNo?: string;
  eFaturaDurumu?: boolean;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function fmtCurrency(val: number, doviz = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency", currency: doviz,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(val || 0);
}

function fmtDate(str: string) {
  try {
    return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return str; }
}

function makeBelgeNo(tip: string): string {
  const P: Record<string, string> = {
    SATIS_FATURA: "SAT", ALIS_FATURA: "ALI", TEKLIF: "TKF", SIPARIS: "SIP",
    IRSALIYE: "IRS", KUR_FARKI: "KRF", MUSTAHSIL: "MST", GIDER_PUSULASI: "GID",
    SMM: "SMM", KONSINYE: "KNS", DEMIRBAS: "DMB", SATISTAND_IADE: "STI",
    ALISTANDAN_IADE: "ATI", SAC_IRSALIYE: "SAC",
  };
  const now = new Date();
  return `${P[tip] || "BLG"}${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(Math.floor(Math.random()*90000+10000))}`;
}

function fifoDistribute(toplam: number, list: FifoItem[]): FifoItem[] {
  let rem = toplam;
  return list.map(inv => {
    if (rem <= 0) return { ...inv, eslesme: 0 };
    const eslesme = Math.min(rem, inv.kalanTutar);
    rem -= eslesme;
    return { ...inv, eslesme };
  });
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.TASLAK;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TipIcon({ value, yonelim }: { value: string; yonelim: string }) {
  const list = yonelim === "SATIS" ? BELGE_TIPLERI_SATIS : BELGE_TIPLERI_ALIS;
  const t = list.find(x => x.value === value);
  if (!t) return <FileText className="w-4 h-4 text-slate-400" />;
  const Icon = t.icon;
  const clr: Record<string, string> = {
    blue:"text-blue-500", violet:"text-violet-500", amber:"text-amber-500", emerald:"text-emerald-500",
    sky:"text-sky-500", orange:"text-orange-500", rose:"text-rose-500", purple:"text-purple-500",
    teal:"text-teal-500", slate:"text-slate-500", red:"text-red-500", indigo:"text-indigo-500", zinc:"text-zinc-500",
  };
  return <Icon className={`w-4 h-4 ${clr[t.color] ?? "text-slate-400"}`} />;
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function BelgelerPage() {
  // ── data
  const [belgeler,    setBelgeler]    = useState<Belge[]>([]);
  const [accounts,    setAccounts]    = useState<CurrentAccount[]>([]);
  const [products,    setProducts]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [openInvoices, setOpenInvoices] = useState<FifoItem[]>([]);

  // ── ui
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedBelge,  setSelectedBelge]  = useState<Belge | null>(null);
  const [filterTab,      setFilterTab]      = useState<"HEPSI"|"SATIS"|"ALIS">("HEPSI");
  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [searchQ,        setSearchQ]        = useState("");
  const [tipDropOpen,    setTipDropOpen]    = useState(false);
  const [tipSearch,      setTipSearch]      = useState("");
  const tipDropRef  = useRef<HTMLDivElement>(null);
  const tipInputRef = useRef<HTMLInputElement>(null);

  const [cariDropOpen,   setCariDropOpen]   = useState(false);
  const [cariSearch,     setCariSearch]     = useState("");
  const cariDropRef  = useRef<HTMLDivElement>(null);
  const cariInputRef = useRef<HTMLInputElement>(null);

  const [prodDropOpen,   setProdDropOpen]   = useState(false);
  const prodDropRef  = useRef<HTMLDivElement>(null);

  // ── form
  const [yonelim,      setYonelim]      = useState<"SATIS"|"ALIS">("SATIS");
  const [belgeTipi,    setBelgeTipi]    = useState("SATIS_FATURA");
  const [belgeTarih,   setBelgeTarih]   = useState(() => new Date().toISOString().slice(0,10));
  const [belgeNo,      setBelgeNo]      = useState(() => makeBelgeNo("SATIS_FATURA"));
  const [cariId,       setCariId]       = useState("");
  const [doviz,        setDoviz]        = useState("TRY");
  const [kdvOrani,     setKdvOrani]     = useState(20);
  const [iskonto,      setIskonto]      = useState(0);
  const [tutar,        setTutar]        = useState<number|"">("");
  const [aciklama,     setAciklama]     = useState("");
  const [masraf,       setMasraf]       = useState<MasrafDagitim[]>([
    { kod: "MKT-100", oran: 30, tutar: 0 },
    { kod: "RND-200", oran: 40, tutar: 0 },
    { kod: "OPS-300", oran: 15, tutar: 0 },
    { kod: "ADM-400", oran: 15, tutar: 0 },
  ]);
  const [fifoItems,  setFifoItems]  = useState<FifoItem[]>([]);
  const [saving,     setSaving]     = useState(false);

  // ── computed
  const tutarNum   = typeof tutar === "number" ? tutar : 0;
  const iskontAmt  = tutarNum * (iskonto / 100);
  const netTutar   = tutarNum - iskontAmt;
  const kdvAmt     = netTutar * (kdvOrani / 100);
  const genelTop   = netTutar + kdvAmt;
  const masrafTop  = masraf.reduce((s, m) => s + m.oran, 0);

  const currentTipler = yonelim === "SATIS" ? BELGE_TIPLERI_SATIS : BELGE_TIPLERI_ALIS;
  const seciliBelgeTipi = currentTipler.find(t => t.value === belgeTipi)
    ?? (yonelim === "SATIS" ? BELGE_TIPLERI_ALIS : BELGE_TIPLERI_SATIS).find(t => t.value === belgeTipi);
  const selectedCari = accounts.find(a => a.id === cariId);

  const filteredAccounts = useMemo(() => {
    if (!cariSearch) return accounts;
    const q = cariSearch.toLocaleLowerCase("tr-TR");
    return accounts.filter(acc => 
      acc.name.toLocaleLowerCase("tr-TR").includes(q) ||
      (acc.taxNo && acc.taxNo.includes(q)) ||
      (acc.cariKod && acc.cariKod.toLocaleLowerCase("tr-TR").includes(q))
    );
  }, [accounts, cariSearch]);

  const filteredProducts = useMemo(() => {
    if (!aciklama) return products.slice(0, 10);
    const q = aciklama.toLocaleLowerCase("tr-TR");
    return products.filter(p => 
      p.name.toLocaleLowerCase("tr-TR").includes(q) ||
      (p.sku && p.sku.toLocaleLowerCase("tr-TR").includes(q))
    );
  }, [products, aciklama]);

  const selectProduct = (p: any) => {
    setAciklama(p.name);
    if (p.sale_price) {
      setTutar(Number(p.sale_price));
    } else if (p.price) {
      setTutar(Number(p.price));
    }
    setProdDropOpen(false);
  };

  // ── load data
  const loadBelgeler = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/invoices?status=ALL").catch(() => null);
      if (!res || !res.ok) { setBelgeler([]); return; }
      const data = await res.json().catch(() => []);
      const list: Belge[] = (Array.isArray(data) ? data : []).map((inv: any) => {
        const rawTutar   = Number(inv.totalAmount || 0) - Number(inv.taxAmount || 0);
        const rawKdv     = Number(inv.taxAmount || 0);
        const rawTotal   = Number(inv.totalAmount || 0);
        const dir: "SATIS"|"ALIS" = (inv.type === "ALIS" || inv.type === "ALIS_FATURA") ? "ALIS" : "SATIS";
        return {
          id: inv.id,
          belgeTipi: dir === "SATIS" ? (inv.type === "SATIS" ? "SATIS_FATURA" : inv.type) : (inv.type === "ALIS" ? "ALIS_FATURA" : inv.type),
          yonelim: dir,
          belgeTarih: inv.date,
          belgeNo: inv.externalLink || `#${inv.id.slice(-8).toUpperCase()}`,
          cariId: inv.currentAccountId,
          cariAd: inv.currentAccount?.name || "-",
          islemTutari: rawTutar,
          kdvTutar: rawKdv,
          genelToplam: rawTotal,
          kdvOrani: 20,
          iskontoOrani: 0,
          doviz: "TRY",
          aciklama: inv.notes || "",
          durum: inv.status,
          kalemler: (inv.invoiceItems || []).map((item: any) => ({
            id: item.id, tanim: item.name, miktar: item.quantity,
            birimFiyat: Number(item.unitPrice), kdvOrani: item.vatRate, toplam: Number(item.totalAmount),
          })),
          olusturmaTarih: inv.date,
        };
      });
      setBelgeler(list);
      const openFifo: FifoItem[] = list
        .filter(b => b.durum !== "ODENDI" && b.durum !== "IPTAL")
        .slice(0, 8)
        .map(b => ({ faturaNo: b.belgeNo, tarih: b.belgeTarih, kalanTutar: b.genelToplam }));
      setOpenInvoices(openFifo);
    } catch {
      setBelgeler([]);
    } finally { setLoading(false); }
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounting/current-accounts").catch(() => null);
      if (res && res.ok) { const d = await res.json().catch(() => []); setAccounts(Array.isArray(d) ? d : []); }
    } catch {}
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products").catch(() => null);
      if (res && res.ok) { const d = await res.json().catch(() => []); setProducts(Array.isArray(d) ? d : []); }
    } catch {}
  }, []);

  useEffect(() => { loadBelgeler(); loadAccounts(); loadProducts(); }, [loadBelgeler, loadAccounts, loadProducts]);

  // ── close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (tipDropRef.current && !tipDropRef.current.contains(e.target as Node)) {
        setTipDropOpen(false);
      }
      if (cariDropRef.current && !cariDropRef.current.contains(e.target as Node)) {
        setCariDropOpen(false);
      }
      if (prodDropRef.current && !prodDropRef.current.contains(e.target as Node)) {
        setProdDropOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── recalc masraf tutarları
  useEffect(() => {
    setMasraf(prev => prev.map(m => ({ ...m, tutar: (genelTop * m.oran) / 100 })));
  }, [genelTop]);

  // ── recalc FIFO
  useEffect(() => {
    if (openInvoices.length > 0 && genelTop > 0) {
      setFifoItems(fifoDistribute(genelTop, openInvoices));
    } else {
      setFifoItems([]);
    }
  }, [genelTop, openInvoices]);

  // ── open drawer
  const openDrawer = (dir: "SATIS"|"ALIS") => {
    setYonelim(dir);
    const defaultTip = dir === "SATIS" ? "SATIS_FATURA" : "ALIS_FATURA";
    setBelgeTipi(defaultTip);
    setBelgeNo(makeBelgeNo(defaultTip));
    setBelgeTarih(new Date().toISOString().slice(0,10));
    setCariId(""); setDoviz("TRY"); setKdvOrani(20); setIskonto(0);
    setTutar(""); setAciklama("");
    setTipDropOpen(false); setTipSearch("");
    setCariDropOpen(false); setCariSearch("");
    setProdDropOpen(false);
    setDrawerOpen(true);
  };

  // ── change belge tipi
  const changeTip = (val: string, dir: "SATIS"|"ALIS") => {
    setBelgeTipi(val);
    setYonelim(dir);
    setBelgeNo(makeBelgeNo(val));
    setTipDropOpen(false);
    setTipSearch("");
  };

  // ── update masraf oran
  const updateMasraf = (idx: number, oran: number) => {
    setMasraf(prev => prev.map((m, i) => i === idx ? { ...m, oran, tutar: (genelTop * oran) / 100 } : m));
  };

  // ── save
  const handleSave = async (approve = false) => {
    if (!cariId)      { toast.error("Lütfen cari hesap seçin"); return; }
    if (tutarNum <= 0){ toast.error("İşlem tutarı 0'dan büyük olmalı"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentAccountId: cariId,
          date:      belgeTarih,
          dueDate:   belgeTarih,
          type:      yonelim === "SATIS" ? "SATIS" : "ALIS",
          status:    approve ? "ONAYLANDI" : "TASLAK",
          notes:     `[${belgeTipi}] ${aciklama}`.trim(),
          taxAmount:    kdvAmt,
          totalAmount:  genelTop,
          items: [{
            name:       aciklama || `${seciliBelgeTipi?.label ?? belgeTipi} İşlemi`,
            quantity:   1,
            unitPrice:  tutarNum,
            vatRate:    kdvOrani,
            totalAmount: genelTop,
          }],
        }),
      });
      if (res.ok) {
        toast.success(approve ? "Belge onaylandı ve kaydedildi!" : "Belge taslak olarak kaydedildi.");
        setDrawerOpen(false);
        loadBelgeler();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Kayıt başarısız.");
      }
    } catch { toast.error("Bağlantı hatası."); }
    finally { setSaving(false); }
  };

  // ── delete
  const handleDelete = async (id: string) => {
    if (!confirm("Belgeyi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/accounting/invoices/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Belge silindi."); loadBelgeler(); }
    else toast.error("Silme başarısız.");
  };

  // ── filtered list
  const filtered = useMemo(() => belgeler.filter(b => {
    if (filterTab !== "HEPSI" && b.yonelim !== filterTab) return false;
    if (filterStatus !== "ALL"  && b.durum  !== filterStatus) return false;
    const q = searchQ.toLowerCase();
    if (q && !b.cariAd.toLowerCase().includes(q) && !b.belgeNo.toLowerCase().includes(q)) return false;
    return true;
  }), [belgeler, filterTab, filterStatus, searchQ]);

  // ── stats
  const stats = useMemo(() => ({
    toplam:       belgeler.reduce((s, b) => s + b.genelToplam, 0),
    satis:        belgeler.filter(b => b.yonelim === "SATIS").reduce((s, b) => s + b.genelToplam, 0),
    alis:         belgeler.filter(b => b.yonelim === "ALIS").reduce((s, b) => s + b.genelToplam, 0),
    odenmis:      belgeler.filter(b => b.durum === "ODENDI").length,
    bekleyen:     belgeler.filter(b => b.durum === "TASLAK" || b.durum === "ONAYLANDI").length,
    vadesiGecmis: belgeler.filter(b => b.durum === "VADESI_GECTI").length,
  }), [belgeler]);

  // ── tip dropdown filter
  const filteredSatis = useMemo(() => {
    const q = tipSearch.toLowerCase();
    return BELGE_TIPLERI_SATIS.filter(t => t.label.toLowerCase().includes(q) || t.aciklama.toLowerCase().includes(q));
  }, [tipSearch]);

  const filteredAlis = useMemo(() => {
    const q = tipSearch.toLowerCase();
    return BELGE_TIPLERI_ALIS.filter(t => t.label.toLowerCase().includes(q) || t.aciklama.toLowerCase().includes(q));
  }, [tipSearch]);

  const noTipResults = filteredSatis.length === 0 && filteredAlis.length === 0;

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* HEADER */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Belge Yönetimi</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Satış & Alış Belgesi · Masraf Dağıtımı · FIFO Kapatma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openDrawer("ALIS")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Alış Belgesi
            </button>
            <button onClick={() => openDrawer("SATIS")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition shadow-sm shadow-orange-500/20">
              <Plus className="w-3.5 h-3.5" /> Satış Belgesi
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Toplam Hacim",  val: fmtCurrency(stats.toplam), icon: BarChart3,    clr: "text-slate-500"   },
          { label: "Satış",         val: fmtCurrency(stats.satis),  icon: ArrowUpRight, clr: "text-emerald-500" },
          { label: "Alış",          val: fmtCurrency(stats.alis),   icon: ArrowDownLeft,clr: "text-orange-500"  },
          { label: "Ödendi",        val: String(stats.odenmis),     icon: CheckCircle,  clr: "text-emerald-500" },
          { label: "Bekleyen",      val: String(stats.bekleyen),    icon: Clock,        clr: "text-amber-500"   },
          { label: "Vadesi Geçti",  val: String(stats.vadesiGecmis),icon: AlertCircle,  clr: "text-red-500"     },
        ].map(({ label, val, icon: Icon, clr }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
              <Icon className={`w-3.5 h-3.5 ${clr}`} />
            </div>
            <p className="text-base font-black text-slate-900 truncate">{val}</p>
          </div>
        ))}
      </div>

      {/* TABLE CARD */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            {(["HEPSI","SATIS","ALIS"] as const).map(t => (
              <button key={t} onClick={() => setFilterTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterTab===t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {t === "HEPSI" ? "Tümü" : t === "SATIS" ? "Satış" : "Alış"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full sm:max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Cari veya belge no ara..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-2 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Belge Tipi","Belge No / Tarih","Cari Hesap","Yön","Durum","Tutar","İşlemler"].map((h,i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ${i >= 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-xs text-slate-400">Yükleniyor...</p>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                      <FileText className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">Belge bulunamadı</p>
                    <p className="text-xs text-slate-300">Yeni belge oluşturmak için butonu kullanın</p>
                  </div>
                </td></tr>
              ) : filtered.map(belge => (
                <tr key={belge.id}
                  className="hover:bg-orange-50/30 transition cursor-pointer"
                  onClick={() => { setSelectedBelge(belge); setViewDrawerOpen(true); }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                        <TipIcon value={belge.belgeTipi} yonelim={belge.yonelim} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {(belge.yonelim === "SATIS" ? BELGE_TIPLERI_SATIS : BELGE_TIPLERI_ALIS).find(t => t.value === belge.belgeTipi)?.label ?? belge.belgeTipi}
                        </p>
                        <p className="text-[10px] text-slate-400">{belge.doviz}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-bold text-slate-800 font-mono">{belge.belgeNo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{fmtDate(belge.belgeTarih)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs font-semibold text-slate-800">{belge.cariAd}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${belge.yonelim === "SATIS" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                      {belge.yonelim === "SATIS" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                      {belge.yonelim}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={belge.durum} /></td>
                  <td className="px-4 py-3.5 text-right">
                    <p className="text-sm font-black text-slate-900">{fmtCurrency(belge.genelToplam)}</p>
                    <p className="text-[10px] text-slate-400">KDV dahil</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setSelectedBelge(belge); setViewDrawerOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Görüntüle">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(belge.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400">{filtered.length} belge</p>
            <p className="text-xs font-bold text-slate-700">
              Toplam: {fmtCurrency(filtered.reduce((s, b) => s + b.genelToplam, 0))}
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          YENİ BELGE DRAWER
      ══════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[900] flex">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col">

            {/* header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r ${yonelim === "SATIS" ? "from-blue-600 to-blue-700" : "from-slate-700 to-slate-800"}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  {yonelim === "SATIS" ? <ArrowUpRight className="w-5 h-5 text-white" /> : <ArrowDownLeft className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">
                    {yonelim === "SATIS" ? "Satış Belgesi" : "Alış Belgesi"}: {seciliBelgeTipi?.label ?? belgeTipi}
                  </h2>
                  <p className="text-[11px] text-white/70 mt-0.5">{seciliBelgeTipi?.aciklama}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* BELGE TİPİ */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Belge Türü</label>
                <div className="relative" ref={tipDropRef}>
                  <button type="button"
                    onClick={() => {
                      const next = !tipDropOpen;
                      setTipDropOpen(next);
                      if (next) { setTipSearch(""); setTimeout(() => tipInputRef.current?.focus(), 60); }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-slate-200 hover:border-blue-400 rounded-xl text-sm font-bold text-slate-800 transition focus:outline-none focus:border-blue-500">
                    <div className="flex items-center gap-2.5">
                      {seciliBelgeTipi && (
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                          <seciliBelgeTipi.icon className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <span>{seciliBelgeTipi?.label ?? "Belge türü seçin"}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${tipDropOpen ? "rotate-180" : ""}`} />
                  </button>

                  {tipDropOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      {/* arama */}
                      <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            ref={tipInputRef}
                            type="text"
                            value={tipSearch}
                            onChange={e => setTipSearch(e.target.value)}
                            placeholder="Belge türü ara... (örn: fatura, irsaliye)"
                            className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
                          />
                          {tipSearch && (
                            <button type="button" onClick={() => setTipSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* sonuçlar */}
                      {noTipResults ? (
                        <div className="p-6 text-center">
                          <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-400">Sonuç bulunamadı</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">&quot;{tipSearch}&quot; ile eşleşen tür yok</p>
                        </div>
                      ) : (
                        <div className="max-h-72 overflow-y-auto">
                          {filteredSatis.length > 0 && (
                            <div className="p-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Satış Belgeleri</span>
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 text-[9px] font-bold rounded">{filteredSatis.length}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {filteredSatis.map(tip => {
                                  const Icon = tip.icon;
                                  const sel = belgeTipi === tip.value && yonelim === "SATIS";
                                  return (
                                    <button key={tip.value} onClick={() => changeTip(tip.value, "SATIS")}
                                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${sel ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}>
                                      <Icon className="w-3.5 h-3.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="truncate">{tip.label}</p>
                                        {tipSearch && <p className="text-[9px] text-slate-400 truncate">{tip.aciklama}</p>}
                                      </div>
                                      {sel && <CheckCheck className="w-3 h-3 ml-auto shrink-0 text-blue-500" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {filteredSatis.length > 0 && filteredAlis.length > 0 && <div className="mx-3 border-t border-slate-100" />}
                          {filteredAlis.length > 0 && (
                            <div className="p-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Alış Belgeleri</span>
                                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-500 text-[9px] font-bold rounded">{filteredAlis.length}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {filteredAlis.map(tip => {
                                  const Icon = tip.icon;
                                  const sel = belgeTipi === tip.value && yonelim === "ALIS";
                                  return (
                                    <button key={`a-${tip.value}`} onClick={() => changeTip(tip.value, "ALIS")}
                                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${sel ? "bg-orange-50 text-orange-700" : "hover:bg-slate-50 text-slate-600"}`}>
                                      <Icon className="w-3.5 h-3.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="truncate">{tip.label}</p>
                                        {tipSearch && <p className="text-[9px] text-slate-400 truncate">{tip.aciklama}</p>}
                                      </div>
                                      {sel && <CheckCheck className="w-3 h-3 ml-auto shrink-0 text-orange-500" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* TEMEL BİLGİLER */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Belge Tarihi</label>
                  <input type="date" value={belgeTarih} onChange={e => setBelgeTarih(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Belge / Fiş No</label>
                  <input type="text" value={belgeNo} onChange={e => setBelgeNo(e.target.value)} placeholder="#SAT202600001"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" />
                </div>
              </div>

              {/* CARİ HESAP */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Cari Hesap <span className="text-red-500">*</span>
                  {selectedCari?.eFaturaDurumu && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded">e-FATURA</span>
                  )}
                </label>
                <div className="relative" ref={cariDropRef}>
                  <button type="button"
                    onClick={() => {
                      const next = !cariDropOpen;
                      setCariDropOpen(next);
                      if (next) { setCariSearch(""); setTimeout(() => cariInputRef.current?.focus(), 60); }
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-sm font-semibold text-slate-800 transition focus:outline-none focus:border-blue-500 text-left">
                    <span className={selectedCari ? "text-slate-900 truncate" : "text-slate-400 truncate"}>
                      {selectedCari ? `${selectedCari.name}${selectedCari.taxNo ? ` (VKN: ${selectedCari.taxNo})` : ""}` : "— Cari hesap seçin —"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${cariDropOpen ? "rotate-180" : ""}`} />
                  </button>

                  {cariDropOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      {/* arama */}
                      <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            ref={cariInputRef}
                            type="text"
                            value={cariSearch}
                            onChange={e => setCariSearch(e.target.value)}
                            placeholder="Cari hesap veya VKN ara..."
                            className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition"
                          />
                          {cariSearch && (
                            <button type="button" onClick={() => setCariSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* sonuçlar */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredAccounts.length === 0 ? (
                          <div className="p-6 text-center">
                            <Search className="w-6 h-6 text-slate-200 mx-auto mb-1.5" />
                            <p className="text-xs font-semibold text-slate-400">Sonuç bulunamadı</p>
                            <p className="text-[10px] text-slate-300 mt-0.5">&quot;{cariSearch}&quot; ile eşleşen cari yok</p>
                          </div>
                        ) : (
                          <div className="p-1">
                            {filteredAccounts.map(acc => {
                              const isSelected = acc.id === cariId;
                              return (
                                <button
                                  key={acc.id}
                                  type="button"
                                  onClick={() => {
                                    setCariId(acc.id);
                                    setCariDropOpen(false);
                                    setCariSearch("");
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition text-left ${isSelected ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-50 text-slate-600"}`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="truncate text-slate-800 font-semibold">{acc.name}</p>
                                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                                      {acc.taxNo ? `VKN: ${acc.taxNo} • ` : ""}
                                      Bakiye: {fmtCurrency(acc.balance)}
                                    </p>
                                  </div>
                                  {isSelected && <CheckCheck className="w-3.5 h-3.5 shrink-0 text-blue-500" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedCari && (
                  <div className="mt-2 flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-7 h-7 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{selectedCari.name}</p>
                      <p className="text-[10px] text-slate-400">Bakiye: {fmtCurrency(selectedCari.balance)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* İŞLEM TUTARI */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  İşlem Tutarı ({doviz}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min={0} step="0.01"
                  value={tutar}
                  onChange={e => setTutar(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 rounded-xl text-xl font-black text-slate-900 focus:outline-none transition"
                />
              </div>

              {/* KDV + İSKONTO + DÖVİZ */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">KDV Oranı</label>
                  <select value={kdvOrani} onChange={e => setKdvOrani(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {KDV_ORANLARI.map(k => <option key={k} value={k}>%{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">İskonto (%)</label>
                  <input type="number" min={0} max={100} value={iskonto}
                    onChange={e => setIskonto(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Döviz</label>
                  <select value={doviz} onChange={e => setDoviz(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {DOVIZ_BIRIMLERI.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* ÜRÜN/HİZMET AÇIKLAMASI */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Ürün / Hizmet Açıklaması</label>
                <div className="relative" ref={prodDropRef}>
                  <input
                    type="text"
                    value={aciklama}
                    onFocus={() => setProdDropOpen(true)}
                    onChange={e => {
                      setAciklama(e.target.value);
                      setProdDropOpen(true);
                    }}
                    placeholder="Ürün veya hizmet adı..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  
                  {prodDropOpen && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                      <div className="p-1">
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProduct(p)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 transition text-left"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">SKU: {p.sku || "N/A"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-blue-600">{fmtCurrency(p.sale_price || p.price || 0)}</p>
                              {p.stock !== undefined && (
                                <p className="text-[9px] text-slate-400 mt-0.5">Stok: {p.stock} Adet</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {prodDropOpen && filteredProducts.length === 0 && aciklama && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 text-center">
                      <p className="text-xs text-slate-400 font-semibold">Özel açıklama tanımlanıyor</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">Sistemde eşleşen ürün bulunamadı, serbest metin olarak kaydedilecek.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TUTAR ÖZETİ */}
              {tutarNum > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>İşlem Tutarı</span>
                    <span className="font-bold text-slate-700">{fmtCurrency(tutarNum, doviz)}</span>
                  </div>
                  {iskonto > 0 && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>İskonto (%{iskonto})</span>
                      <span className="font-bold">-{fmtCurrency(iskontAmt, doviz)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Net Tutar</span>
                    <span className="font-bold text-slate-700">{fmtCurrency(netTutar, doviz)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>KDV (%{kdvOrani})</span>
                    <span className="font-bold text-slate-700">{fmtCurrency(kdvAmt, doviz)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900">
                    <span className="text-sm">Genel Toplam</span>
                    <span className="text-base text-blue-600">{fmtCurrency(genelTop, doviz)}</span>
                  </div>
                </div>
              )}

              {/* MASRAF MERKEZİ DAĞITIMI */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Masraf Merkezleri Dağıtımı</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Toplam: %{masrafTop}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${masrafTop === 100 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {masrafTop === 100 ? "✓ %100" : `%${masrafTop} / 100`}
                  </span>
                </div>
                <div className="space-y-3">
                  {masraf.map((m, idx) => {
                    const mc = MASRAF_MERKEZLERI.find(x => x.kod === m.kod);
                    return (
                      <div key={m.kod} className="bg-white border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mc?.renk }} />
                            <span className="text-xs font-bold text-slate-700">{mc?.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({m.kod})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">{fmtCurrency((genelTop * m.oran) / 100, doviz)}</span>
                            <input type="number" min={0} max={100} value={m.oran}
                              onChange={e => updateMasraf(idx, parseInt(e.target.value) || 0)}
                              className="w-14 text-center text-xs font-black text-slate-800 border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            <span className="text-xs text-slate-500">%</span>
                          </div>
                        </div>
                        <input type="range" min={0} max={100} value={m.oran}
                          onChange={e => updateMasraf(idx, parseInt(e.target.value))}
                          className="w-full h-2 rounded-full cursor-pointer"
                          style={{ accentColor: mc?.renk ?? "#f97316" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FIFO KAPATMA — her iki yönde de göster */}
              {fifoItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-3.5 h-3.5 text-violet-500" />
                    <p className="text-xs font-bold text-slate-700">FIFO Fatura Kapatma Dağılımı</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-3 py-2 text-left text-[10px] text-slate-400 font-bold">Fatura No</th>
                          <th className="px-3 py-2 text-right text-[10px] text-slate-400 font-bold">Kalan Tutar</th>
                          <th className="px-3 py-2 text-right text-[10px] text-slate-400 font-bold">Eşleşme</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {fifoItems.map((fi, i) => (
                          <tr key={i} className={(fi.eslesme ?? 0) > 0 ? "bg-violet-50/40" : ""}>
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-slate-800 font-mono">{fi.faturaNo}</p>
                              <p className="text-[10px] text-slate-400">{fmtDate(fi.tarih)}</p>
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-slate-600">
                              {fmtCurrency(fi.kalanTutar)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {(fi.eslesme ?? 0) > 0
                                ? <span className="font-black text-violet-600">{fmtCurrency(fi.eslesme ?? 0)}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-3 py-2 bg-violet-50 border-t border-violet-100 flex items-start gap-2">
                      <Zap className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-violet-600 leading-relaxed">
                        FIFO dağıtımı en eski belgeden başlayarak otomatik bakiye tüketimi yapar.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <button onClick={() => setDrawerOpen(false)}
                className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition">
                İptal
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSave(false)} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Taslak Kaydet
                </button>
                <button onClick={() => handleSave(true)} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition shadow-sm shadow-orange-500/20 disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" />
                  Onayla & Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DETAY DRAWER
      ══════════════════════════════════════════════════════ */}
      {viewDrawerOpen && selectedBelge && (
        <div className="fixed inset-0 z-[900] flex">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setViewDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col">
            {/* header */}
            <div className="px-6 py-4 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <TipIcon value={selectedBelge.belgeTipi} yonelim={selectedBelge.yonelim} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">{selectedBelge.belgeNo}</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedBelge.cariAd}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedBelge.durum} />
                <button onClick={() => setViewDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Belge Tipi", v: (selectedBelge.yonelim === "SATIS" ? BELGE_TIPLERI_SATIS : BELGE_TIPLERI_ALIS).find(t => t.value === selectedBelge.belgeTipi)?.label ?? selectedBelge.belgeTipi },
                  { l: "Yönelim",    v: selectedBelge.yonelim },
                  { l: "Tarih",      v: fmtDate(selectedBelge.belgeTarih) },
                  { l: "Döviz",      v: selectedBelge.doviz },
                ].map(({ l, v }) => (
                  <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{l}</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-3">Tutar Özeti</p>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">İşlem Tutarı</span>
                  <span className="font-bold text-slate-800">{fmtCurrency(selectedBelge.islemTutari)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">KDV</span>
                  <span className="font-bold text-slate-800">{fmtCurrency(selectedBelge.kdvTutar)}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-slate-900">
                  <span className="text-sm">Genel Toplam</span>
                  <span className="text-orange-600">{fmtCurrency(selectedBelge.genelToplam)}</span>
                </div>
              </div>

              {selectedBelge.kalemler.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">Kalemler</p>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-3 py-2 text-left font-bold text-slate-500">Tanım</th>
                          <th className="px-3 py-2 text-right font-bold text-slate-500">Miktar</th>
                          <th className="px-3 py-2 text-right font-bold text-slate-500">Birim F.</th>
                          <th className="px-3 py-2 text-right font-bold text-slate-500">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {selectedBelge.kalemler.map((k, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-700">{k.tanim}</td>
                            <td className="px-3 py-2 text-right text-slate-500">{k.miktar}</td>
                            <td className="px-3 py-2 text-right text-slate-500">{fmtCurrency(k.birimFiyat)}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">{fmtCurrency(k.toplam)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedBelge.aciklama && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide mb-1">Not / Açıklama</p>
                  <p className="text-xs text-amber-800">{selectedBelge.aciklama}</p>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition">
                <Printer className="w-3.5 h-3.5" /> Yazdır
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs transition">
                <Download className="w-3.5 h-3.5" /> PDF İndir
              </button>
              <button onClick={() => handleDelete(selectedBelge.id)}
                className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

