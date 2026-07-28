"use client";

import { useState, useEffect } from "react";
import {
  Receipt, Plus, Search, Download, Eye, X,
  Loader2, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle,
  FileSpreadsheet, FileText, Banknote, Calendar, User, ChevronDown,
  TrendingDown, TrendingUp, Tag, Trash2, Printer
} from "lucide-react";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdf-export";

interface Invoice {
  id: string;
  currentAccount: { id: string; name: string };
  date: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
  type: string;
  notes?: string;
  items?: { description: string; quantity: number; unitPrice: number; taxRate: number }[];
  invoiceItems?: { id: string; name: string; quantity: number; unitPrice: number; vatRate: number; totalAmount: number }[];
}

interface CurrentAccount { id: string; name: string; taxNo?: string; tckn?: string; cariTipi?: string; }

const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  TASLAK:       { label: "Taslak",        cls: "bg-gray-100 text-gray-600 border-gray-200",         icon: AlertCircle  },
  GONDERILDI:   { label: "Gönderildi",    cls: "bg-blue-50 text-blue-700 border-blue-200",           icon: Clock        },
  ODENDI:       { label: "Ödendi",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: CheckCircle2 },
  IPTAL:        { label: "İptal",         cls: "bg-red-50 text-red-700 border-red-200",              icon: XCircle      },
  VADESI_GECTI: { label: "Vadesi Geçti",  cls: "bg-amber-50 text-amber-700 border-amber-200",        icon: AlertCircle  },
};

const TYPE_MAP: Record<string, string> = { SATIS: "Satış", ALIS: "Alış", IADE: "İade" };
const TAX_RATES = [0, 1, 8, 10, 18, 20];
const PAYMENT_METHODS = ["NAKIT", "BANKA_TRANSFER", "KREDI_KARTI", "CEK", "SENET"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<CurrentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | string[]; type: "invoice"; label: string } | null>(null);
  const [isPreviewingGib, setIsPreviewingGib] = useState(false);

  // Helper: parse currency from notes
  const parseCurrency = (notes?: string) => notes?.match(/\[Para:\s*([A-Z]+)/)?.[1] || "TRY";
  const currencySymbol = (cur: string) => cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : "₺";
  const fmtAmount = (amount: number, notes?: string) => {
    const cur = parseCurrency(notes);
    return `${currencySymbol(cur)}${Number(amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
  };

  const [activeDropdownIdx, setActiveDropdownIdx] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productsList, setProductsList] = useState<any[]>([]);
  const [gibStatus, setGibStatus] = useState<"LOADING" | "EFATURA" | "EARSIV" | "NO_VKN" | null>(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [rateSource, setRateSource] = useState<"TCMB" | "FRANKFURTER" | "FALLBACK" | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);

  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    currentAccountId: "",
    type: "SATIS",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: "",
    taxRate: 20,
    items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 20, discountValue: 0, discountType: "PERCENT" as "PERCENT" | "AMOUNT" }],
    currency: "TRY",
    exchangeRate: 1,
    paymentMethod: "CARI_HESAP",
    invoiceNumber: "",
    // e-Fatura meta fields
    efaturaSenaryo: "TEMELFATURA",
    efaturaTip: "SATIS",
    efaturaGonder: false,
    efaturaOdemeVadeTarihi: "",
    efaturaOdemeSekli: "",
    efaturaOdemeAraciKurum: "",
    efaturaTasiyiciFirma: "",
    efaturaTasiyiciVKN: "",
    efaturaGonderimTarihi: new Date().toISOString().split("T")[0],
    efaturaSatisWebSitesi: typeof window !== "undefined" ? window.location.origin : "",
  });
  const [showEfaturaPanel, setShowEfaturaPanel] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/accounting/invoices?${params}`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
      setSelectedIds([]); // Clear selection state when list changes
    } catch {
      toast.error("Faturalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/dealers");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.dealers ?? [];
      setAccounts(list.map((d: any) => ({ 
        id: d.id, 
        name: d.name,
        taxNo: d.taxNo || "",
        tckn: d.tckn || "",
        cariTipi: d.cariTipi || "CORPORATE"
      })));
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProductsList(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchExchangeRate = async (currency: string) => {
    if (currency === "TRY") {
      setNewInvoice(p => ({ ...p, exchangeRate: 1 }));
      setRateSource(null);
      setRateDate(null);
      return;
    }
    setIsFetchingRate(true);
    try {
      const res = await fetch(`/api/exchange-rate?currency=${currency}`);
      if (res.ok) {
        const data = await res.json();
        setNewInvoice(p => ({ ...p, exchangeRate: data.rate ?? 1 }));
        setRateSource(data.source ?? null);
        setRateDate(data.date ?? null);
      }
    } catch {
      // Hata durumunda mevcut kur korunur
    } finally {
      setIsFetchingRate(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [statusFilter, typeFilter]);
  useEffect(() => { 
    fetchAccounts(); 
    fetchProducts();
  }, []);

  // Auto-fetch exchange rate when currency changes
  useEffect(() => {
    fetchExchangeRate(newInvoice.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newInvoice.currency]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isNewModalOpen) setIsNewModalOpen(false);
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        if (deleteTarget) setDeleteTarget(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isNewModalOpen && !saving) {
        document.getElementById("invoice-submit-btn")?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isNewModalOpen, isDetailModalOpen, deleteTarget, saving]);

  // Body scroll lock when any modal is open
  useEffect(() => {
    const anyOpen = isNewModalOpen || isDetailModalOpen || !!deleteTarget;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isNewModalOpen, isDetailModalOpen, deleteTarget]);

  useEffect(() => {
    const checkGib = async () => {
      if (!newInvoice.currentAccountId) {
        setGibStatus(null);
        return;
      }
      const acc = accounts.find(a => a.id === newInvoice.currentAccountId);
      if (!acc) {
        setGibStatus(null);
        return;
      }
      
      const vkn = (acc.taxNo || "").trim().replace(/\s/g, "");
      if (vkn.length === 10) {
        setGibStatus("LOADING");
        try {
          const res = await fetch(`/api/integrations/gib-sorgu?vkn=${vkn}`);
          if (res.ok) {
            const data = await res.json();
            if (data.efatura) {
              setGibStatus("EFATURA");
              return;
            }
          }
        } catch {}
      }
      setGibStatus("EARSIV");
    };
    checkGib();
  }, [newInvoice.currentAccountId, accounts]);

  const getCurrencySymbol = (cur: string) => {
    if (cur === "USD") return "$";
    if (cur === "EUR") return "€";
    return "₺";
  };

  // Computed items
  const addItem = () => setNewInvoice(prev => ({
    ...prev,
    items: [...prev.items, { description: "", quantity: 1, unitPrice: 0, taxRate: prev.taxRate, discountValue: 0, discountType: "PERCENT" }]
  }));

  const removeItem = (idx: number) => setNewInvoice(prev => ({
    ...prev,
    items: prev.items.filter((_, i) => i !== idx)
  }));

  const updateItem = (idx: number, field: string, val: any) => setNewInvoice(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === idx ? { ...item, [field]: val } : item)
  }));

  const calcItemGross = (it: any) => it.quantity * it.unitPrice;
  const calcItemDiscount = (it: any) => {
    const sub = it.quantity * it.unitPrice;
    const discountVal = Number(it.discountValue) || 0;
    return it.discountType === "PERCENT" ? sub * (discountVal / 100) : discountVal;
  };
  const calcItemNet = (it: any) => {
    const sub = it.quantity * it.unitPrice;
    const disc = calcItemDiscount(it);
    return Math.max(0, sub - disc);
  };
  const calcItemTax = (it: any) => {
    const net = calcItemNet(it);
    return net * (it.taxRate || 0) / 100;
  };

  const calcSubtotal = () => newInvoice.items.reduce((s, it) => s + calcItemGross(it), 0);
  const calcTotalDiscount = () => newInvoice.items.reduce((s, it) => s + calcItemDiscount(it), 0);
  const calcTax = () => newInvoice.items.reduce((s, it) => s + calcItemTax(it), 0);
  const calcTotal = () => calcSubtotal() - calcTotalDiscount() + calcTax();

  // Filters
  const filtered = invoices.filter((inv) => {
    const matchesSearch = inv.currentAccount?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchesDate = (!dateFrom || new Date(inv.date) >= new Date(dateFrom)) &&
      (!dateTo || new Date(inv.date) <= new Date(dateTo));
    return matchesSearch && matchesDate;
  });

  const totalAmount   = filtered.reduce((s, i) => s + Number(i.totalAmount), 0);
  const paidAmount    = filtered.filter(i => i.status === "ODENDI").reduce((s, i) => s + Number(i.totalAmount), 0);
  const pendingAmount = totalAmount - paidAmount;
  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.currentAccountId) { toast.error("Cari hesap seçiniz"); return; }
    if (newInvoice.items.some(it => !it.description || it.unitPrice <= 0)) {
      toast.error("Tüm fatura kalemlerini doldurunuz"); return;
    }
    // Validate due date >= invoice date
    if (new Date(newInvoice.dueDate) < new Date(newInvoice.date)) {
      toast.error("Vade tarihi, fatura tarihinden önce olamaz"); return;
    }
    setSaving(true);
    try {
      let formattedNotes = newInvoice.notes || "";
      if (newInvoice.currency !== "TRY") {
        formattedNotes += (formattedNotes ? " | " : "") + `[Para: ${newInvoice.currency} - Kur: ${newInvoice.exchangeRate}]`;
      }
      formattedNotes += (formattedNotes ? " | " : "") + `[Ödeme: ${newInvoice.paymentMethod}]`;
      if (newInvoice.invoiceNumber) {
        formattedNotes += (formattedNotes ? " | " : "") + `[Seri No: ${newInvoice.invoiceNumber}]`;
      }
      if (gibStatus) {
        formattedNotes += (formattedNotes ? " | " : "") + `[Fatura Tipi: ${gibStatus}]`;
      }
      // e-Fatura metadata
      formattedNotes += (formattedNotes ? " | " : "") + `[eF-Senaryo: ${newInvoice.efaturaSenaryo}]`;
      formattedNotes += (formattedNotes ? " | " : "") + `[eF-Tip: ${newInvoice.efaturaTip}]`;
      if (newInvoice.efaturaGonder) formattedNotes += " | [eF-Gonder: EVET]";
      if (newInvoice.efaturaOdemeVadeTarihi) formattedNotes += ` | [eF-OdemeVade: ${newInvoice.efaturaOdemeVadeTarihi}]`;
      if (newInvoice.efaturaOdemeSekli) formattedNotes += ` | [eF-OdemeSekli: ${newInvoice.efaturaOdemeSekli}]`;
      if (newInvoice.efaturaOdemeAraciKurum) formattedNotes += ` | [eF-OdemeArac: ${newInvoice.efaturaOdemeAraciKurum}]`;
      if (newInvoice.efaturaTasiyiciFirma) formattedNotes += ` | [eF-Tasiyici: ${newInvoice.efaturaTasiyiciFirma}]`;
      if (newInvoice.efaturaTasiyiciVKN) formattedNotes += ` | [eF-TasiyiciVKN: ${newInvoice.efaturaTasiyiciVKN}]`;
      if (newInvoice.efaturaGonderimTarihi) formattedNotes += ` | [eF-Gonderim: ${newInvoice.efaturaGonderimTarihi}]`;
      if (newInvoice.efaturaSatisWebSitesi) formattedNotes += ` | [eF-WebSite: ${newInvoice.efaturaSatisWebSitesi}]`;

      const body = {
        currentAccountId: newInvoice.currentAccountId,
        type: newInvoice.type,
        date: new Date(newInvoice.date).toISOString(),
        dueDate: new Date(newInvoice.dueDate).toISOString(),
        notes: formattedNotes,
        status: "TASLAK",
        totalAmount: calcTotal(),
        taxAmount: calcTax(),
        items: newInvoice.items.map(it => {
          const itemNet = calcItemNet(it);
          const itemNetUnitPrice = it.quantity > 0 ? (itemNet / it.quantity) : 0;
          const discountSuffix = (it.discountValue || 0) > 0 
            ? ` [İskonto: ${it.discountType === "PERCENT" ? `%${it.discountValue}` : `${getCurrencySymbol(newInvoice.currency)}${it.discountValue}`}]`
            : "";
          return {
            description: it.description + discountSuffix,
            quantity: it.quantity,
            unitPrice: itemNetUnitPrice,
            taxRate: it.taxRate,
            totalAmount: itemNet
          };
        }),
      };
      const res = await fetch("/api/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Fatura başarıyla oluşturuldu");
        setIsNewModalOpen(false);
        setNewInvoice({
          currentAccountId: "", type: "SATIS",
          date: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          notes: "", taxRate: 20,
          items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 20, discountValue: 0, discountType: "PERCENT" }],
          currency: "TRY", exchangeRate: 1, paymentMethod: "CARI_HESAP", invoiceNumber: "",
          efaturaSenaryo: "TEMELFATURA", efaturaTip: "SATIS", efaturaGonder: false,
          efaturaOdemeVadeTarihi: "", efaturaOdemeSekli: "", efaturaOdemeAraciKurum: "",
          efaturaTasiyiciFirma: "", efaturaTasiyiciVKN: "",
          efaturaGonderimTarihi: new Date().toISOString().split("T")[0],
          efaturaSatisWebSitesi: typeof window !== "undefined" ? window.location.origin : "",
        });
        setShowEfaturaPanel(false);
        setGibStatus(null);
        fetchInvoices();
      } else {
        const err = await res.json();
        toast.error(err.error || "Fatura oluşturulamadı");
      }
    } catch { toast.error("Bağlantı hatası"); }
    finally { setSaving(false); }
  };

  // Mark as paid
  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/accounting/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ODENDI" }),
      });
      if (res.ok) { toast.success("Fatura ödendi olarak işaretlendi"); fetchInvoices(); }
      else toast.error("Durum güncellenemedi");
    } catch { toast.error("Bağlantı hatası"); }
  };

  // Generic status change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/accounting/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { toast.success("Fatura durumu güncellendi"); fetchInvoices(); }
      else toast.error("Durum güncellenemedi");
    } catch { toast.error("Bağlantı hatası"); }
  };

  // Clone invoice
  const handleCloneInvoice = async (inv: Invoice) => {
    const cloneNotes = (inv.notes || "").replace(/\[Seri No:[^\]]+\]/, "").trim();
    const body = {
      currentAccountId: inv.currentAccount.id,
      type: inv.type,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: cloneNotes + " | [Klon: EVET]",
      status: "TASLAK",
      totalAmount: Number(inv.totalAmount),
      taxAmount: Number(inv.taxAmount),
      items: (inv.invoiceItems || []).map(it => ({
        description: it.name,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        taxRate: it.vatRate,
        totalAmount: Number(it.totalAmount),
      })),
    };
    try {
      const res = await fetch("/api/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { toast.success("✅ Fatura klonlandı (Taslak olarak eklendi)"); fetchInvoices(); }
      else toast.error("Klon oluşturulamadı");
    } catch { toast.error("Bağlantı hatası"); }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedIds(filtered.map(x => x.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Deletion execution
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    const idsToDelete = Array.isArray(id) ? id : [id];

    let successCount = 0;
    let failCount = 0;
    let errorMessage = "";

    for (const targetId of idsToDelete) {
      try {
        const res = await fetch(`/api/accounting/invoices/${targetId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          successCount++;
        } else {
          const err = await res.json();
          errorMessage = err.error || "Bilinmeyen hata";
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} fatura başarıyla silindi`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} fatura silinemedi. Hata: ${errorMessage || "Yetki veya statü kısıtı"}`);
    }

    setDeleteTarget(null);
    setSelectedIds([]);
    fetchInvoices();
  };

  // Bulk Status Updates
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.length === 0) return;
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/accounting/invoices/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} fatura durumu güncellendi`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} faturanın durumu güncellenemedi`);
    }

    setSelectedIds([]);
    fetchInvoices();
  };

  // Export CSV
  const handleExportCSV = (scope: "selected" | "all") => {
    const dataToExport = scope === "selected"
      ? filtered.filter(inv => selectedIds.includes(inv.id))
      : filtered;

    if (dataToExport.length === 0) {
      toast.error("Aktarılacak veri bulunamadı.");
      return;
    }

    const BOM = "\uFEFF";
    const rows = [
      ["Fatura No", "Cari Hesap", "Tür", "Tarih", "Vade", "KDV (₺)", "Toplam (₺)", "Durum"],
      ...dataToExport.map(inv => [
        `#${inv.id.slice(-8).toUpperCase()}`,
        inv.currentAccount?.name ?? "—",
        TYPE_MAP[inv.type] ?? inv.type,
        new Date(inv.date).toLocaleDateString("tr-TR"),
        new Date(inv.dueDate).toLocaleDateString("tr-TR"),
        Number(inv.taxAmount).toFixed(2),
        Number(inv.totalAmount).toFixed(2),
        STATUS_MAP[inv.status]?.label ?? inv.status,
      ])
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faturalar_${scope}.csv`;
    a.click();
    setShowExportMenu(false);
    toast.success(`${scope === "selected" ? "Seçilen" : "Tüm"} faturalar CSV olarak indirildi`);
  };

  // Export PDF
  const handleExportPdf = (scope: "selected" | "all") => {
    const dataToExport = scope === "selected"
      ? filtered.filter(inv => selectedIds.includes(inv.id))
      : filtered;

    if (dataToExport.length === 0) {
      toast.error("Aktarılacak veri bulunamadı.");
      return;
    }

    const headers = ["Fatura No", "Cari Hesap", "Tur", "Tarih", "Vade Tarihi", "KDV Tutari", "Toplam Tutar", "Durum"];
    const rows = dataToExport.map(inv => [
      `#${inv.id.slice(-8).toUpperCase()}`,
      inv.currentAccount?.name ?? "—",
      TYPE_MAP[inv.type] ?? inv.type,
      new Date(inv.date).toLocaleDateString("tr-TR"),
      new Date(inv.dueDate).toLocaleDateString("tr-TR"),
      `TL ${Number(inv.taxAmount).toFixed(2)}`,
      `TL ${Number(inv.totalAmount).toFixed(2)}`,
      STATUS_MAP[inv.status]?.label ?? inv.status,
    ]);

    exportToPDF({
      title: "FATURA LISTESI RAPORU",
      subtitle: `${scope === "selected" ? "Secilen" : "Tum"} fatura kayitlari listesi`,
      filename: "faturalar_raporu",
      headers,
      rows,
      filters: [
        { label: "Durum Filtresi", value: statusFilter },
        { label: "Tur Filtresi", value: typeFilter },
      ]
    });
    
    setShowExportMenu(false);
    toast.success("PDF Raporu başarıyla oluşturuldu.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-orange-500" /> Fatura Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Satış, alış ve iade faturalarını oluşturun, takip edin ve dışa aktarın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <Download className="w-4 h-4" /> Dışa Aktar <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 divide-y divide-slate-100">
                <div className="py-1">
                  <p className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">CSV Aktarım</p>
                  <button onClick={() => handleExportCSV("all")} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition text-left">
                    <FileText className="w-3.5 h-3.5 text-orange-500" /> Tümünü CSV Yap
                  </button>
                  <button 
                    onClick={() => handleExportCSV("selected")} 
                    disabled={selectedIds.length === 0}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition ${
                      selectedIds.length === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Seçilenleri CSV Yap
                  </button>
                </div>
                <div className="py-1">
                  <p className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">PDF Raporu</p>
                  <button onClick={() => handleExportPdf("all")} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition text-left">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-orange-500" /> Tümünü PDF Yap
                  </button>
                  <button 
                    onClick={() => handleExportPdf("selected")} 
                    disabled={selectedIds.length === 0}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition ${
                      selectedIds.length === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Seçilenleri PDF Yap
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" /> Yeni Fatura Oluştur
          </button>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Toplam Fatura Tutarı", value: totalAmount, color: "text-slate-800", bg: "bg-white border-slate-100", icon: Tag, iconCls: "text-slate-500 bg-slate-50", showProgress: false },
          { label: "Tahsil Edilen",         value: paidAmount,    color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", icon: TrendingUp, iconCls: "text-emerald-600 bg-emerald-100", showProgress: true },
          { label: "Bekleyen / Açık",       value: pendingAmount, color: "text-amber-700",   bg: "bg-amber-50 border-amber-100",   icon: TrendingDown, iconCls: "text-amber-600 bg-amber-100", showProgress: false },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconCls}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-xl font-black mt-0.5 ${s.color}`}>
                  ₺{s.value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {s.showProgress && (
              <div className="mt-1 pt-1 border-t border-emerald-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold text-emerald-700 mb-1">
                  <span>Tahsilat Oranı</span>
                  <span>%{collectionRate.toFixed(1)}</span>
                </div>
                <div className="w-full bg-emerald-200/50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${collectionRate}%` }} 
                  />
                </div>
              </div>
            )}
            {s.label === "Bekleyen / Açık" && (
              <div className="mt-1 pt-1 border-t border-amber-100/50">
                <div className="flex justify-between items-center text-[10px] font-bold text-amber-700 mb-1">
                  <span>Bekleme Oranı</span>
                  <span>%{(100 - collectionRate).toFixed(1)}</span>
                </div>
                <div className="w-full bg-amber-200/50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${100 - collectionRate}%` }} 
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Cari Hesap veya fatura ID ara..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-semibold text-slate-600">
          <option value="ALL">Tüm Durumlar</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-semibold text-slate-600">
          <option value="ALL">Tüm Türler</option>
          {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-600"
          title="Başlangıç tarihi" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 text-slate-600"
          title="Bitiş tarihi" />
        {/* Clear Filters */}
        {(search || statusFilter !== "ALL" || typeFilter !== "ALL" || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("ALL"); setTypeFilter("ALL"); setDateFrom(""); setDateTo(""); }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded-xl transition"
          >
            <X className="w-3.5 h-3.5" /> Filtreleri Temizle
          </button>
        )}
        <button onClick={fetchInvoices} className="p-2.5 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition" title="Yenile">
          <RefreshCw className="w-4 h-4" />
        </button>
        {/* Record count */}
        <span className="ml-auto text-[10px] font-bold text-slate-400 whitespace-nowrap">
          {filtered.length} / {invoices.length} fatura
        </span>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> Yükleniyor...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <Receipt className="w-12 h-12 opacity-20" />
            <p className="font-bold text-sm text-slate-500">{invoices.length === 0 ? "Henüz hiç fatura oluşturulmadı" : "Filtreye uyan fatura bulunamadı"}</p>
            <p className="text-slate-400">{invoices.length === 0 ? "İlk faturasını oluşturmak için aşağıdaki butona tıkla" : "Filtreleri değiştirerek tekrar dene"}</p>
            {invoices.length === 0 && (
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> İlk Faturasını Oluştur
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 w-10">
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-5 py-3">Fatura No</th>
                  <th className="px-5 py-3">Cari Hesap</th>
                  <th className="px-5 py-3">Tür</th>
                  <th className="px-5 py-3">Tarih</th>
                  <th className="px-5 py-3">Vade Tarihi</th>
                  <th className="px-5 py-3 text-right">KDV</th>
                  <th className="px-5 py-3 text-right">Toplam</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filtered.map((inv) => {
                  const status = STATUS_MAP[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600 border-gray-200", icon: AlertCircle };
                  const StatusIcon = status.icon;
                  const isOverdue = inv.status !== "ODENDI" && new Date(inv.dueDate) < new Date();
                  const isSelected = selectedIds.includes(inv.id);
                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/70 transition ${isSelected ? "bg-orange-50/20" : ""}`}>
                      <td className="px-5 py-4 w-10">
                        <input 
                          type="checkbox"
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(inv.id)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-500">#{inv.id.slice(-8).toUpperCase()}</span>
                        {(() => {
                          const nt = inv.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1];
                          if (nt === "EFATURA") return <span className="ml-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full text-[8px] font-black">e-F</span>;
                          if (nt === "EARSIV") return <span className="ml-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full text-[8px] font-black">e-A</span>;
                          return null;
                        })()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{inv.currentAccount?.name ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {TYPE_MAP[inv.type] ?? inv.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{new Date(inv.date).toLocaleDateString("tr-TR")}</td>
                      <td className={`px-5 py-4 ${isOverdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
                        {new Date(inv.dueDate).toLocaleDateString("tr-TR")}
                        {isOverdue && <span className="ml-1 text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">GECİKMİŞ</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500">{fmtAmount(Number(inv.taxAmount), inv.notes)}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-900">{fmtAmount(Number(inv.totalAmount), inv.notes)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.cls}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedInvoice(inv); setIsDetailModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Detay Görüntüle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => window.open(`/api/integrations/efatura/pdf?id=${inv.id}&type=${inv.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1] || "EFATURA"}`, "_blank")}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Hızlı Yazdır"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCloneInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                            title="Faturası Klonla"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== "ODENDI" && inv.status !== "IPTAL" && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Ödendi Olarak İşaretle"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget({
                              id: inv.id,
                              type: "invoice",
                              label: `Fatura #${inv.id.slice(-8).toUpperCase()}`
                            })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── NEW INVOICE MODAL ── */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-orange-500 rounded-lg"><Receipt className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Yeni Fatura Oluştur</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Satış, alış veya iade faturası</p>
                </div>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              {/* Row 1: Account + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Hesap *</label>
                  {/* Searchable Account Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountDropdown(v => !v);
                        setAccountSearch("");
                      }}
                      className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold outline-none text-left flex items-center justify-between transition ${
                        newInvoice.currentAccountId
                          ? "border-orange-400 bg-white text-slate-800"
                          : "border-slate-200 text-slate-400"
                      } hover:bg-white hover:border-orange-400`}
                    >
                      <span className="truncate text-sm font-semibold">
                        {newInvoice.currentAccountId
                          ? accounts.find(a => a.id === newInvoice.currentAccountId)?.name ?? "— Seçiniz —"
                          : "— Seçiniz —"}
                      </span>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform text-slate-400 ${showAccountDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showAccountDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Cari hesap ara..."
                            value={accountSearch}
                            onChange={e => setAccountSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-400 bg-slate-50"
                          />
                        </div>
                        {/* Options List */}
                        <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                          {/* Clear option */}
                          <button
                            type="button"
                            onClick={() => {
                              setNewInvoice(p => ({ ...p, currentAccountId: "" }));
                              setShowAccountDropdown(false);
                              setAccountSearch("");
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition font-medium"
                          >
                            — Seçimi Temizle —
                          </button>
                          {accounts
                            .filter(a => a.name.toLowerCase().includes(accountSearch.toLowerCase()))
                            .map(a => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  setNewInvoice(p => ({ ...p, currentAccountId: a.id }));
                                  setShowAccountDropdown(false);
                                  setAccountSearch("");
                                }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition font-medium rounded-lg flex items-center justify-between gap-2 ${
                                  newInvoice.currentAccountId === a.id
                                    ? "bg-orange-50 text-orange-700 font-bold"
                                    : "text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                                }`}
                              >
                                <span className="truncate">{a.name}</span>
                                {newInvoice.currentAccountId === a.id && (
                                  <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          {accounts.filter(a => a.name.toLowerCase().includes(accountSearch.toLowerCase())).length === 0 && (
                            <p className="text-center text-xs text-slate-400 py-4">"“{accountSearch}” için sonuç bulunamadı.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Overlay to close dropdown on outside click */}
                  {showAccountDropdown && (
                    <div
                      className="fixed inset-0 z-[55]"
                      onClick={() => { setShowAccountDropdown(false); setAccountSearch(""); }}
                    />
                  )}

                  {gibStatus && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold">
                      {gibStatus === "LOADING" && (
                        <span className="text-slate-500 animate-pulse flex items-center gap-1">
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> GİB Mükellef Durumu Sorgulanıyor...
                        </span>
                      )}
                      {gibStatus === "EFATURA" && (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> e-Fatura Mükellefi (Otomatik Algılandı)
                        </span>
                      )}
                      {gibStatus === "EARSIV" && (
                        <span className="text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-4 h-4" /> e-Arşiv Faturası (Otomatik Algılandı)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fatura Türü</label>
                  <select value={newInvoice.type} onChange={e => setNewInvoice(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition">
                    <option value="SATIS">Satış Faturası</option>
                    <option value="ALIS">Alış Faturası</option>
                    <option value="IADE">İade Faturası</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Ödeme Yöntemi + Para Birimi + Döviz Kuru */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ödeme Yöntemi</label>
                  <select 
                    value={newInvoice.paymentMethod} 
                    onChange={e => setNewInvoice(p => ({ ...p, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition"
                  >
                    <option value="CARI_HESAP">Cari Hesap (Vadeli)</option>
                    <option value="HAVALE_EFT">Banka Havalesi/EFT</option>
                    <option value="KREDI_KARTI">Kredi Kartı</option>
                    <option value="NAKIT">Nakit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Para Birimi</label>
                  <select 
                    value={newInvoice.currency} 
                    onChange={e => {
                      const cur = e.target.value;
                      setNewInvoice(p => ({ ...p, currency: cur }));
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    Döviz Kuru
                    {isFetchingRate && <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />}
                  </label>
                  <div className="relative">
                    <input 
                      type="number" step="0.0001" min="0.0001"
                      disabled={newInvoice.currency === "TRY" || isFetchingRate}
                      value={newInvoice.exchangeRate} 
                      onChange={e => setNewInvoice(p => ({ ...p, exchangeRate: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition disabled:opacity-60" 
                    />
                    {isFetchingRate && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-orange-500 font-bold animate-pulse">Güncelleniyor...</span>
                    )}
                  </div>
                  {rateSource && rateDate && !isFetchingRate && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full font-black text-[10px] ${
                        rateSource === "TCMB" ? "bg-red-50 text-red-600 border border-red-200" :
                        rateSource === "FRANKFURTER" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                        "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}>{rateSource}</span>
                      {rateDate} tarihli kur
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Dates & Invoice Number override */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Fatura Tarihi</label>
                  <input type="date" value={newInvoice.date} onChange={e => setNewInvoice(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Vade Tarihi</label>
                  <input type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Fatura Seri No</label>
                  <input 
                    type="text" placeholder="Örn: EAR202600001"
                    value={newInvoice.invoiceNumber} 
                    onChange={e => setNewInvoice(p => ({ ...p, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition" 
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fatura Kalemleri *</label>
                  <button type="button" onClick={addItem} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span className="col-span-2">Katalog Ürünü Seç</span>
                    <span className="col-span-3">Açıklama / Detay</span>
                    <span className="col-span-1 text-right">Miktar</span>
                    <span className="col-span-2 text-right">Birim Fiyat</span>
                    <span className="col-span-1 text-right">İskonto</span>
                    <span className="col-span-1 text-center">Tip</span>
                    <span className="col-span-1 text-right">KDV %</span>
                    <span className="col-span-1"></span>
                  </div>
                  {newInvoice.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      {/* Product Selector with Search */}
                      <div className="col-span-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdownIdx(activeDropdownIdx === idx ? null : idx);
                            setProductSearch("");
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 font-medium text-slate-700 text-left flex items-center justify-between shadow-sm hover:bg-slate-50 transition"
                        >
                          <span className="truncate">
                            {item.description ? item.description : "— Ürün Seçin —"}
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
                        </button>
                        
                        {activeDropdownIdx === idx && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-56 overflow-y-auto">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Ürün adı ara..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-orange-400"
                            />
                            <div className="divide-y divide-slate-50">
                              <button
                                type="button"
                                onClick={() => {
                                  updateItem(idx, "description", "");
                                  updateItem(idx, "unitPrice", 0);
                                  setActiveDropdownIdx(null);
                                }}
                                className="w-full text-left px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition font-medium"
                              >
                                — Seçimi Temizle —
                              </button>
                              {productsList
                                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      updateItem(idx, "description", p.name);
                                      updateItem(idx, "unitPrice", Number(p.finalPrice || p.price || 0));
                                      updateItem(idx, "taxRate", p.vatRate || 20);
                                      setActiveDropdownIdx(null);
                                    }}
                                    className="w-full text-left px-2 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition font-medium truncate flex justify-between"
                                  >
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-slate-400 text-xs ml-1 flex-shrink-0">
                                      {getCurrencySymbol(newInvoice.currency)}{(p.finalPrice || p.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        className="col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400"
                        placeholder="Ürün / Hizmet açıklaması"
                        value={item.description}
                        onChange={e => updateItem(idx, "description", e.target.value)}
                      />
                      <input
                        type="number" min={1}
                        className="col-span-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 text-right"
                        value={item.quantity}
                        onChange={e => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                      />
                      <input
                        type="number" min={0} step="0.01"
                        className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 text-right"
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                      <input
                        type="number" min={0} step="0.01"
                        className="col-span-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 text-right"
                        placeholder="0"
                        value={item.discountValue || ""}
                        onChange={e => updateItem(idx, "discountValue", parseFloat(e.target.value) || 0)}
                      />
                      <select
                        className="col-span-1 px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400 text-center font-bold"
                        value={item.discountType || "PERCENT"}
                        onChange={e => updateItem(idx, "discountType", e.target.value)}
                      >
                        <option value="PERCENT">%</option>
                        <option value="AMOUNT">{getCurrencySymbol(newInvoice.currency)}</option>
                      </select>
                      <select
                        className="col-span-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:border-orange-400"
                        value={item.taxRate}
                        onChange={e => updateItem(idx, "taxRate", parseInt(e.target.value))}
                      >
                        {TAX_RATES.map(r => <option key={r} value={r}>%{r}</option>)}
                      </select>
                      <button type="button" onClick={() => removeItem(idx)}
                        className="col-span-1 flex items-center justify-center p-1 text-slate-400 hover:text-red-500 transition"
                        disabled={newInvoice.items.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {/* Totals */}
                  <div className="border-t border-slate-200 mt-2 pt-2 space-y-1.5 text-sm text-right">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold">Ara Toplam</span>
                      <span>{getCurrencySymbol(newInvoice.currency)}{calcSubtotal().toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    {calcTotalDiscount() > 0 && (
                      <div className="flex justify-between text-red-500 font-semibold">
                        <span>Toplam İskonto</span>
                        <span>-{getCurrencySymbol(newInvoice.currency)}{calcTotalDiscount().toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold">KDV Toplam</span>
                      <span>{getCurrencySymbol(newInvoice.currency)}{calcTax().toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-base border-t border-slate-100 pt-1 mt-1">
                      <span>Genel Toplam</span>
                      <span className="text-orange-600">{getCurrencySymbol(newInvoice.currency)}{calcTotal().toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* E-Fatura Detay Panel */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                {/* Panel Header / Toggle */}
                <button
                  type="button"
                  onClick={() => setShowEfaturaPanel(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
                      <Receipt className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-800">e-Fatura / e-Arşiv Detayları</p>
                      <p className="text-xs text-slate-500 font-medium">GİB standartlarına uygun senaryo, tip ve nakliye bilgileri</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {newInvoice.efaturaGonder && (
                      <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">GÖNDERİLECEK</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showEfaturaPanel ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {showEfaturaPanel && (
                  <div className="p-4 space-y-4 bg-white border-t border-slate-100">

                    {/* Row A: Senaryo + E-Fatura Tip */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Senaryo</label>
                        <select
                          value={newInvoice.efaturaSenaryo}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaSenaryo: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        >
                          <option value="TEMELFATURA">Temel Fatura</option>
                          <option value="TICARIFATURA">Ticari Fatura</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">e-Fatura Tip</label>
                        <select
                          value={newInvoice.efaturaTip}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaTip: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        >
                          <option value="SATIS">Satış</option>
                          <option value="IADE">İade</option>
                          <option value="TEVKIFAT">Tevkifat</option>
                          <option value="ISTISNA">İstisna</option>
                          <option value="OZELMATRAH">Özel Matrah</option>
                        </select>
                      </div>
                    </div>

                    {/* e-Fatura Gönder Toggle */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-700">e-Fatura Gönder</p>
                        <p className="text-xs text-slate-400 font-medium">Fatura kaydedilince GİB sistemine otomatik ilet</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewInvoice(p => ({ ...p, efaturaGonder: !p.efaturaGonder }))}
                        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                          newInvoice.efaturaGonder ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          newInvoice.efaturaGonder ? "translate-x-5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diğer Bilgiler</span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>

                    {/* Row B: Ödeme Vade Tarihi + Ödeme Şekli */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Ödeme / Vade Tarihi
                        </label>
                        <input
                          type="date"
                          value={newInvoice.efaturaOdemeVadeTarihi}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaOdemeVadeTarihi: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ödeme Şekli</label>
                        <select
                          value={newInvoice.efaturaOdemeSekli}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaOdemeSekli: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        >
                          <option value="">— Seç… —</option>
                          <option value="NAKIT">Nakit</option>
                          <option value="KREDIKARTI">Kredi Kartı</option>
                          <option value="EFT">EFT / Havale</option>
                          <option value="CEK">Çek</option>
                          <option value="SENET">Senet</option>
                          <option value="KAPIDAODEME">Kapıda Ödeme</option>
                          <option value="DIGER">Diğer</option>
                        </select>
                      </div>
                    </div>

                    {/* Row C: Ödeme Aracı Kurum */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Ödeme Aracı Kurum</label>
                      <input
                        type="text"
                        placeholder="Örn: Garanti BBVA, Yapı Kredi, Vakıfbank..."
                        value={newInvoice.efaturaOdemeAraciKurum}
                        onChange={e => setNewInvoice(p => ({ ...p, efaturaOdemeAraciKurum: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                      />
                    </div>

                    {/* Row D: Taşıyıcı Firma + Taşıyıcı TCKN/VKN */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Taşıyıcı Firma</label>
                        <select
                          value={newInvoice.efaturaTasiyiciFirma}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaTasiyiciFirma: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        >
                          <option value="">— Seç… —</option>
                          <option value="ARAS">Aras Kargo</option>
                          <option value="MNG">MNG Kargo</option>
                          <option value="YURTICI">Yurt İçi Kargo</option>
                          <option value="PTT">PTT Kargo</option>
                          <option value="UPS">UPS Kargo</option>
                          <option value="DHL">DHL Express</option>
                          <option value="FEDEX">FedEx</option>
                          <option value="TRENDYOL">Trendyol Express</option>
                          <option value="DIGER">Diğer</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Taşıyıcı TCKN / VKN</label>
                        <input
                          type="text"
                          placeholder="10 haneli VKN veya 11 haneli TCKN"
                          maxLength={11}
                          value={newInvoice.efaturaTasiyiciVKN}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaTasiyiciVKN: e.target.value.replace(/\D/g, "") }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        />
                      </div>
                    </div>

                    {/* Row E: Gönderim Tarihi + Satış Web Sitesi */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Gönderim Tarihi
                        </label>
                        <input
                          type="date"
                          value={newInvoice.efaturaGonderimTarihi}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaGonderimTarihi: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Satış Web Sitesi</label>
                        <input
                          type="url"
                          placeholder="https://www.siteniz.com.tr"
                          value={newInvoice.efaturaSatisWebSitesi}
                          onChange={e => setNewInvoice(p => ({ ...p, efaturaSatisWebSitesi: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-emerald-400 transition"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notlar</label>
                <textarea
                  rows={2} placeholder="Fatura notları, ödeme koşulları vb."
                  value={newInvoice.notes} onChange={e => setNewInvoice(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-orange-400 transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
                <button type="button" onClick={() => setIsNewModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition">
                  İptal
                </button>
                <button type="submit" id="invoice-submit-btn" disabled={saving}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  Fatura Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-4 h-[88vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  Fatura Detayı #{selectedInvoice.id.slice(-8).toUpperCase()}
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-2">
                  {selectedInvoice.currentAccount?.name}
                  {(() => {
                    const noteType = selectedInvoice.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1];
                    if (noteType === "EFATURA") return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide">e-FATURA</span>;
                    if (noteType === "EARSIV") return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide">e-ARŞİV</span>;
                    return null;
                  })()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const noteType = selectedInvoice.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1] || "EFATURA";
                    window.open(`/api/integrations/efatura/pdf?id=${selectedInvoice.id}&type=${noteType}`, "_blank");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold rounded-xl transition"
                >
                  <Printer className="w-4 h-4" /> Yazdır
                </button>
                <button onClick={() => setIsDetailModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content - Two Columns */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column (1/3) - System details */}
              <div className="w-full md:w-96 border-r border-slate-100 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sistem Detayları</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tür</p>
                      <p className="font-bold text-slate-800">{TYPE_MAP[selectedInvoice.type] ?? selectedInvoice.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Durum</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_MAP[selectedInvoice.status]?.cls ?? ""}`}>
                        {STATUS_MAP[selectedInvoice.status]?.label ?? selectedInvoice.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tarih</p>
                      <p className="font-semibold text-slate-700">{new Date(selectedInvoice.date).toLocaleDateString("tr-TR")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vade</p>
                      <p className="font-semibold text-slate-700">{new Date(selectedInvoice.dueDate).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finansal Özet</p>
                  <div className="bg-white rounded-xl p-4 space-y-2 text-sm border border-slate-200/60 shadow-sm">
                    {(() => {
                      const grossSubtotal = Number(selectedInvoice.totalAmount) + Number(selectedInvoice.taxAmount);
                      // Parse discount info from item names in notes
                      const hasDiscount = (selectedInvoice.items as any[])?.some?.((it: any) =>
                        (it.description || it.name || "").includes("[İskonto:")
                      );
                      const netSubtotal = Number(selectedInvoice.totalAmount) - Number(selectedInvoice.taxAmount);
                      return (
                        <>
                          <div className="flex justify-between text-slate-500">
                            <span>KDV Matrahı</span>
                            <span className="font-semibold text-slate-700">&#x20ba;{netSubtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>KDV Tutarı</span>
                            <span className="font-semibold text-slate-700">&#x20ba;{Number(selectedInvoice.taxAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-100 pt-2">
                            <span>Genel Toplam</span>
                            <span className="text-orange-600 font-black text-base">&#x20ba;{Number(selectedInvoice.totalAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          {hasDiscount && (
                            <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-1 mt-1">* Toplam, satır iskontoları düşüldükten sonraki tutardır.</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notlar / Açıklama</p>
                    <div className="bg-blue-50/50 rounded-xl p-3 text-sm text-blue-700 border border-blue-100/50">
                      <p className="leading-relaxed break-all">{selectedInvoice.notes
                        .replace(/\[eF-[^\]]+\]/g, "")
                        .replace(/\[Para:[^\]]+\]/g, "")
                        .replace(/\[Ödeme:[^\]]+\]/g, "")
                        .replace(/\[Seri No:[^\]]+\]/g, "")
                        .replace(/\[Fatura Tipi:[^\]]+\]/g, "")
                        .replace(/\s*\|\s*/g, " ")
                        .trim() || "—"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Invoice Items List */}
                {selectedInvoice.invoiceItems && selectedInvoice.invoiceItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fatura Kalemleri ({selectedInvoice.invoiceItems.length})</p>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kalem</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Adet</th>
                            <th className="px-3 py-2 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Tutar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedInvoice.invoiceItems.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-slate-50/50 transition">
                              <td className="px-3 py-2">
                                <p className="font-semibold text-slate-700 leading-tight">{item.name.replace(/\[İskonto:[^\]]+\]/, "").trim()}</p>
                                <p className="text-[10px] text-slate-400">{item.vatRate > 0 ? `KDV %${item.vatRate}` : "KDV muaf"}</p>
                              </td>
                              <td className="px-3 py-2 text-right text-slate-600 font-medium">{item.quantity}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-800">{fmtAmount(Number(item.totalAmount), selectedInvoice.notes)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  {/* Status flow: TASLAK → GÖNDERİLDİ */}
                  {selectedInvoice.status === "TASLAK" && (
                    <button
                      onClick={() => { handleStatusChange(selectedInvoice.id, "GONDERILDI"); setIsDetailModalOpen(false); }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Clock className="w-4 h-4" /> Gönderildi Olarak İşaretle
                    </button>
                  )}
                  {/* Mark paid */}
                  {selectedInvoice.status !== "ODENDI" && selectedInvoice.status !== "IPTAL" && (
                    <button
                      onClick={() => { handleMarkPaid(selectedInvoice.id); setIsDetailModalOpen(false); }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Ödendi Olarak İşaretle
                    </button>
                  )}
                  {/* Clone */}
                  <button
                    onClick={() => { handleCloneInvoice(selectedInvoice); setIsDetailModalOpen(false); }}
                    className="w-full py-3 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" /> Faturayı Klonla
                  </button>
                  {/* Cancel */}
                  {selectedInvoice.status !== "IPTAL" && (
                    <button
                      onClick={() => { handleStatusChange(selectedInvoice.id, "IPTAL"); setIsDetailModalOpen(false); }}
                      className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Faturayı İptal Et
                    </button>
                  )}
                  {/* Delete */}
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setDeleteTarget({
                        id: selectedInvoice.id,
                        type: "invoice",
                        label: `Fatura #${selectedInvoice.id.slice(-8).toUpperCase()}`
                      });
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Faturayı Kalıcı Sil
                  </button>
                </div>
              </div>

              {/* Right Column (2/3) - Official GİB PDF/HTML iframe */}
              <div className="flex-1 bg-slate-100 p-4 flex flex-col">
                <div className="flex-1 bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden relative">
                  <iframe 
                    src={`/api/integrations/efatura/pdf?id=${selectedInvoice.id}&type=${selectedInvoice.notes?.match(/\[Fatura Tipi:\s*([A-Z]+)\]/)?.[1] || "EFATURA"}`} 
                    className="w-full h-full border-none"
                    title="e-Fatura Resmi Önizleme"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING BULK ACTIONS BAR ── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-3xl text-white">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-6">
            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-300">Fatura Seçildi</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkStatusUpdate("ODENDI")}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Ödendi Yap
            </button>
            <button
              onClick={() => handleBulkStatusUpdate("IPTAL")}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95"
            >
              <XCircle className="w-3.5 h-3.5" /> İptal Et
            </button>
            <button
              onClick={() => setDeleteTarget({
                id: selectedIds,
                type: "invoice",
                label: `${selectedIds.length} adet fatura`
              })}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" /> Toplu Sil
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
            <button
              onClick={() => handleExportCSV("selected")}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Seçilenleri CSV Yap"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleExportPdf("selected")}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Seçilenleri PDF Yap"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white font-semibold transition ml-2"
            >
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL FOR DELETION ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Fatura Silme Onayı</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Bu işlem geri alınamaz!</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{deleteTarget.label}</strong> kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition active:scale-95"
              >
                Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

