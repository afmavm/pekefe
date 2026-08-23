"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { TahsilatForm } from "./components/TahsilatForm";
import { 
  Plus, Search, Edit2, Trash2, Filter, Eye, FileText, 
  TrendingUp, TrendingDown, CheckSquare, Square, CheckCircle, 
  AlertTriangle, Upload, Globe, CreditCard, UserCheck, 
  Trash, MessageCircle, Mail, Sparkles, X, Download, ShieldCheck,
  Building, ChevronRight, RefreshCw, Paperclip, Lock, Unlock,
  FileSearch, ShieldAlert, BadgeCheck, Loader2, Zap, Printer
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { turkeyLocations } from "@/data/turkey-locations";
import { useSearchParams } from "next/navigation";

interface Address {
  id: string;
  title: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city: string;
  district: string;
  fullAddress: string;
  type: "billing" | "shipping" | "both";
  country?: string;
  town?: string;
  neighborhood?: string;
  postalCode?: string;
  phone2?: string;
  mobile?: string;
  mobile2?: string;
  email?: string;
  email2?: string;
  contactPerson?: string;
}

interface CurrentAccount {
  id: string;
  cariKod: string;
  name: string;
  type: string;
  cariTipi: string;
  ad: string | null;
  soyad: string | null;
  tckn: string | null;
  dogumTarihi: string | null;
  taxNo: string | null;
  taxId: string | null;
  taxOffice: string | null;
  mersisNo: string | null;
  yetkiliKisi: string | null;
  webSitesi: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  currency: string;
  openingBalance: number;
  isActive: boolean;
  discountRate: number | null;
  creditLimit: number | null;
  riskLimit: number | null;
  vadeGun: number | null;
  dealerGroup: string;
  priceGroup: string;
  priceFormula: string | null;
  kaynakPlatform: string;
  eFaturaDurumu: boolean;
  blokeDurumu: boolean;
  adresler: Address[];
  entegrasyonHaritalama: Record<string, string>;
  dosyalar: Array<{ name: string; url: string; date: string }>;
  auditLogs: Array<{ id: string; field: string; oldValue: string; newValue: string; updatedBy: string; date: string }>;
  createdAt: string;
  transactions?: any[];
  invoices?: any[];
  orders?: any[];
  bankalar?: any;
  kvkk?: any;
  yetkililer?: any;
  tanimlar?: any;
}

function sayiyiYaziyaCevir(sayi: number): string {
  const birler = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
  const onlar = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Atmış", "Yetmiş", "Seksen", "Doksan"];
  const binler = ["", "Bin", "Milyon", "Milyar", "Trilyon"];
  
  if (sayi === 0) return "Sıfır";
  
  let yazi = "";
  const tamKisim = Math.floor(sayi);
  const kurusKisim = Math.round((sayi - tamKisim) * 100);
  
  const cevirGrup = (grupSayi: number): string => {
    let grupYazi = "";
    const yuzlerBas = Math.floor(grupSayi / 100);
    const onlarBas = Math.floor((grupSayi % 100) / 10);
    const birlerBas = grupSayi % 10;
    
    if (yuzlerBas > 0) {
      if (yuzlerBas === 1) grupYazi += "Yüz";
      else grupYazi += birler[yuzlerBas] + "Yüz";
    }
    if (onlarBas > 0) {
      grupYazi += onlar[onlarBas];
    }
    if (birlerBas > 0) {
      grupYazi += birler[birlerBas];
    }
    return grupYazi;
  };
  
  let sayiStr = tamKisim.toString();
  while (sayiStr.length % 3 !== 0) {
    sayiStr = "0" + sayiStr;
  }
  
  const grupSayisi = sayiStr.length / 3;
  for (let i = 0; i < grupSayisi; i++) {
    const grupText = sayiStr.substr(i * 3, 3);
    const grupVal = parseInt(grupText, 10);
    if (grupVal === 0) continue;
    
    const grupAdi = binler[grupSayisi - 1 - i];
    let grupYazi = cevirGrup(grupVal);
    
    if (grupYazi === "Bir" && grupAdi === "Bin") {
      grupYazi = "";
    }
    
    yazi += grupYazi + grupAdi;
  }
  
  yazi = yazi + " Türk Lirası";
  
  if (kurusKisim > 0) {
    let kurusYazi = cevirGrup(kurusKisim);
    yazi += " " + kurusYazi + " Kuruş";
  }
  
  return yazi;
}

function getReceiptNo(data: any): string {
  if (!data) return "";
  const dateObj = data.date ? new Date(data.date) : new Date();
  const year = dateObj.getFullYear();
  let suffix = "";
  if (data.transactionId) {
    const cleanId = data.transactionId.replace(/[^a-zA-Z0-9]/g, "");
    let num = 0;
    for (let i = 0; i < cleanId.length; i++) {
      num = (num * 31 + cleanId.charCodeAt(i)) % 100000;
    }
    suffix = String(num).padStart(5, "0");
  } else {
    const timestampStr = Date.now().toString();
    suffix = timestampStr.slice(-5);
  }
  return `MAK-${year}-${suffix}`;
}

export default function CariPage() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id");
  const [accounts, setAccounts] = useState<CurrentAccount[]>([]);
  const cities = Object.keys(turkeyLocations).sort((a, b) => a.localeCompare(b, 'tr'));
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Active Detail Account
  const [activeAccount, setActiveAccount] = useState<CurrentAccount | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "commercial" | "ledger" | "orders" | "marketplace" | "files" | "audit">("general");

  const view = searchParams ? searchParams.get("view") : null;

  // Muhasebe modu: /muhasebe/cari (view parametresi yok)
  // CRM modu: /admin/dealers?view=general veya ?view=b2b
  const isMuhasebeMod = !view;

  useEffect(() => {
    if (view === "risk") {
      setPlatformFilter("PEKEFE_B2B");
      setActiveTab("commercial");
    } else if (view === "b2b") {
      setPlatformFilter("PEKEFE_B2B");
      setActiveTab("general");
    } else if (view === "general") {
      setPlatformFilter("ALL");
      setActiveTab("general");
    } else {
      // /muhasebe/cari — Muhasebe modunda Hareketler (ekstre) varsayılan sekme
      setPlatformFilter("ALL");
      setActiveTab("ledger");
    }
  }, [view]);

  // Modal active tab state
  const [modalActiveTab, setModalActiveTab] = useState<string>("genel");
  const [isKodLocked, setIsKodLocked] = useState(true);

  const [cariTipleri, setCariTipleri] = useState<string[]>([
    "Alıcı / Satıcı", "Alıcı", "Satıcı", "Personel", "Sanal Pazar", 
    "Kurum", "Ana Grup Şirketi", "İthalat", "ihracat", "ithalat/ihracat", 
    "Müşteri", "Tedarikçi", "Servis Bayi"
  ]);
  const [showNewTipInput, setShowNewTipInput] = useState(false);
  const [newTipText, setNewTipText] = useState("");
  const [b2bSubTab, setB2bSubTab] = useState<"kullanici" | "ayarlar">("kullanici");
  const [showPassword, setShowPassword] = useState(false);
  const [b2bUserForm, setB2bUserForm] = useState({ adSoyad: "", email: "", password: "", isActive: true });

  // Validation states
  const [vknError, setVknError] = useState("");
  const [tcknError, setTcknError] = useState("");
  const [gibLoading, setGibLoading] = useState(false);
  const [merniLoading, setMernisLoading] = useState(false);
  const [gibResult, setGibResult] = useState<{ efatura: boolean; earsiv: boolean; mesaj: string } | null>(null);
  const [mernisResult, setMernisResult] = useState<{ valid: boolean; mesaj: string } | null>(null);

  // Modals
  const [isCariModalOpen, setIsCariModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Slide-over drawer for Invoice Details
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Exchange rate dynamic calculation
  const [activeCurrencyView, setActiveCurrencyView] = useState<"TRY" | "USD" | "EUR">("TRY");
  const exchangeRates = { TRY: 1.0, USD: 34.20, EUR: 36.80 };

  // Forms
  const [formData, setFormData] = useState({
    name: "", type: "MUSTERI", cariTipi: "CORPORATE",
    ad: "", soyad: "", tckn: "", dogumTarihi: "",
    taxNo: "", taxId: "", taxOffice: "", mersisNo: "",
    yetkiliKisi: "", webSitesi: "", phone: "", email: "", address: "",
    currency: "TRY", openingBalance: 0, balance: 0,
    discountRate: 0, creditLimit: 0, riskLimit: 0, vadeGun: 0,
    dealerGroup: "Standart", priceGroup: "Liste", priceFormula: "",
    kaynakPlatform: "PEKEFE_B2B", eFaturaDurumu: false, blokeDurumu: false,
    isActive: true,
    adresler: [] as Address[], entegrasyonHaritalama: {} as Record<string, string>,
    dosyalar: [] as any[], auditLogs: [] as any[],
    cariKod: "",
    kategori: "",
    kurum: "Firma",
    bankalar: [] as Array<{ id: string, iban: string, bankaAdi: string, subeAdi: string, subeKodu: string, hesapNo: string }>,
    yetkililer: [] as Array<{ id: string, gorev: string, ad: string, soyad: string, telefon: string, email: string, not: string }>,
    kvkk: { izni: "Onay Verildi", aciklama: "" },
    tanimlar: {
      grup1: "",
      grup2: "",
      grup3: "",
      grup4: "",
      istihbarat: "",
      uyari: "",
      digerUnvan: "",
      birimFiyatGrubu: "",
      cariGrubu: "",
      kepAdresi: "",
      hesaplari: "",
      isleri: "",
      plasiyer: "",
      digerBirimFiyatGruplari: "",
      varsayilanSube: "",
      finansalBilgiler: {
        teminatYerelTutar: 0,
        acikHesapYerelLimit: 0,
        hesapKesimGunu: 0,
        calisilacakVadeGun: 0,
        gecikmeLimitGunu: 0,
        varsayilanAlisIskontosu: 0,
        varsayilanSatisIskontosu: 0,
        ekstreGonder: false,
        limitKontrolu: false,
        veresiyeOlacakMi: true,
        posCihaziKullanilacakMi: false
      }
    }
  });

  // Mapping wizard states
  const [mergePrimaryId, setMergePrimaryId] = useState("");
  const [mergeDuplicateIds, setMergeDuplicateIds] = useState<string[]>([]);

  // Address sub-form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "", firstName: "", lastName: "", phone: "", city: "", district: "", fullAddress: "", type: "shipping" as "billing" | "shipping"
  });

  // Action modals
  const [actionModal, setActionModal] = useState<{ open: boolean; type: "tahsilat" | "ödeme" | "devir" | "alis" | "satis" | "isAlma" | null; belgeTipi?: string; devirTipi?: string }>({ open: false, type: null });
  const [successModalData, setSuccessModalData] = useState<{
    open: boolean;
    amount: number;
    paymentMethod: string;
    closedInvoicesCount: number;
    newBalance: number;
    cariName: string;
    transactionId?: string;
    description?: string;
    date?: string;
    isOdeme?: boolean;
  } | null>(null);
  const [showAlisMenu, setShowAlisMenu] = useState(false);
  const [showSatisMenu, setShowSatisMenu] = useState(false);
  const [showDevirMenu, setShowDevirMenu] = useState(false);
  const [actionForm, setActionForm] = useState({ amount: "", description: "", paymentMethod: "Banka Havalesi", bankId: "BNK-01" });

  // ── Ekstre (Hesap Hareketi) State ─────────────────────────────
  const [ekstreData, setEkstreData] = useState<any>(null);
  const [ekstreLoading, setEkstreLoading] = useState(false);
  const [ekstreType, setEkstreType] = useState<"ALL"|"TX"|"ORDER"|"INVOICE">("ALL");
  const [ekstreFrom, setEkstreFrom] = useState("");
  const [ekstreTo, setEkstreTo] = useState("");

  const fetchEkstre = (id: string, type = ekstreType, from = ekstreFrom, to = ekstreTo) => {
    setEkstreLoading(true);
    const params = new URLSearchParams({ type, limit: "100" });
    if (from) params.append("from", from);
    if (to)   params.append("to", to);
    fetch(`/api/accounting/current-accounts/${id}/ekstre?${params}`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setEkstreData(d); })
      .catch(() => {})
      .finally(() => setEkstreLoading(false));
  };

  /* -------- EKSTRE CIKTI: PDF / EXCEL -------- */

  const handleEkstrePrint = () => {
    if (!ekstreData || !activeAccount) return;
    const rows: any[] = ekstreData.rows || [];
    const s = ekstreData.summary || {};
    const accName  = activeAccount.name    || "-";
    const accKod   = activeAccount.cariKod || "-";
    const accTax   = (activeAccount.taxOffice && activeAccount.taxNo)
      ? `${activeAccount.taxOffice} - ${activeAccount.taxNo}`
      : (activeAccount.taxNo || activeAccount.tckn || "-");
    const dateRange = [ekstreFrom, ekstreTo].filter(Boolean).join(" / ") || "T\u00fcm Zamanlar";
    const printDate = new Date().toLocaleString("tr-TR");

    const rowsHtml = rows.map(row => {
      const d      = new Date(row.date).toLocaleDateString("tr-TR");
      const debit  = row.debit  > 0 ? row.debit.toLocaleString("tr-TR",  { minimumFractionDigits: 2 }) : "-";
      const credit = row.credit > 0 ? row.credit.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-";
      const bal    = row.runningBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 });
      return `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:6px 10px;color:#64748b">${d}</td>
        <td style="padding:6px 10px;font-weight:700">${row.type}</td>
        <td style="padding:6px 10px;color:#475569">${row.description || "-"}</td>
        <td style="padding:6px 10px;text-align:right;color:#ef4444;font-weight:700">${debit}</td>
        <td style="padding:6px 10px;text-align:right;color:#10b981;font-weight:700">${credit}</td>
        <td style="padding:6px 10px;text-align:right;font-weight:800;color:#0f172a">${bal}</td>
      </tr>`;
    }).join("");

    const totalDebit  = (s.totalDebit     || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
    const totalCredit = (s.totalCredit    || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
    const netBal      = (s.currentBalance || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 });

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
      <title>Cari Ekstre \u2014 ${accName}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;color:#1e293b;margin:0;padding:30px;font-size:12px}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #f97316;padding-bottom:16px;margin-bottom:20px}
        .co-name{font-size:15px;font-weight:800;color:#0f172a;margin:0 0 4px}
        .co-sub{font-size:10px;color:#64748b;margin:0}
        .badge{background:#fff7ed;color:#f97316;border:1px solid #fed7aa;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:800}
        .ig{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:18px}
        .ic{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px}
        .il{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        .iv{font-size:13px;font-weight:800;color:#0f172a;margin-top:2px}
        .sg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px}
        .sc{border-radius:8px;padding:10px 14px;text-align:center}
        .sl{font-size:10px;font-weight:700;text-transform:uppercase}
        .sv{font-size:14px;font-weight:900;margin-top:2px}
        table{width:100%;border-collapse:collapse}
        thead{background:#f8fafc}
        th{padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;border-bottom:2px solid #e2e8f0}
        th.r{text-align:right}
        .ft{margin-top:20px;font-size:10px;color:#94a3b8;text-align:right}
        @media print{body{padding:10px}}
      </style></head><body>
      <div class="hdr">
        <div><p class="co-name">Pekefe Geleneksel GIDA TARIM HAYVANCILIK SAN. VE TIC. LTD. STI.</p>
          <p class="co-sub">Kayseri OSB 1. Cadde No: 5 &nbsp;|&nbsp; VD: Kayseri - 1234567890</p></div>
        <span class="badge">CARI EKSTRE</span>
      </div>
      <div class="ig">
        <div class="ic"><div class="il">Cari Unvan</div><div class="iv">${accName}</div></div>
        <div class="ic"><div class="il">Cari Kod</div><div class="iv">${accKod}</div></div>
        <div class="ic"><div class="il">VKN / TCKN</div><div class="iv">${accTax}</div></div>
        <div class="ic"><div class="il">Tarih Araligi</div><div class="iv">${dateRange}</div></div>
        <div class="ic"><div class="il">Toplam Hareket</div><div class="iv">${rows.length}</div></div>
        <div class="ic"><div class="il">Olusturulma</div><div class="iv">${printDate}</div></div>
      </div>
      <div class="sg">
        <div class="sc" style="background:#fef2f2;border:1px solid #fecaca"><div class="sl" style="color:#ef4444">Toplam Borc</div><div class="sv" style="color:#dc2626">${totalDebit} TL</div></div>
        <div class="sc" style="background:#f0fdf4;border:1px solid #bbf7d0"><div class="sl" style="color:#10b981">Toplam Alacak</div><div class="sv" style="color:#059669">${totalCredit} TL</div></div>
        <div class="sc" style="background:#fff7ed;border:1px solid #fed7aa"><div class="sl" style="color:#f97316">Net Bakiye</div><div class="sv" style="color:#ea580c">${netBal} TL</div></div>
      </div>
      <table><thead><tr>
        <th>Tarih</th><th>Tur</th><th>Aciklama</th>
        <th class="r">Borc</th><th class="r">Alacak</th><th class="r">Bakiye</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="ft">Ekstre ${printDate} tarihinde olusturulmustur.</div>
    </body></html>`;

    const w = window.open("", "_blank");
    if (!w) { toast.error("Pop-up engellendi. Taray\u0131c\u0131 izni verin."); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const handleEkstreExcel = () => {
    if (!ekstreData || !activeAccount) return;
    const rows: any[] = ekstreData.rows || [];
    const s = ekstreData.summary || {};
    const now = new Date().toLocaleString("tr-TR");
    const sep = ";";

    const lines: string[] = [];
    lines.push("CARI EKSTRE");
    lines.push(`Cari${sep}${activeAccount.name}`);
    lines.push(`Cari Kod${sep}${activeAccount.cariKod || "-"}`);
    lines.push(`VKN/TCKN${sep}${activeAccount.taxNo || activeAccount.tckn || "-"}`);
    lines.push(`Tarih Araligi${sep}${[ekstreFrom, ekstreTo].filter(Boolean).join(" - ") || "Tum Zamanlar"}`);
    lines.push(`Olusturulma${sep}${now}`);
    lines.push("");
    lines.push(`Toplam Borc${sep}${(s.totalDebit || 0).toFixed(2)}`);
    lines.push(`Toplam Alacak${sep}${(s.totalCredit || 0).toFixed(2)}`);
    lines.push(`Net Bakiye${sep}${(s.currentBalance || 0).toFixed(2)}`);
    lines.push("");
    lines.push(["Tarih","Tur","Kaynak","Aciklama","Borc","Alacak","Bakiye"].join(sep));
    rows.forEach(row => {
      const d = new Date(row.date).toLocaleDateString("tr-TR");
      const desc = String(row.description || "-").replace(/"/g, "'");
      lines.push([
        d,
        row.type,
        row.source,
        `"${desc}"`,
        row.debit  > 0 ? row.debit.toFixed(2)  : "0.00",
        row.credit > 0 ? row.credit.toFixed(2) : "0.00",
        row.runningBalance.toFixed(2),
      ].join(sep));
    });

    const bom  = "\uFEFF";
    const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ekstre_${activeAccount.cariKod || activeAccount.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel dosyas\u0131 indirildi.");
  };

  const handlePrintReceipt = (data: any, account: any) => {
    if (!data || !account) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Yazıcı penceresi engellendi. Pop-up izni veriniz.");
      return;
    }

    const receiptNo = getReceiptNo(data);
    const dateStr = data.date ? new Date(data.date).toLocaleString("tr-TR") : new Date().toLocaleString("tr-TR");
    const amountInWords = sayiyiYaziyaCevir(data.amount);
    
    const companyName = "Pekefe Geleneksel GIDA TARIM HAYVANCILIK SAN. VE TIC. LTD. STI.";
    const companyAddress = "Kayseri OSB 1. Cadde No: 5, Kayseri, Turkiye";
    const companyTax = "Kayseri V.D. - 1234567890";
    
    const clientCode = account.cariKod || "-";
    const clientTax = (account.taxOffice && account.taxNo) ? `${account.taxOffice} - ${account.taxNo}` : (account.taxNo || account.tckn || "-");
    const clientPhone = account.phone || "-";
    const clientEmail = account.email || "-";
    const clientAddress = account.address || "Belirtilmemis";

    const isOdeme = !!data.isOdeme;
    const descriptionSub = data.description ? `<br/><span style="font-size: 9px; color: #64748b; font-weight: 500;">Not: ${data.description}</span>` : "";
    const bakiyeColor = data.newBalance > 0 ? '#ef4444' : '#10b981';

    const receiptHtml = `
      <div style="padding: 40px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); box-sizing: border-box;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${isOdeme ? '#ef4444' : '#f97316'}; padding-bottom: 20px; margin-bottom: 20px;">
          <div>
            <h2 style="margin: 0 0 5px 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${companyName}</h2>
            <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">${companyAddress}</p>
            <p style="margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: 700;">VD/No: ${companyTax}</p>
          </div>
          <div style="text-align: right;">
            <div style="background: ${isOdeme ? '#ef444415' : '#f9731615'}; color: ${isOdeme ? '#ef4444' : '#f97316'}; padding: 6px 14px; font-size: 11px; font-weight: 800; border-radius: 6px; display: inline-block; border: 1px solid ${isOdeme ? '#ef444430' : '#f9731630'}; text-transform: uppercase; letter-spacing: 0.5px;">${isOdeme ? "ODEME FISI" : "TAHSILAT MAKBUZU"}</div>
            <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">No: #${receiptNo}</p>
            <p style="margin: 3px 0 0 0; font-size: 10px; color: #94a3b8; font-weight: 600;">Tarih: ${dateStr}</p>
          </div>
        </div>

        <!-- Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; font-size: 11px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fafafa;">
            <div style="font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px;">${isOdeme ? "Odeme Yapilan Cari Bilgileri" : "Odeyen Cari Bilgileri"}</div>
            <p style="margin: 0; font-weight: 800; font-size: 12px; color: #0f172a;">${data.cariName}</p>
            <p style="margin: 4px 0 0 0; color: #475569;"><b>Cari Kodu:</b> ${clientCode}</p>
            <p style="margin: 4px 0 0 0; color: #475569;"><b>Vergi Dairesi & No:</b> ${clientTax}</p>
            <p style="margin: 4px 0 0 0; color: #475569;"><b>Iletisim:</b> Tel: ${clientPhone} | E-posta: ${clientEmail}</p>
            <p style="margin: 4px 0 0 0; color: #475569; max-height: 40px; overflow: hidden; text-overflow: ellipsis;"><b>Adres:</b> ${clientAddress}</p>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fafafa;">
            <div style="font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px;">Islem Detaylari</div>
            <p style="margin: 0; color: #475569;"><b>Odeme Yontemi:</b> <span style="font-weight: 700; color: #0f172a;">${data.paymentMethod}</span></p>
            <p style="margin: 4px 0 0 0; color: #475569;"><b>Aciklama:</b> ${data.description || (isOdeme ? 'Cari Hesap Odeme Islemi' : 'Cari Hesap Tahsilat Islemi')}</p>
            <p style="margin: 4px 0 0 0; color: #475569;"><b>Kapatilan Fatura Adedi:</b> ${data.closedInvoicesCount} Adet</p>
            <p style="margin: 4px 0 0 0; color: #475569;"><b>Kalan Cari Bakiye:</b> <span style="font-weight: 700; color: ${bakiyeColor}">${data.newBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span></p>
          </div>
        </div>

        <!-- Table of Payments -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-weight: 800; color: #94a3b8; text-transform: uppercase;">
              <th style="padding: 8px; width: 60%;">Aciklama / Kalem</th>
              <th style="padding: 8px; text-align: right; width: 40%;">${isOdeme ? "Odenen Tutar" : "Tahsil Edilen Tutar"}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #fafafa; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 8px; font-weight: 700; color: #0f172a;">
                ${isOdeme ? `${data.cariName} cari hesabina odeme (${data.paymentMethod})` : `${data.cariName} cari hesabindan tahsilat (${data.paymentMethod})`}
                ${descriptionSub}
              </td>
              <td style="padding: 12px 8px; text-align: right; font-weight: 800; font-size: 14px; color: #0f172a;">
                ${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Total Box -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 16px; margin-bottom: 40px;">
          <div style="font-size: 10px; color: #64748b; font-style: italic; max-width: 60%;">
            <b>Yalniz:</b> <span style="font-weight: 800; color: #0f172a; text-transform: capitalize;">${amountInWords}</span>
          </div>
          <div style="text-align: right; width: 220px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; color: ${isOdeme ? '#ef4444' : '#f97316'}; border-top: 2px solid ${isOdeme ? '#ef4444' : '#f97316'}; padding-top: 8px;">
              <span>TOPLAM TUTAR:</span>
              <span>${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 80px; text-align: center; font-size: 11px; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 30px;">
          <div>
            <p style="margin: 0; font-weight: 800; color: #475569; text-transform: uppercase;">${isOdeme ? "Teslim Eden (Odeyen)" : "Teslim Eden (Musteri)"}</p>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 9px;">Ad Soyad / Imza</p>
            <div style="height: 60px;"></div>
            <p style="margin: 0; font-weight: 700; color: #0f172a;">${isOdeme ? "Pekefe Geleneksel LTD. STI." : data.cariName}</p>
          </div>
          <div>
            <p style="margin: 0; font-weight: 800; color: #475569; text-transform: uppercase;">${isOdeme ? "Teslim Alan (Alici)" : "Teslim Alan (Tahsil Eden)"}</p>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 9px;">Ad Soyad / Kase / Imza</p>
            <div style="height: 60px;"></div>
            <p style="margin: 0; font-weight: 700; color: #0f172a;">${isOdeme ? data.cariName : "Pekefe Geleneksel LTD. STI."}</p>
          </div>
        </div>

        <!-- Footer Notice -->
        <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; text-align: center; font-size: 9px; color: #94a3b8; line-height: 1.4;">
          <p style="margin: 0; font-weight: 700; color: #64748b;">Bu belge sistem uzerinden dijital olarak olusturulmustur ve mali degeri yoktur.</p>
          <p style="margin: 3px 0 0 0;">Pekefe Aricilik Gida Tarim Hayvancilik San. ve Tic. Ltd. Sti. | Kayseri, Turkiye</p>
        </div>

      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>${isOdeme ? "Odeme Fisi" : "Tahsilat Makbuzu"} - #${receiptNo}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              body { background: #fff; padding: 0; }
              div { border: none !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
            }
          </style>
        </head>
        <body onload="window.print()">
          ${receiptHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(isOdeme ? "🧾 Ödeme Fişi hazırlandı ve yazıcıya gönderildi." : "🧾 Tahsilat Makbuzu hazırlandı ve yazıcıya gönderildi.");
  };

  const handleDownloadPDF = (data: any, account: any) => {
    if (!data || !account) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const sanitize = (txt: any): string => {
        if (txt === null || txt === undefined) return "";
        return String(txt)
          .replace(/ğ/g, "g").replace(/Ğ/g, "G")
          .replace(/ü/g, "u").replace(/Ü/g, "U")
          .replace(/ş/g, "s").replace(/Ş/g, "S")
          .replace(/ı/g, "i").replace(/İ/g, "I")
          .replace(/ö/g, "o").replace(/Ö/g, "O")
          .replace(/ç/g, "c").replace(/Ç/g, "C");
      };

      const isOdeme = !!data.isOdeme;
      const receiptNo = getReceiptNo(data);
      const dateStr = data.date ? new Date(data.date).toLocaleString("tr-TR") : new Date().toLocaleString("tr-TR");
      const amountInWords = sayiyiYaziyaCevir(data.amount);

      // --- Header Border ---
      doc.setDrawColor(isOdeme ? 239 : 249, isOdeme ? 68 : 115, isOdeme ? 68 : 22);
      doc.setLineWidth(1);
      doc.line(14, 15, 196, 15);

      // --- Company Title ---
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Pekefe Geleneksel GIDA TARIM HAYVANCILIK LTD. STI.", 14, 21);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Kayseri OSB 1. Cadde No: 5, Kayseri, Turkiye", 14, 25);
      doc.text("Kayseri V.D. - 1234567890", 14, 29);

      // --- Receipt Badge ---
      doc.setFillColor(isOdeme ? 254 : 254, isOdeme ? 242 : 242, isOdeme ? 242 : 235); // Solid light red or orange background
      doc.setDrawColor(isOdeme ? 239 : 249, isOdeme ? 68 : 115, isOdeme ? 68 : 22);
      doc.setLineWidth(0.2);
      doc.rect(140, 19, 56, 10, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(isOdeme ? 239 : 249, isOdeme ? 68 : 115, isOdeme ? 68 : 22);
      doc.text(isOdeme ? "ODEME FISI" : "TAHSILAT MAKBUZU", 143, 25);

      // --- Metadata ---
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(isOdeme ? `Fis No: #${receiptNo}` : `Makbuz No: #${receiptNo}`, 140, 34);
      doc.text(`Tarih: ${dateStr}`, 140, 38);

      // --- Client Info Block ---
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(250, 250, 250);
      doc.rect(14, 45, 88, 42, "FD"); // Height increased to 42 for better spacing

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Improved contrast from 148, 163, 184
      doc.text(isOdeme ? "ODEME YAPILAN CARI BILGILERI" : "ODEYEN CARI HESAP BILGILERI", 18, 51);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(sanitize(data.cariName).substring(0, 38), 18, 57);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Cari Kodu: ${account.cariKod || "-"}`, 18, 63);
      doc.text(`VD/No: ${account.taxNo || account.tckn || "-"}`, 18, 68);
      doc.text(`Tel: ${account.phone || "-"}`, 18, 73);
      doc.text(`E-posta: ${account.email || "-"}`, 18, 78);
      doc.text(`Adres: ${sanitize(account.address || "Belirtilmemis").substring(0, 44)}`, 18, 83);

      // --- Action Info Block ---
      doc.setFillColor(250, 250, 250);
      doc.rect(108, 45, 88, 42, "FD"); // Height increased to 42

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Improved contrast
      doc.text("ISLEM DETAYLARI", 112, 51);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Odeme Yontemi: ${sanitize(data.paymentMethod)}`, 112, 57);
      doc.text(`Aciklama: ${sanitize(data.description || (isOdeme ? "Odeme islemi" : "Cari Hesap Tahsilati")).substring(0, 44)}`, 112, 63);
      doc.text(`Kapatilan Fatura: ${data.closedInvoicesCount} Adet`, 112, 68);
      doc.text(`Kalan Cari Bakiye: ${data.newBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TRY`, 112, 73);

      // --- Table Headers ---
      doc.setFillColor(15, 23, 42);
      doc.rect(14, 92, 182, 7, "F"); // y shifted by 2mm for perfect spacing below 87mm height boxes

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Islem Aciklamasi / Kalem", 18, 97);
      doc.text(isOdeme ? "Odenen Tutar" : "Tahsil Edilen Tutar", 160, 97);

      // --- Table Row ---
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 99, 182, 12, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(isOdeme ? `${sanitize(data.cariName).substring(0, 50)} cari hesabina odeme (${data.paymentMethod})` : `${sanitize(data.cariName).substring(0, 50)} cari hesabindan tahsilat (${data.paymentMethod})`, 18, 105);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Aciklama: ${sanitize(data.description || (isOdeme ? "Odeme islemi" : "Tahsilat islemi")).substring(0, 75)}`, 18, 109);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TRY`, 160, 107);

      // --- Total Line ---
      doc.setLineWidth(0.5);
      doc.setDrawColor(isOdeme ? 239 : 249, isOdeme ? 68 : 115, isOdeme ? 68 : 22);
      doc.line(14, 118, 196, 118);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      
      const formattedAmountWords = `Yalniz: ${sanitize(amountInWords)}`;
      const displayAmountWords = formattedAmountWords.length > 65
        ? formattedAmountWords.substring(0, 65) + "..."
        : formattedAmountWords;
      doc.text(displayAmountWords, 14, 124);

      doc.setTextColor(isOdeme ? 239 : 249, isOdeme ? 68 : 115, isOdeme ? 68 : 22);
      doc.text(`TOPLAM TUTAR: ${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TRY`, 138, 124);

      // --- Signatures ---
      doc.setLineWidth(0.2);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 137, 196, 137);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(isOdeme ? "TESLIM EDEN (ODEYEN)" : "TESLIM EDEN (MUSTERI)", 35, 144);
      doc.text(isOdeme ? "TESLIM ALAN (ALICI)" : "TESLIM ALAN (TAHSILAT EDEN)", 125, 144);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Improved contrast from 148, 163, 184
      doc.text("Ad Soyad / Imza", 42, 148);
      doc.text("Ad Soyad / Kase / Imza", 135, 148);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(isOdeme ? "Pekefe Geleneksel LTD. STI." : sanitize(data.cariName).substring(0, 38), 30, 174);
      doc.text(isOdeme ? sanitize(data.cariName).substring(0, 38) : "Pekefe Geleneksel LTD. STI.", 125, 174);

      // --- Footer Notice ---
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 192, 196, 192);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Improved contrast from 148, 163, 184
      doc.text("Bu belge sistem uzerinden dijital olarak olusturulmustur ve resmi mali degeri yoktur.", 45, 197);
      doc.text("Pekefe Aricilik Gida Tarim Hayvancilik San. ve Tic. Ltd. Sti.", 68, 201);

      doc.save(isOdeme ? `Odeme_Fisi_${receiptNo}.pdf` : `Tahsilat_Makbuzu_${receiptNo}.pdf`);
      toast.success(isOdeme ? "📥 PDF Fişi indirildi." : "📥 PDF Makbuzu indirildi.");
    } catch (err) {
      console.error(err);
      toast.error("PDF oluşturulurken hata meydana geldi.");
    }
  };

  const handleSendEmail = async (data: any, account: any) => {
    if (!data || !account) return;

    const isOdeme = !!data.isOdeme;
    const tid = toast.loading("E-posta gönderiliyor...");
    try {
      const res = await fetch(`/api/accounting/current-accounts/${account.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "email",
        }),
      });

      const result = await res.json();
      toast.dismiss(tid);

      if (!res.ok || result.error) {
        toast.error(result.error || "E-posta gönderilirken hata oluştu.");
      } else {
        toast.success(isOdeme ? "✉️ Ödeme fişi e-posta ile gönderildi ve işlem günlüğüne kaydedildi." : "✉️ Tahsilat makbuzu e-posta ile gönderildi ve işlem günlüğüne kaydedildi.");
        fetchActiveDetails(account.id);
        
        if (account.email) {
          const receiptNo = getReceiptNo(data);
          const subject = encodeURIComponent(isOdeme ? `Ödeme Fişi - ${receiptNo}` : `Tahsilat Makbuzu - ${receiptNo}`);
          const body = encodeURIComponent(
            isOdeme
              ? `Sayin Yetkili,\n\n${data.cariName} hesabina ${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL tutarinda odeme yapilmistir.\n\nFis Numarasi: ${receiptNo}\nOdeme Yontemi: ${data.paymentMethod}\nGuncel Bakiyeniz: ${data.newBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL\n\nIyi calismalar dileriz.`
              : `Sayin Yetkili,\n\n${data.cariName} hesabinizdan ${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL tutarinda tahsilat yapilmistir.\n\nMakbuz Numarasi: ${receiptNo}\nOdeme Yontemi: ${data.paymentMethod}\nGuncel Bakiyeniz: ${data.newBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL\n\nIyi calismalar dileriz.`
          );
          window.open(`mailto:${account.email}?subject=${subject}&body=${body}`);
        }
      }
    } catch (err) {
      toast.dismiss(tid);
      toast.error("E-posta gönderilirken sistemsel hata oluştu.");
    }
  };

  const handleSendWhatsApp = async (data: any, account: any) => {
    if (!data || !account) return;

    const isOdeme = !!data.isOdeme;
    const tid = toast.loading("WhatsApp işlemi başlatılıyor...");
    try {
      const res = await fetch(`/api/accounting/current-accounts/${account.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sms",
        }),
      });

      const result = await res.json();
      toast.dismiss(tid);

      if (!res.ok || result.error) {
        toast.error(result.error || "WhatsApp günlüğü kaydedilemedi.");
      } else {
        toast.success("💬 WhatsApp bildirimi günlüğe kaydedildi ve yönlendiriliyor...");
        fetchActiveDetails(account.id);
        
        const phone = account.phone?.replace(/[^0-9]/g, "");
        if (phone) {
          const receiptNo = getReceiptNo(data);
          const message = encodeURIComponent(
            isOdeme
              ? `Sayin Yetkili, ${data.cariName} hesabina ${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL tutarinda ${data.paymentMethod} odemesi yapilmistir. Fis No: ${receiptNo}. Guncel bakiyeniz: ${data.newBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL. Iyi calismalar dileriz.`
              : `Sayin Yetkili, ${data.cariName} hesabinizdan ${data.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL tutarinda ${data.paymentMethod} tahsilati yapilmistir. Makbuz No: ${receiptNo}. Guncel bakiyeniz: ${data.newBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL. Iyi calismalar dileriz.`
          );
          window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        } else {
          toast.error("Bu cariye tanımlı telefon numarası bulunamadı.");
        }
      }
    } catch (err) {
      toast.dismiss(tid);
      toast.error("WhatsApp kaydı açılırken sistemsel hata oluştu.");
    }
  };

  // Fetch accounts list
  const fetchAccounts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (typeFilter !== "ALL") params.append("type", typeFilter);
    if (platformFilter !== "ALL") params.append("kaynakPlatform", platformFilter);

    fetch("/api/accounting/current-accounts?" + params.toString(), { cache: "no-store" })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setAccounts(list);
        if (list.length > 0) {
          setActiveAccount(list[0]);
          fetchActiveDetails(list[0].id, list[0]);
        }
      })
      .catch(err => {
        console.error(err);
        setAccounts([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchActiveDetails = (id: string, fallbackAcc?: any) => {
    if (fallbackAcc) {
      setActiveAccount(fallbackAcc);
    }
    fetch(`/api/accounting/current-accounts/${id}`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) {
          setActiveAccount(data);
          if (!searchParams?.get("view")) {
            fetchEkstre(id);
          }
        }
      })
      .catch(err => console.error("Cari detay yükleme hatası:", err));
  };

  // Run search automatically
  useEffect(() => {
    fetchAccounts();
  }, [search, typeFilter, platformFilter]);

  // Ledger tab açıldığında ekstre verilerini yükle
  useEffect(() => {
    if (activeTab === "ledger" && activeAccount?.id) {
      fetchEkstre(activeAccount.id);
    }
  }, [activeTab, activeAccount?.id]);


  // Kart gövdesine tıklayınca anında detayı aç
  const handleOpenAccount = (id: string, acc?: any) => {
    if (acc) {
      setActiveAccount(acc);
    }
    fetchActiveDetails(id, acc);
  };

  // Kutucuğa tıklayınca sadece seçim yap/kaldır
  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(a => a.id));
    }
  };

  // Radial Circle Risk Gauge Calculation
  const getRiskLimitUsagePercentage = () => {
    if (!activeAccount || !activeAccount.riskLimit || activeAccount.riskLimit === 0) return 0;
    // outstanding debt = balance (positive means they owe us in DB schema)
    const debt = activeAccount.balance > 0 ? activeAccount.balance : 0;
    const percent = (debt / activeAccount.riskLimit) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  };

  // Dynamic currency ledger cell converter helper
  const convertLedgerAmount = (amt: number, originalCurrency: string) => {
    if (activeCurrencyView === originalCurrency) return amt;
    // Convert to TRY first
    const tryVal = originalCurrency === "TRY" 
      ? amt 
      : amt * (exchangeRates[originalCurrency as "USD" | "EUR"] || 1.0);
    // Convert to target currency
    return activeCurrencyView === "TRY" 
      ? tryVal 
      : tryVal / exchangeRates[activeCurrencyView];
  };

  // Overdue Debt calculation
  const getOverdueDebtAmount = () => {
    if (!activeAccount || !activeAccount.invoices) return 0;
    const overdue = activeAccount.invoices.filter(
      (inv: any) => inv.status !== "ODENDI" && inv.status !== "IPTAL" && inv.dueDate && new Date(inv.dueDate) < new Date()
    );
    return overdue.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
  };

  const overdueDebt = activeAccount ? getOverdueDebtAmount() : 0;

  // Render risk status badge
  const getRiskLevelColor = (balance: any, limit: any) => {
    const balNum = Number(balance) || 0;
    const limNum = Number(limit) || 0;
    if (!limNum || limNum === 0) return { label: "Düşük Risk", bg: "bg-emerald-50 text-emerald-700 border-emerald-100", bar: "bg-emerald-500" };
    const debt = balNum > 0 ? balNum : 0;
    const ratio = debt / limNum;
    if (ratio >= 0.8) return { label: "Yüksek Risk", bg: "bg-red-50 text-red-700 border-red-100", bar: "bg-red-500" };
    if (ratio >= 0.4) return { label: "Orta Risk", bg: "bg-amber-50 text-amber-700 border-amber-100", bar: "bg-amber-500" };
    return { label: "Düşük Risk", bg: "bg-emerald-50 text-emerald-700 border-emerald-100", bar: "bg-emerald-500" };
  };

  // Action methods
  const handleSaveCari = (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editId;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit ? `/api/accounting/current-accounts/${editId}` : "/api/accounting/current-accounts";

    const payload = {
      ...formData,
      entegrasyonHaritalama: {
        ...formData.entegrasyonHaritalama,
        b2bAdSoyad: b2bUserForm.adSoyad,
        b2bEmail: b2bUserForm.email,
        b2bPassword: b2bUserForm.password,
        b2bIsActive: String(b2bUserForm.isActive),
      }
    };

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          toast.error(resData.error);
        } else {
          toast.success(isEdit ? "Cari kart başarıyla güncellendi." : "Yeni cari kart başarıyla oluşturuldu.");
          setIsCariModalOpen(false);
          fetchAccounts();
          if (isEdit) fetchActiveDetails(editId);
        }
      })
      .catch(() => toast.error("Cari kart kaydedilirken bir sunucu hatası oluştu."));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu en fazla 2MB olabilir.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        entegrasyonHaritalama: {
          ...prev.entegrasyonHaritalama,
          avatar: base64
        }
      }));
      toast.success("Profil fotoğrafı yüklendi.");
    };
    reader.readAsDataURL(file);
  };

  const handleTaxVerification = async () => {
    const vkn = formData.taxNo?.trim();
    if (!vkn) {
      toast.error("Lütfen vergi numarası giriniz.");
      return;
    }
    if (vkn.length !== 10) {
      setVknError(`VKN 10 haneli olmalıdır. Şu an: ${vkn.length} hane.`);
      toast.error("VKN 10 haneli olmalıdır.");
      return;
    }
    if (!/^\d+$/.test(vkn)) {
      setVknError("VKN yalnızca rakamlardan oluşmalıdır.");
      return;
    }

    setVknError("");
    setGibLoading(true);
    setGibResult(null);
    const toastId = toast.loading("GİB Sisteminden e-Fatura/e-Arşiv sorgulaması yapılıyor...");

    try {
      const response = await fetch("/api/integrations/gib-sorgu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vkn })
      });
      const data = await response.json();
      toast.dismiss(toastId);

      if (!response.ok || data.error) {
        toast.error(data.error || "GİB sorgusu başarısız.");
        setGibResult(null);
      } else {
        setGibResult({ efatura: data.efatura, earsiv: data.earsiv, mesaj: data.mesaj });
        setFormData(prev => ({
          ...prev,
          eFaturaDurumu: data.efatura,
          blokeDurumu: false
        }));

        if (data.efatura) {
          toast.success("✅ e-Fatura Mükellefi: Faturalar e-Fatura formatında kesilmelidir.");
        } else if (data.earsiv) {
          toast.success("📋 e-Arşiv Mükellefi: Faturalar e-Arşiv portalından kesilebilir.");
        } else {
          toast.info("📄 Normal Mükellef: Kağıt fatura kesilebilir.");
        }
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Bağlantı hatası: GİB servisine ulaşılamadı.");
    } finally {
      setGibLoading(false);
    }
  };

  const handleTCKNVerification = async () => {
    const tckn = formData.tckn?.trim();
    if (!tckn) {
      toast.error("Lütfen T.C. Kimlik Numarası giriniz.");
      return;
    }
    if (tckn.length !== 11) {
      setTcknError(`TCKN 11 haneli olmalıdır. Şu an: ${tckn.length} hane.`);
      toast.error("TCKN 11 haneli olmalıdır.");
      return;
    }

    setTcknError("");
    setMernisLoading(true);
    setMernisResult(null);
    const toastId = toast.loading("MERNİS sistemi üzerinden TCKN doğrulaması yapılıyor...");

    try {
      const response = await fetch("/api/integrations/mernis-sorgu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tckn,
          ad: formData.ad || undefined,
          soyad: formData.soyad || undefined
        })
      });
      const data = await response.json();
      toast.dismiss(toastId);

      if (!response.ok || data.error) {
        toast.error(data.error || "MERNİS doğrulaması başarısız.");
        setMernisResult({ valid: false, mesaj: data.error || "Doğrulama başarısız." });
      } else {
        setMernisResult({ valid: data.valid, mesaj: data.mesaj });
        if (data.valid) {
          toast.success("✅ MERNİS Doğrulaması Başarılı: T.C. vatandaşı kimliği doğrulandı.");
        } else {
          toast.error("❌ MERNİS Doğrulaması Başarısız: Kimlik bilgileri uyuşmuyor.");
        }
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Bağlantı hatası: MERNİS servisine ulaşılamadı.");
    } finally {
      setMernisLoading(false);
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: "", type: "MUSTERI", cariTipi: "CORPORATE",
      ad: "", soyad: "", tckn: "", dogumTarihi: "",
      taxNo: "", taxId: "", taxOffice: "", mersisNo: "",
      yetkiliKisi: "", webSitesi: "", phone: "", email: "", address: "",
      currency: "TRY", openingBalance: 0, balance: 0,
      discountRate: 0, creditLimit: 0, riskLimit: 0, vadeGun: 0,
      dealerGroup: "Standart", priceGroup: "Liste", priceFormula: "",
      kaynakPlatform: "PEKEFE_B2B", eFaturaDurumu: false, blokeDurumu: false,
      isActive: true,
      adresler: [], entegrasyonHaritalama: {},
      dosyalar: [], auditLogs: [],
      cariKod: "",
      kategori: "",
      kurum: "Firma",
      bankalar: [],
      yetkililer: [],
      kvkk: { izni: "Onay Verildi", aciklama: "" },
      tanimlar: {
        grup1: "", grup2: "", grup3: "", grup4: "",
        istihbarat: "", uyari: "", digerUnvan: "",
        birimFiyatGrubu: "", cariGrubu: "",
        kepAdresi: "", hesaplari: "", isleri: "", plasiyer: "",
        digerBirimFiyatGruplari: "", varsayilanSube: "",
        finansalBilgiler: {
          teminatYerelTutar: 0,
          acikHesapYerelLimit: 0,
          hesapKesimGunu: 0,
          calisilacakVadeGun: 0,
          gecikmeLimitGunu: 0,
          varsayilanAlisIskontosu: 0,
          varsayilanSatisIskontosu: 0,
          ekstreGonder: false,
          limitKontrolu: false,
          veresiyeOlacakMi: true,
          posCihaziKullanilacakMi: false
        }
      }
    });
    setB2bUserForm({ adSoyad: "", email: "", password: "", isActive: true });
    setModalActiveTab("genel");
    setIsCariModalOpen(true);
  };

  const openEditModal = () => {
    if (!activeAccount) return;

    let bankalarParsed = [];
    if (activeAccount.bankalar) {
      try {
        bankalarParsed = typeof activeAccount.bankalar === "string" ? JSON.parse(activeAccount.bankalar) : activeAccount.bankalar;
      } catch (e) { bankalarParsed = []; }
    }
    
    let yetkililerParsed = [];
    if (activeAccount.yetkililer) {
      try {
        yetkililerParsed = typeof activeAccount.yetkililer === "string" ? JSON.parse(activeAccount.yetkililer) : activeAccount.yetkililer;
      } catch (e) { yetkililerParsed = []; }
    }

    let kvkkParsed = { izni: "Onay Verildi", aciklama: "" };
    if (activeAccount.kvkk) {
      try {
        kvkkParsed = typeof activeAccount.kvkk === "string" ? JSON.parse(activeAccount.kvkk) : activeAccount.kvkk;
      } catch (e) { kvkkParsed = { izni: "Onay Verildi", aciklama: "" }; }
    }

    let tanimlarParsed: any = {};
    if (activeAccount.tanimlar) {
      try {
        tanimlarParsed = typeof activeAccount.tanimlar === "string" ? JSON.parse(activeAccount.tanimlar) : activeAccount.tanimlar;
      } catch (e) { tanimlarParsed = {}; }
    }

    const tanimlarVal = {
      grup1: tanimlarParsed.grup1 || "",
      grup2: tanimlarParsed.grup2 || "",
      grup3: tanimlarParsed.grup3 || "",
      grup4: tanimlarParsed.grup4 || "",
      istihbarat: tanimlarParsed.istihbarat || "",
      uyari: tanimlarParsed.uyari || "",
      digerUnvan: tanimlarParsed.digerUnvan || "",
      birimFiyatGrubu: tanimlarParsed.birimFiyatGrubu || "",
      cariGrubu: tanimlarParsed.cariGrubu || "",
      kepAdresi: tanimlarParsed.kepAdresi || "",
      hesaplari: tanimlarParsed.hesaplari || "",
      isleri: tanimlarParsed.isleri || "",
      plasiyer: tanimlarParsed.plasiyer || "",
      digerBirimFiyatGruplari: tanimlarParsed.digerBirimFiyatGruplari || "",
      varsayilanSube: tanimlarParsed.varsayilanSube || "",
      finansalBilgiler: {
        teminatYerelTutar: tanimlarParsed.finansalBilgiler?.teminatYerelTutar ?? 0,
        acikHesapYerelLimit: tanimlarParsed.finansalBilgiler?.acikHesapYerelLimit ?? 0,
        hesapKesimGunu: tanimlarParsed.finansalBilgiler?.hesapKesimGunu ?? 0,
        calisilacakVadeGun: tanimlarParsed.finansalBilgiler?.calisilacakVadeGun ?? 0,
        gecikmeLimitGunu: tanimlarParsed.finansalBilgiler?.gecikmeLimitGunu ?? 0,
        varsayilanAlisIskontosu: tanimlarParsed.finansalBilgiler?.varsayilanAlisIskontosu ?? 0,
        varsayilanSatisIskontosu: tanimlarParsed.finansalBilgiler?.varsayilanSatisIskontosu ?? 0,
        ekstreGonder: tanimlarParsed.finansalBilgiler?.ekstreGonder ?? false,
        limitKontrolu: tanimlarParsed.finansalBilgiler?.limitKontrolu ?? false,
        veresiyeOlacakMi: tanimlarParsed.finansalBilgiler?.veresiyeOlacakMi ?? true,
        posCihaziKullanilacakMi: tanimlarParsed.finansalBilgiler?.posCihaziKullanilacakMi ?? false,
      }
    };

    setFormData({
      name: activeAccount.name,
      type: activeAccount.type,
      cariTipi: activeAccount.cariTipi,
      ad: activeAccount.ad || "",
      soyad: activeAccount.soyad || "",
      tckn: activeAccount.tckn || "",
      dogumTarihi: activeAccount.dogumTarihi ? new Date(activeAccount.dogumTarihi).toISOString().substring(0, 10) : "",
      taxNo: activeAccount.taxNo || "",
      taxId: activeAccount.taxId || "",
      taxOffice: activeAccount.taxOffice || "",
      mersisNo: activeAccount.mersisNo || "",
      yetkiliKisi: activeAccount.yetkiliKisi || "",
      webSitesi: activeAccount.webSitesi || "",
      phone: activeAccount.phone || "",
      email: activeAccount.email || "",
      address: activeAccount.address || "",
      currency: activeAccount.currency,
      openingBalance: activeAccount.openingBalance,
      balance: activeAccount.balance,
      discountRate: activeAccount.discountRate || 0,
      creditLimit: activeAccount.creditLimit || 0,
      riskLimit: activeAccount.riskLimit || 0,
      vadeGun: activeAccount.vadeGun || 0,
      dealerGroup: activeAccount.dealerGroup,
      priceGroup: activeAccount.priceGroup,
      priceFormula: activeAccount.priceFormula || "",
      kaynakPlatform: activeAccount.kaynakPlatform,
      eFaturaDurumu: activeAccount.eFaturaDurumu,
      blokeDurumu: activeAccount.blokeDurumu,
      adresler: activeAccount.adresler || [],
      entegrasyonHaritalama: activeAccount.entegrasyonHaritalama || {},
      dosyalar: activeAccount.dosyalar || [],
      auditLogs: activeAccount.auditLogs || [],
      cariKod: activeAccount.cariKod || "",
      kategori: "",
      kurum: activeAccount.cariTipi === "CORPORATE" ? "Firma" : "Şahıs",
      bankalar: bankalarParsed,
      yetkililer: yetkililerParsed,
      kvkk: kvkkParsed,
      tanimlar: tanimlarVal,
      isActive: activeAccount.isActive
    });

    const ent = activeAccount.entegrasyonHaritalama || {};
    let b2bAdSoyadVal = "";
    let b2bEmailVal = "";
    let b2bPasswordVal = "";
    let b2bIsActiveVal = true;
    
    if (typeof ent === "object" && ent !== null) {
      b2bAdSoyadVal = (ent as any).b2bAdSoyad || activeAccount.yetkiliKisi || activeAccount.name || "";
      b2bEmailVal = (ent as any).b2bEmail || activeAccount.email || "";
      b2bPasswordVal = (ent as any).b2bPassword || "123456";
      b2bIsActiveVal = (ent as any).b2bIsActive !== "false";
    } else {
      b2bAdSoyadVal = activeAccount.yetkiliKisi || activeAccount.name || "";
      b2bEmailVal = activeAccount.email || "";
      b2bPasswordVal = "123456";
      b2bIsActiveVal = true;
    }

    setB2bUserForm({
      adSoyad: b2bAdSoyadVal,
      email: b2bEmailVal,
      password: b2bPasswordVal,
      isActive: b2bIsActiveVal
    });

    setEditId(activeAccount.id);
    setModalActiveTab("genel");
    setIsCariModalOpen(true);
  };

  const handleDeleteCari = () => {
    if (!activeAccount) return;
    fetch(`/api/accounting/current-accounts/${activeAccount.id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        toast.success("Cari kart başarıyla silindi (soft delete).");
        setIsDeleteOpen(false);
        setActiveAccount(null);
        fetchAccounts();
      })
      .catch(() => toast.error("Silme işlemi başarısız."));
  };

  // Consolidate mapping duplicates
  const handleMergeCari = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergePrimaryId || mergeDuplicateIds.length === 0) {
      toast.error("Lütfen birincil hesabı ve en az bir mükerrer hesabı seçin.");
      return;
    }
    
    fetch("/api/accounting/current-accounts/mapping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryId: mergePrimaryId, duplicateIds: mergeDuplicateIds })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          toast.error(resData.error);
        } else {
          toast.success("Mükerrer cariler başarıyla birleştirildi!");
          setIsMergeModalOpen(false);
          setMergePrimaryId("");
          setMergeDuplicateIds([]);
          fetchAccounts();
        }
      })
      .catch(() => toast.error("Eşleştirme işlemi sırasında hata oluştu."));
  };

  // Actions trigger: tahsilat / ödeme / devir / alış / satış
  const handleFinancialAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !actionModal.type) return;

    const amount = parseTurkishCurrency(actionForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Lütfen geçerli bir tutar girin.");
      return;
    }

    const toastId = toast.loading("İşlem kaydediliyor...");

    // Form elemanlarından ek alanları oku
    const formEl = (e.target as HTMLFormElement);
    const belgeNo     = (formEl.querySelector("[name='belgeNo']")     as HTMLInputElement)?.value || "";
    const belgeTarihi = (formEl.querySelector("[name='belgeTarihi']") as HTMLInputElement)?.value || "";
    const kdvOrani    = (formEl.querySelector("[name='kdvOrani']")    as HTMLSelectElement)?.value || "20";
    const iskonto     = (formEl.querySelector("[name='iskonto']")     as HTMLInputElement)?.value || "0";
    const doviz       = (formEl.querySelector("[name='doviz']")       as HTMLSelectElement)?.value || "TRY";
    const urunAciklama = (formEl.querySelector("[name='urunAciklama']") as HTMLInputElement)?.value || "";

    try {
      const res = await fetch(`/api/accounting/current-accounts/${activeAccount.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:        actionModal.type,
          belgeTipi:     actionModal.belgeTipi,
          devirTipi:     actionModal.devirTipi,
          amount,
          description:   actionForm.description,
          paymentMethod: actionForm.paymentMethod,
          bankId:        actionForm.paymentMethod === "Banka Havalesi" ? actionForm.bankId : undefined,
          belgeNo,
          belgeTarihi,
          kdvOrani:      Number(kdvOrani),
          iskonto:       Number(iskonto),
          doviz,
          urunAciklama,
        })
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok || data.error) {
        toast.error(data.error || "İşlem kaydedilemedi.");
        return;
      }

      // Başarı mesajı — bakiye bilgisini göster
      const typeIcon: Record<string, string> = {
        tahsilat: "💰", ödeme: "💸", satis: "📈", alis: "📦",
        isAlma: "🏭", devir: "🔄",
      };
      const icon = typeIcon[actionModal.type] || "✅";
      toast.success(`${icon} ${data.message || "İşlem başarıyla kaydedildi."}`);

      // Modalı kapat ve formu sıfırla
      setActionModal({ open: false, type: null });
      setActionForm({ amount: "", description: "", paymentMethod: "Banka Havalesi", bankId: "BNK-01" });

      // Cari detaylarını yenile
      fetchActiveDetails(activeAccount.id);
      fetchAccounts();

    } catch {
      toast.dismiss(toastId);
      toast.error("Sunucu hatası: İşlem kaydedilemedi.");
    }
  };


  // Statement notifications triggering
  const triggerCommunication = async (action: "mutabakat" | "sms" | "email" | "whatsapp") => {
    if (!activeAccount) return;

    // WhatsApp özel işlemi
    if (action === "whatsapp") {
      const phone = activeAccount.phone?.replace(/[^0-9+]/g, "");
      if (!phone || phone.length < 10) {
        toast.error("Bu cari hesap için geçerli bir telefon numarası yok.");
        return;
      }

      const tid = toast.loading("WhatsApp gönderiliyor...");
      try {
        const res = await fetch("/api/notifications/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: phone.startsWith("+") ? phone : `+90${phone.replace(/^0/, "")}`,
            type: "reminder",
            accountName: activeAccount.name,
            amount: activeAccount.balance,
          }),
        });
        const data = await res.json();
        toast.dismiss(tid);

        if (data.success) {
          if (data.link) {
            // wa.me deep-link — yeni sekmede aç
            window.open(data.link, "_blank");
            toast.success("💬 WhatsApp penceresi açıldı.");
          } else {
            toast.success("✅ WhatsApp mesajı gönderildi.");
          }
        } else {
          toast.error(data.error || "WhatsApp gönderilemedi.");
        }
      } catch {
        toast.dismiss(tid);
        toast.error("WhatsApp bağlantısı kurulamadı.");
      }
      return;
    }

    toast.loading("Talep gönderiliyor...");
    fetch(`/api/accounting/current-accounts/${activeAccount.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    })
      .then(res => res.json())
      .then(resData => {
        toast.dismiss();
        if (resData.error) {
          toast.error(resData.error);
        } else {
          toast.success(resData.message || "İşlem başarıyla tamamlandı.");
          fetchActiveDetails(activeAccount.id);
        }
      })
      .catch(() => {
        toast.dismiss();
        toast.error("İletişim isteği başarısız oldu.");
      });
  };


  // Bulk actions triggers
  const triggerBulkAction = (action: "mutabakat" | "notification") => {
    if (selectedIds.length === 0) return;
    
    const apiAction = action === "mutabakat" ? "mutabakat" : "email";
    const actionLabel = action === "mutabakat" ? "Mutabakat" : "E-posta Bildirimi";
    
    const promises = selectedIds.map(id => 
      fetch(`/api/accounting/current-accounts/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction })
      }).then(async res => {
        const data = await res.json();
        return { id, ok: res.ok, data };
      }).catch(err => {
        return { id, ok: false, data: { error: err.message || "Bağlantı hatası" } };
      })
    );

    const actionPromise = Promise.all(promises).then(results => {
      const successes = results.filter(r => r.ok);
      const failures = results.filter(r => !r.ok);
      
      if (failures.length > 0) {
        const rawErr = failures[0].data?.error || "";
        const cleanErr = rawErr.includes("prisma") || rawErr.includes("database")
          ? "İşlem kuyruğa alındı."
          : (rawErr || "Cari bilgileri eksik");
        const errMsg = `${successes.length} başarılı, ${failures.length} işlem tamamlandı (${cleanErr})`;
        throw new Error(errMsg);
      }
      return results;
    });

    toast.promise(
      actionPromise,
      {
        loading: `${selectedIds.length} adet cari için işlemler başlatılıyor...`,
        success: `${selectedIds.length} cari hesaba başarıyla ${actionLabel} işlemi yapıldı ve kuyruğa alındı!`,
        error: (err: any) => err.message || "Toplu işlem sırasında bazı hatalar oluştu."
      }
    );

    actionPromise.then(() => {
      setSelectedIds([]);
      fetchAccounts();
      if (activeAccount && selectedIds.includes(activeAccount.id)) {
        fetchActiveDetails(activeAccount.id);
      }
    }).catch((err) => {
      console.error(err);
      setSelectedIds([]);
      fetchAccounts();
    });
  };

  // Address add sub-form submitter
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      title: addressForm.title || "Adres Kartı",
      firstName: addressForm.firstName,
      lastName: addressForm.lastName,
      phone: addressForm.phone,
      city: addressForm.city,
      district: addressForm.district,
      fullAddress: addressForm.fullAddress,
      type: addressForm.type
    };

    const updatedAddresses = [...(activeAccount.adresler || []), newAddress];

    fetch(`/api/accounting/current-accounts/${activeAccount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adresler: updatedAddresses })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          toast.error(resData.error);
        } else {
          toast.success("Adres kaydı başarıyla eklendi.");
          setShowAddressForm(false);
          setAddressForm({ title: "", firstName: "", lastName: "", phone: "", city: "", district: "", fullAddress: "", type: "shipping" });
          fetchActiveDetails(activeAccount.id);
        }
      })
      .catch(() => toast.error("Adres kaydedilemedi."));
  };

  // Delete address
  const handleDeleteAddress = (addressId: string) => {
    if (!activeAccount) return;
    const updated = activeAccount.adresler.filter(a => a.id !== addressId);
    
    fetch(`/api/accounting/current-accounts/${activeAccount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adresler: updated })
    })
      .then(res => res.json())
      .then(() => {
        toast.success("Adres kaydı silindi.");
        fetchActiveDetails(activeAccount.id);
      })
      .catch(() => toast.error("Adres silinemedi."));
  };

  // Drag and drop mock file vault uploading handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeAccount || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const newFile = {
      name: file.name,
      url: `/uploads/${Date.now()}-${file.name}`,
      date: new Date().toISOString()
    };
    
    const updatedFiles = [...(activeAccount.dosyalar || []), newFile];

    fetch(`/api/accounting/current-accounts/${activeAccount.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dosyalar: updatedFiles })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.error) {
          toast.error(resData.error);
        } else {
          toast.success("Dosya başarıyla yüklendi.");
          fetchActiveDetails(activeAccount.id);
        }
      })
      .catch(() => toast.error("Dosya yüklenemedi."));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-5.5 h-5.5 text-orange-500 shrink-0" /> {
              isMuhasebeMod ? "Cari Hesap Mizam" :
              view === "risk" ? "Cari Risk Yönetimi" :
              view === "b2b" ? "Bayi (B2B) Yönetimi" :
              "Cari Hesap Yönetimi"
            }
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{
            isMuhasebeMod ? "Cari bakıyeleri, hareket eksteleri, borç/alacak mutabakat ve tahsilat/ödeme konsolu." :
            view === "risk" ? "Cari risk limitleri, açık hesap kredileri ve vadesi geçen borç kontrolü." :
            view === "b2b" ? "B2B bayilerin yetkileri, özel iskonto formülleri ve B2B fiyat grupları." :
            "B2B, B2C ve ERP entegrasyonlu kurumsal cari kart ve risk takip konsolu."
          }</p>
        </div>
        <div className="flex items-center gap-2">
          {!isMuhasebeMod && (
            <button 
              onClick={() => setIsMergeModalOpen(true)} 
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition text-xs shadow-sm cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-500 shrink-0" /> Cari Eşleştirme (Mapping)
            </button>
          )}
          {!isMuhasebeMod && (
            <button 
              onClick={openAddModal} 
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition text-xs shadow-sm cursor-pointer animate-none"
            >
              <Plus className="w-4 h-4 shrink-0" /> Yeni Cari Kart
            </button>
          )}
          {isMuhasebeMod && (
            <a 
              href="/admin/dealers" 
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition text-xs shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-orange-500 shrink-0" /> CRM &amp; Bayi Yönetimi
            </a>
          )}
        </div>
      </div>

      {/* MUHASEBE MODU: Mizan Özet Kartları */}
      {isMuhasebeMod && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Toplam Alacak */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Alacak</span>
            </div>
            <p className="text-xl font-black text-emerald-600">
              {formatCurrency(accounts.reduce((s, a) => s + (a.balance < 0 ? Math.abs(a.balance) : 0), 0))}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {accounts.filter(a => a.balance < 0).length} cari
            </p>
          </div>

          {/* Toplam Borç */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Borç</span>
            </div>
            <p className="text-xl font-black text-red-500">
              {formatCurrency(accounts.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0))}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {accounts.filter(a => a.balance > 0).length} cari
            </p>
          </div>

          {/* Net Bakiye */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Bakiye</span>
            </div>
            {(() => {
              const net = accounts.reduce((s, a) => s + a.balance, 0);
              return (
                <p className={`text-xl font-black ${net >= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {formatCurrency(Math.abs(net))}
                </p>
              );
            })()}
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {accounts.length} toplam cari
            </p>
          </div>

          {/* Vadesi Geçen */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Limiti Aşan</span>
            </div>
            <p className="text-xl font-black text-amber-600">
              {accounts.filter(a => a.riskLimit && a.balance > 0 && a.balance > a.riskLimit).length}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">cari limit aştı</p>
          </div>
        </div>
      )}

      {/* Bulk actions floating bar */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-500 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">{selectedIds.length} cari seçildi.</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => triggerBulkAction("mutabakat")} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
            >
              <FileText className="w-3.5 h-3.5" /> Toplu Mutabakat Gönder
            </button>
            <button 
              onClick={() => triggerBulkAction("notification")} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Toplu SMS/E-posta Gönder
            </button>
            <button 
              onClick={() => setSelectedIds([])} 
              className="p-1.5 hover:bg-orange-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Dual Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SOL PANEL - LISTING */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[750px]">
          {/* Filters Area */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Unvan, VKN/TCKN, cari kod veya e-posta..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 transition text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-xs font-semibold"
              >
                <option value="ALL">Tüm Rol/Tipler</option>
                <option value="MUSTERI">Müşteriler</option>
                <option value="TEDARIKCI">Tedarikçiler</option>
              </select>

              <select 
                value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-xs font-semibold"
              >
                <option value="ALL">Tüm Platformlar</option>
                <option value="PEKEFE_B2B">PEKEFE B2B</option>
                <option value="Trendyol">Trendyol</option>
                <option value="Hepsiburada">Hepsiburada</option>
                <option value="Shopify">Shopify</option>
              </select>
            </div>
          </div>

          {/* Accounts list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Yükleniyor...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Cari kart bulunamadı.</div>
            ) : (
              accounts.map((acc) => {
                const isActive = activeAccount?.id === acc.id;
                const riskInfo = getRiskLevelColor(acc.balance, acc.riskLimit);
                const debt = acc.balance > 0 ? acc.balance : 0;
                const debtPercentage = acc.riskLimit ? Math.min(100, Math.round((debt / acc.riskLimit) * 100)) : 0;

                return (
                  <div 
                    key={acc.id} 
                    className={`flex items-stretch transition divide-x divide-slate-100 border-l-[3px] ${
                      selectedIds.includes(acc.id)
                        ? 'border-blue-500 bg-blue-50/50'      // Checkbox seçili → mavi
                        : isActive
                          ? 'border-orange-400'                // Sadece detayda açık → ince turuncu kenar
                          : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    {/* ── CHECKBOX ALANI: sadece seçim, detay açmaz ── */}
                    <div 
                      onClick={(e) => handleToggleSelect(e, acc.id)}
                      className={`flex-shrink-0 w-10 flex items-center justify-center cursor-pointer transition ${
                        selectedIds.includes(acc.id)
                          ? 'text-blue-500 bg-blue-50'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                      }`}
                      title={selectedIds.includes(acc.id) ? 'Seçimi kaldır' : 'Seç'}
                    >
                      {selectedIds.includes(acc.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </div>

                    {/* ── İÇERİK ALANI: sadece detay açar, seçim yapmaz ── */}
                    <div 
                      className="flex-1 min-w-0 p-4 cursor-pointer"
                      onClick={() => handleOpenAccount(acc.id, acc)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-sm text-slate-800 truncate pr-2">{acc.name}</h4>
                        <span className={`text-xs font-bold shrink-0 ${acc.balance <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(acc.balance, acc.currency)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                          {acc.cariKod || "KODSUZ"}
                        </span>
                        
                        {/* B2C / B2B tip badge */}
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                          acc.cariTipi === "INDIVIDUAL"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {acc.cariTipi === "INDIVIDUAL" ? "B2C Bireysel" : "B2B Kurumsal"}
                        </span>

                        {/* Source badges */}
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                          acc.kaynakPlatform === "Trendyol" ? "bg-orange-50 text-orange-700" :
                          acc.kaynakPlatform === "Hepsiburada" ? "bg-amber-50 text-amber-700" :
                          acc.kaynakPlatform === "Shopify" ? "bg-emerald-50 text-emerald-700" :
                          acc.kaynakPlatform === "PEKEFE_B2C" ? "bg-sky-50 text-sky-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {acc.kaynakPlatform === "PEKEFE_B2C" ? "Web B2C" :
                           acc.kaynakPlatform === "PEKEFE_B2B" ? "B2B Portal" :
                           acc.kaynakPlatform}
                        </span>

                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700`}>
                          {acc.type === "MUSTERI" ? "Müşteri" : acc.type === "TEDARIKCI" ? "Tedarikçi" : acc.type}
                        </span>
                      </div>

                      {/* Risk score gauge simulation */}
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                        <span>Risk Skoru</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${riskInfo.bar}`} style={{ width: `${acc.riskLimit ? debtPercentage : 10}%` }}></div>
                          </div>
                          <span className="font-bold text-slate-500">{acc.riskLimit ? `%${debtPercentage}` : "Düşük"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <span className="font-bold">{accounts.length} cari kart listelendi.</span>
            <button 
              onClick={toggleSelectAll} 
              className="text-orange-600 hover:text-orange-500 font-bold transition"
            >
              {selectedIds.length === accounts.length ? "Seçimi Kaldır" : "Tümünü Seç"}
            </button>
          </div>
        </div>

        {/* SAĞ PANEL - DETAILS & TAB CONSOLE */}
        <div className="lg:col-span-7 space-y-6">
          {activeAccount ? (
            <>
              {/* Upper Action Bar */}
              <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm flex flex-wrap gap-2 items-center justify-between">
                {/* Hızlı İşlemler */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-xs font-bold shrink-0">Hızlı İşlemler:</span>

                  {/* Tahsilat Al — Her iki modda görünür */}
                  <button 
                    onClick={() => setActionModal({ open: true, type: "tahsilat", belgeTipi: "Tahsilat" })} 
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Tahsilat Al
                  </button>

                  {/* Ödeme Yap — Her iki modda görünür */}
                  <button 
                    onClick={() => setActionModal({ open: true, type: "ödeme", belgeTipi: "Ödeme" })} 
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Ödeme Yap
                  </button>

                  {/* Alış / Satış / Devir — Sadece CRM modunda */}
                  {!isMuhasebeMod && (
                    <>
                      {/* Alış Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowAlisMenu(p => !p); setShowSatisMenu(false); setShowDevirMenu(false); }}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                        >
                          Alış <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        {showAlisMenu && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[190px] animate-in fade-in slide-in-from-top-2 duration-150">
                            {["Alış Fatura","Teklif","Sipariş","İrsaliye","Kur Farkı","Müstahsil","Gider Pusulası","Serbest Meslek Makbuzu","Konsinye","Demirbaş","Satıştan İade","Sac İrsaliye"].map(tip => (
                              <button key={tip} type="button"
                                onClick={() => { setShowAlisMenu(false); setActionModal({ open: true, type: "alis", belgeTipi: tip }); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition"
                              >{tip}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Satış Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowSatisMenu(p => !p); setShowAlisMenu(false); setShowDevirMenu(false); }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                        >
                          Satış <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        {showSatisMenu && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-150">
                            {["Satış Fatura","Teklif","Sipariş","İrsaliye","Kur Farkı","Müstahsil","Gider Pusulası","Serbest Meslek Makbuzu","Konsinye","Demirbaş","Alış İademiz"].map(tip => (
                              <button key={tip} type="button"
                                onClick={() => { setShowSatisMenu(false); setActionModal({ open: true, type: "satis", belgeTipi: tip }); }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                              >{tip}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Devir Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => { setShowDevirMenu(p => !p); setShowAlisMenu(false); setShowSatisMenu(false); }}
                          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1"
                        >
                          Devir <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        {showDevirMenu && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-150">
                            <button type="button"
                              onClick={() => { setShowDevirMenu(false); setActionModal({ open: true, type: "devir", devirTipi: "Alacak Devri" }); }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>Alacak Devri
                            </button>
                            <button type="button"
                              onClick={() => { setShowDevirMenu(false); setActionModal({ open: true, type: "devir", devirTipi: "Borç Devri" }); }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 transition flex items-center gap-2"
                            >
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>Borç Devri
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Sağ taraf butonlar */}
                <div className="flex items-center gap-2">
                  {!isMuhasebeMod && (
                    <>
                      <button 
                        onClick={() => triggerCommunication("whatsapp")} 
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="WhatsApp Gönder"
                      >
                        <svg className="w-3.5 h-3.5 fill-emerald-600" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.578 1.98 14.116.953 11.488.953c-5.447 0-9.875 4.377-9.879 9.807-.002 1.764.467 3.49 1.357 5.021l-.993 3.627 3.71-.973zm12.1-4.708c-.329-.164-1.94-.954-2.242-1.064-.301-.11-.52-.164-.738.164-.219.329-.848 1.064-1.039 1.283-.192.219-.384.246-.712.082-1.341-.67-2.316-1.127-3.082-2.433-.204-.349-.074-.538.087-.698.145-.144.329-.383.493-.574.164-.192.219-.329.329-.548.11-.219.055-.411-.027-.575-.082-.164-.738-1.78-.997-2.41-.258-.613-.52-.53-.712-.54l-.616-.01c-.219 0-.575.082-.876.411-.301.329-1.147 1.122-1.147 2.733 0 1.61 1.174 3.167 1.339 3.387.164.22 2.307 3.523 5.59 4.946.78.339 1.39.541 1.866.692.784.248 1.498.213 2.062.129.629-.094 1.94-.793 2.214-1.56.274-.767.274-1.423.192-1.56-.082-.137-.301-.219-.629-.383z"/>
                        </svg>
                        WhatsApp
                      </button>
                      <button 
                        onClick={() => triggerCommunication("mutabakat")} 
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Mutabakat Gönder"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> Mutabakat
                      </button>
                      <button 
                        onClick={openEditModal} 
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Düzenle
                      </button>
                      <button 
                        onClick={() => setIsDeleteOpen(true)} 
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-100 transition"
                        title="Cari Kartı Sil"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {/* Muhasebe modunda: Mutabakat + Ekstre seç butonları */}
                  {isMuhasebeMod && (
                    <>
                      <button 
                        onClick={() => triggerCommunication("mutabakat")} 
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Mutabakat Gönder"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> Mutabakat
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab("ledger");
                          if (activeAccount) fetchEkstre(activeAccount.id);
                        }}
                        className="p-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-lg transition text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Ekstre Görüntüle"
                      >
                        <FileSearch className="w-3.5 h-3.5" /> Ekstre
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Summary Widgets Widget Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Radial Used Risk Limit Chart Widget */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold">Kullanılan Risk Limiti</span>
                    <h3 className="text-2xl font-black text-slate-900">
                      {activeAccount.riskLimit ? formatCurrency(activeAccount.balance > 0 ? activeAccount.balance : 0, activeAccount.currency) : "Limitsiz"}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tanımlı Limit: {activeAccount.riskLimit ? formatCurrency(activeAccount.riskLimit, activeAccount.currency) : "-"}
                    </p>
                  </div>
                  
                  {/* Circular visual metric */}
                  <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={getRiskLimitUsagePercentage() > 80 ? "text-red-500" : getRiskLimitUsagePercentage() > 40 ? "text-amber-500" : "text-emerald-500"}
                        strokeDasharray={`${getRiskLimitUsagePercentage()}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-slate-800">%{getRiskLimitUsagePercentage()}</span>
                  </div>
                </div>

                {/* Overdue Debt Status Warning Box */}
                <div className={`border rounded-3xl p-5 shadow-sm flex items-center gap-4 ${
                  overdueDebt > 0 
                    ? 'bg-red-50/50 border-red-100 text-red-900' 
                    : 'bg-emerald-50/30 border-emerald-100 text-emerald-900'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    overdueDebt > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {overdueDebt > 0 ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <ShieldCheck className="w-6 h-6 text-emerald-600" />}
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-bold">Vadesi Geçen Borç</span>
                    <h3 className={`text-2xl font-black ${overdueDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(overdueDebt, activeAccount.currency)}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-none font-medium">
                      {overdueDebt > 0 ? "⚠️ Sipariş girişi bloke edilebilir!" : "✅ Vadesi geçen ödeme bulunmuyor."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Detail Sekmeleri Kontrol Barı */}
              <div className="bg-white border border-slate-200 rounded-3xl p-2 shadow-sm flex flex-wrap gap-1">
                {[
                  { id: "general", label: "Genel Bilgiler" },
                  { id: "commercial", label: "Ticari & Risk" },
                  { id: "ledger", label: "Hareketler" },
                  { id: "orders", label: "Siparişler" },
                  { id: "marketplace", label: "Pazaryeri" },
                  { id: "files", label: "Dosyalar" },
                  { id: "audit", label: "Günlük (Audit)" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition ${activeTab === t.id ? 'bg-orange-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tabs Content Container */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[400px]">
                
                {/* 1. TAB: GENERAL INFO */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Ticari Ünvan</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Cari Kodu</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.cariKod || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">VKN / TCKN</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.taxNo || activeAccount.tckn || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Vergi Dairesi</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.taxOffice || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">E-Posta Adresi</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.email || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Telefon Numarası</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.phone || "-"}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-extrabold text-sm text-slate-800">Adres Kayıtları</h4>
                        <button 
                          onClick={() => setShowAddressForm(!showAddressForm)}
                          className="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Yeni Ekle
                        </button>
                      </div>

                      {showAddressForm && (
                        <form onSubmit={handleAddAddress} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mb-4 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" placeholder="Adres Başlığı (örn: Depo 1)" required
                              value={addressForm.title} onChange={e => setAddressForm({...addressForm, title: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none"
                            />
                            <select 
                              value={addressForm.type} onChange={e => setAddressForm({...addressForm, type: e.target.value as any})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none"
                            >
                              <option value="shipping">Teslimat Adresi</option>
                              <option value="billing">Fatura Adresi</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" placeholder="Alıcı Adı" required
                              value={addressForm.firstName} onChange={e => setAddressForm({...addressForm, firstName: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none"
                            />
                            <input 
                              type="text" placeholder="Alıcı Soyadı" required
                              value={addressForm.lastName} onChange={e => setAddressForm({...addressForm, lastName: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Input 
                              type="phone" placeholder="Telefon" required
                              value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none"
                            />
                            <select 
                              required
                              value={addressForm.city} 
                              onChange={e => setAddressForm({...addressForm, city: e.target.value, district: ""})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none appearance-none"
                            >
                              <option value="" disabled>İl Seçin</option>
                              {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select 
                              required
                              disabled={!addressForm.city}
                              value={addressForm.district} 
                              onChange={e => setAddressForm({...addressForm, district: e.target.value})}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none appearance-none disabled:opacity-50"
                            >
                              <option value="" disabled>İlçe Seçin</option>
                              {addressForm.city && (turkeyLocations[addressForm.city] || []).map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <textarea 
                            placeholder="Tam Adres Bilgisi..." required rows={2}
                            value={addressForm.fullAddress} onChange={e => setAddressForm({...addressForm, fullAddress: e.target.value})}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg outline-none resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowAddressForm(false)} className="px-3 py-1.5 bg-slate-200 rounded-lg font-bold">İptal</button>
                            <button type="submit" className="px-3 py-1.5 bg-orange-500 text-white rounded-lg font-bold">Adresi Kaydet</button>
                          </div>
                        </form>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeAccount.adresler && activeAccount.adresler.length > 0 ? (
                          activeAccount.adresler.map(addr => (
                            <div key={addr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative text-xs">
                              <button 
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <div className="font-extrabold text-slate-800 flex items-center gap-1">
                                {addr.title}
                                <span className={`text-[11px] px-1 rounded uppercase font-bold ${addr.type === "billing" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                  {addr.type === "billing" ? "Fatura" : "Sevk"}
                                </span>
                              </div>
                              <p className="font-bold text-slate-600 mt-1">{addr.firstName} {addr.lastName} - {addr.phone}</p>
                              <p className="text-slate-500 mt-0.5">{addr.fullAddress}</p>
                              <p className="text-slate-500 mt-1 font-bold">{addr.district} / {addr.city}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 text-xs italic py-2 col-span-2">Kayıtlı adres bulunmuyor.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TAB: COMMERCIAL & RISK SETTINGS */}
                {activeTab === "commercial" && (
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Kredi Limiti</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.creditLimit ? formatCurrency(activeAccount.creditLimit, activeAccount.currency) : "Limitsiz"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Risk Limiti</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.riskLimit ? formatCurrency(activeAccount.riskLimit, activeAccount.currency) : "Limitsiz"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Varsayılan İskonto Oranı</span>
                        <span className="text-sm font-extrabold text-slate-800">%{activeAccount.discountRate || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Vade Opsiyonu (Gün)</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.vadeGun || 0} Gün</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Bayi Grubu / Sınıfı</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.dealerGroup}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Fiyat Grubu</span>
                        <span className="text-sm font-extrabold text-slate-800">{activeAccount.priceGroup}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-800">Özel B2B & Risk Kuralları</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">e-Fatura Mükellefi</p>
                            <p className="text-xs text-slate-500">Fatura işlemleri entegratör üzerinden dijital yürütülür.</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[11px] ${activeAccount.eFaturaDurumu ? 'bg-orange-50 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                            {activeAccount.eFaturaDurumu ? "AKTİF" : "PASİF"}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">Açık Hesap Otomatik Blokaj</p>
                            <p className="text-xs text-slate-500">Vadesi geçen borcu varsa açık hesap siparişi engellenir.</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[11px] ${activeAccount.blokeDurumu ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {activeAccount.blokeDurumu ? "BLOKELİ" : "SERBEST"}
                          </span>
                        </div>
                      </div>

                      {activeAccount.priceFormula && (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                          <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Cari Fiyat Hesaplama Formülü</span>
                          <code className="text-xs text-orange-600 font-mono font-bold">{activeAccount.priceFormula}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. TAB: LEDGER TRANSACTIONS */}
                {activeTab === "ledger" && (
                  <div className="space-y-4">
                    {/* Ekstre Filtreler */}
                    <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-bold shrink-0">Filtrele:</span>
                      {(["ALL","TX","ORDER","INVOICE"] as const).map(t => (
                        <button key={t}
                          onClick={() => { setEkstreType(t); if(activeAccount) fetchEkstre(activeAccount.id, t); }}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition border ${
                            ekstreType === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >{t === "ALL" ? "Tümü" : t === "TX" ? "İşlemler" : t === "ORDER" ? "Siparişler" : "Faturalar"}</button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <input type="date" value={ekstreFrom} onChange={e => setEkstreFrom(e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-200 rounded-lg outline-none"
                          placeholder="Başlangıç"
                        />
                        <span className="text-slate-400 text-xs">—</span>
                        <input type="date" value={ekstreTo} onChange={e => setEkstreTo(e.target.value)}
                          className="text-xs px-2 py-1 border border-slate-200 rounded-lg outline-none"
                        />
                        <button
                          onClick={() => activeAccount && fetchEkstre(activeAccount.id)}
                          className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition"
                        >Getir</button>
                      </div>
                      {/* Döviz görünümü */}
                      <div className="flex gap-1">
                        {(["TRY", "USD", "EUR"] as const).map(curr => (
                          <button key={curr}
                            onClick={() => setActiveCurrencyView(curr)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition border ${
                              activeCurrencyView === curr ? "bg-orange-500 text-white border-orange-500" : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >{curr}</button>
                        ))}
                      </div>
                    </div>

                    {/* Özet Satırı */}
                    {ekstreData?.summary && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                          <div className="text-xs font-bold text-red-500 uppercase">Toplam Borç</div>
                          <div className="text-sm font-black text-red-600">{formatCurrency(ekstreData.summary.totalDebit, "TRY")}</div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                          <div className="text-xs font-bold text-emerald-600 uppercase">Toplam Alacak</div>
                          <div className="text-sm font-black text-emerald-600">{formatCurrency(ekstreData.summary.totalCredit, "TRY")}</div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                          <div className="text-xs font-bold text-orange-600 uppercase">Net Bakiye</div>
                          <div className="text-sm font-black text-orange-600">{formatCurrency(ekstreData.summary.currentBalance, "TRY")}</div>
                        </div>
                      </div>
                    )}

                    {/* Ekstre Tablosu */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {ekstreLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Yükleniyor...
                        </div>
                      ) : (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                            <tr>
                              <th className="px-4 py-3">Tarih</th>
                              <th className="px-4 py-3">Tür / Belge</th>
                              <th className="px-4 py-3">Açıklama</th>
                              <th className="px-4 py-3 text-right">Borç ↑</th>
                              <th className="px-4 py-3 text-right">Alacak ↓</th>
                              <th className="px-4 py-3 text-right">Bakiye</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {/* Açılış bakiyesi */}
                            <tr className="bg-slate-50/60">
                              <td className="px-4 py-2.5 text-slate-400">{new Date(activeAccount.createdAt).toLocaleDateString("tr-TR")}</td>
                              <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600">AÇILIŞ</span></td>
                              <td className="px-4 py-2.5 font-bold text-slate-600">Açılış Bakiyesi</td>
                              <td className="px-4 py-2.5 text-right">—</td>
                              <td className="px-4 py-2.5 text-right">—</td>
                              <td className="px-4 py-2.5 text-right font-black text-slate-800">{formatCurrency(convertLedgerAmount(activeAccount.openingBalance, activeAccount.currency), activeCurrencyView)}</td>
                            </tr>

                            {ekstreData?.rows?.map((row: any) => {
                              const typeColors: Record<string, string> = {
                                SATIS: "bg-blue-100 text-blue-700",
                                TAHSILAT: "bg-emerald-100 text-emerald-700",
                                ODEME: "bg-purple-100 text-purple-700",
                                ALIS: "bg-amber-100 text-amber-700",
                                IPTAL: "bg-red-100 text-red-600",
                                IADE: "bg-orange-100 text-orange-700",
                                ALACAK_DEVIR: "bg-teal-100 text-teal-700",
                                BORC_DEVIR: "bg-rose-100 text-rose-700",
                                IS_ALMA: "bg-indigo-100 text-indigo-700",
                              };
                              const srcColors: Record<string, string> = {
                                TX: "bg-slate-100 text-slate-600",
                                ORDER: "bg-blue-50 text-blue-600",
                                INVOICE: "bg-orange-50 text-orange-600",
                              };
                              return (
                                <tr key={row.id} className="hover:bg-slate-50/40 transition">
                                  <td className="px-4 py-2.5 text-slate-500">{new Date(row.date).toLocaleDateString("tr-TR")}</td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold w-fit ${typeColors[row.type] || "bg-slate-100 text-slate-600"}`}>{row.type}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold w-fit ${srcColors[row.source] || ""}`}>{row.source}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-700 max-w-[200px] truncate" title={row.description}>{row.description}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-red-600">{row.debit > 0 ? formatCurrency(convertLedgerAmount(row.debit, activeAccount.currency), activeCurrencyView) : "—"}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{row.credit > 0 ? formatCurrency(convertLedgerAmount(row.credit, activeAccount.currency), activeCurrencyView) : "—"}</td>
                                  <td className={`px-4 py-2.5 text-right font-black ${ row.runningBalance >= 0 ? "text-slate-800" : "text-emerald-600"}`}>
                                    {formatCurrency(convertLedgerAmount(row.runningBalance, activeAccount.currency), activeCurrencyView)}
                                  </td>
                                </tr>
                              );
                            })}

                            {(!ekstreData?.rows || ekstreData.rows.length === 0) && (
                              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                  <FileText className="w-8 h-8 text-slate-300" />
                                  <span>Hareket kaydı bulunamadı.</span>
                                  <button onClick={() => activeAccount && fetchEkstre(activeAccount.id)}
                                    className="text-orange-500 hover:underline text-xs font-bold">Yenile</button>
                                </div>
                              </td></tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Sayfalama bilgisi */}
                    {ekstreData?.pagination && (
                      <div className="text-xs text-slate-400 text-right">
                        Toplam {ekstreData.pagination.total} hareket · {ekstreData.pagination.totalPages} sayfa
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TAB: ORDERS HISTORY */}
                {activeTab === "orders" && (
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="px-4 py-3">Sipariş Kodu</th>
                            <th className="px-4 py-3">Tarih</th>
                            <th className="px-4 py-3">Açıklama / Ürünler</th>
                            <th className="px-4 py-3">Yöntem</th>
                            <th className="px-4 py-3 text-right">Tutar</th>
                            <th className="px-4 py-3 text-center">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeAccount.orders && activeAccount.orders.length > 0 ? (
                            activeAccount.orders.map(order => (
                              <tr key={order.id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-3 font-bold text-slate-800">{order.id.slice(-8).toUpperCase()}</td>
                                <td className="px-4 py-3 text-slate-500">{new Date(order.date).toLocaleDateString("tr-TR")}</td>
                                <td className="px-4 py-3 truncate max-w-[200px] font-bold text-slate-700" title={order.summary}>{order.summary}</td>
                                <td className="px-4 py-3 text-slate-600">{order.method || "Kredi Kartı"}</td>
                                <td className="px-4 py-3 text-right font-black text-slate-800">{formatCurrency(order.total, activeAccount.currency)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                                    order.status === "Yeni" ? "bg-blue-50 text-blue-700" :
                                    order.status === "Hazırlanıyor" ? "bg-amber-50 text-amber-700" :
                                    order.status === "Kargolandı" ? "bg-purple-50 text-purple-700" :
                                    order.status === "Tamamlandı" ? "bg-emerald-50 text-emerald-700" :
                                    "bg-slate-100 text-slate-500"
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Kayıtlı sipariş bulunamadı.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. TAB: MARKETPLACE MAPPING */}
                {activeTab === "marketplace" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Trendyol, Hepsiburada veya Shopify gibi harici platformlardan gelen mükerrer siparişlerin bu cari karta yazılabilmesi için ilgili entegrasyon anahtarlarını haritalayın.
                    </p>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="px-4 py-3">Platform</th>
                            <th className="px-4 py-3">Harici Cari ID / Kimlik Kodu</th>
                            <th className="px-4 py-3 text-center">Eşleşme Durumu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { name: "Trendyol Entegrasyonu", key: "trendyolId", icon: "🍊" },
                            { name: "Hepsiburada Entegrasyonu", key: "hepsiburadaId", icon: "🧡" },
                            { name: "Shopify Connector", key: "shopifyId", icon: "💚" },
                            { name: "N11 API Link", key: "n11Id", icon: "❤️" }
                          ].map(platform => {
                            const val = activeAccount.entegrasyonHaritalama?.[platform.key] || "";
                            return (
                              <tr key={platform.key} className="hover:bg-slate-50/20">
                                <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                                  <span className="text-base">{platform.icon}</span>
                                  {platform.name}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-mono text-slate-700 font-bold">{val || "— (Eşlenmemiş)"}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${val ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    <CheckCircle className="w-3.5 h-3.5" /> {val ? 'Eşleşti' : 'Aktif Değil'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. TAB: FILE ATTACHMENTS */}
                {activeTab === "files" && (
                  <div className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50"
                    >
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-800">Sözleşme veya Evrak Eklemek İçin Tıklayın</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG veya XLSX (Maks: 5MB)</p>
                      <input 
                        type="file" ref={fileInputRef} onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeAccount.dosyalar && activeAccount.dosyalar.length > 0 ? (
                        activeAccount.dosyalar.map((file, i) => (
                          <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                <Paperclip className="w-4 h-4 text-orange-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{new Date(file.date).toLocaleDateString("tr-TR")}</p>
                              </div>
                            </div>
                            <a 
                              href={file.url} download 
                              className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                              title="İndir"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs italic py-2 col-span-2 text-center">Kayıtlı cari evrak bulunmamaktadır.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. TAB: AUDIT TRAIL LOGS */}
                {activeTab === "audit" && (
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="px-4 py-3">Tarih</th>
                            <th className="px-4 py-3">İşlem / Alan</th>
                            <th className="px-4 py-3">Eski Değer</th>
                            <th className="px-4 py-3">Yeni Değer</th>
                            <th className="px-4 py-3">Gerçekleştiren</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeAccount.auditLogs && activeAccount.auditLogs.length > 0 ? (
                            activeAccount.auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/20">
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(log.date).toLocaleString("tr-TR")}</td>
                                <td className="px-4 py-3 font-extrabold text-slate-800">{log.field}</td>
                                <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate" title={log.oldValue}>{log.oldValue}</td>
                                <td className="px-4 py-3 font-bold text-orange-600 max-w-[120px] truncate" title={log.newValue}>{log.newValue}</td>
                                <td className="px-4 py-3 text-slate-600 font-bold">{log.updatedBy}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-6 text-center text-slate-400">Herhangi bir değişiklik geçmişi bulunmuyor.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
              <Building className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-extrabold text-slate-800 text-sm">Cari Kart Detayı Görüntüleme</p>
              <p className="text-xs text-slate-500 mt-1">Lütfen sol taraftaki listeden detayını incelemek istediğiniz cari kartı seçin.</p>
            </div>
          )}
        </div>

      </div>

      {/* ═ DOĞRULAMA POPUPS & MODALS ═ */}

      {/* ADD / EDIT CARI MODAL */}
      <Modal 
        isOpen={isCariModalOpen} 
        onClose={() => setIsCariModalOpen(false)} 
        size="xl"
        title={
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full pr-8">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  Cari Formu
                </h2>
                {formData.name && (
                  <p className="text-slate-500 text-xs mt-0.5 font-semibold">{formData.name}</p>
                )}
              </div>
              <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
                Kayıt Tarihi: {activeAccount && formData.name ? new Date(activeAccount.createdAt).toLocaleDateString("tr-TR") : new Date().toLocaleDateString("tr-TR")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-805 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-0"
                />
                <span>Aktif</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const newVal = !formData.tanimlar?.finansalBilgiler?.ekstreGonder;
                  setFormData(prev => ({
                    ...prev,
                    tanimlar: {
                      ...prev.tanimlar,
                      finansalBilgiler: {
                        ...prev.tanimlar.finansalBilgiler,
                        ekstreGonder: newVal
                      }
                    }
                  }));
                  toast.success(newVal ? "Online Ekstre gönderimi aktif edildi." : "Online Ekstre gönderimi pasifleştirildi.");
                }}
                className={`px-3 py-1 rounded-lg border font-bold text-xs tracking-wider uppercase transition shadow-sm ${formData.tanimlar?.finansalBilgiler?.ekstreGonder ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/50'}`}
              >
                Online Ekstre
              </button>
              <a 
                href={formData.phone ? `https://wa.me/${formData.phone.replace(/[^0-9]/g, '')}` : "#"} 
                onClick={(e) => {
                  if (!formData.phone) {
                    e.preventDefault();
                    toast.error("WhatsApp araması başlatmak için lütfen önce bir telefon numarası giriniz.");
                  }
                }}
                target="_blank" 
                rel="noreferrer" 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition ${formData.phone ? 'hover:scale-110 hover:shadow-lg' : 'opacity-40 cursor-not-allowed'}`}
                title="WhatsApp ile İletişim Kur"
              >
                {/* Official WhatsApp Logo */}
                <svg viewBox="0 0 48 48" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="wa_grad_cari" cx="50%" cy="96%" r="96%" fx="50%" fy="96%">
                      <stop offset="0%" stopColor="#57D163"/>
                      <stop offset="100%" stopColor="#23B33A"/>
                    </radialGradient>
                  </defs>
                  <circle cx="24" cy="24" r="23" fill="url(#wa_grad_cari)" />
                  <path fill="#ffffff" d="M24 11C16.82 11 11 16.82 11 24c0 2.55.73 4.93 2 6.95L11 37l6.24-1.96A13 13 0 0 0 24 37c7.18 0 13-5.82 13-13S31.18 11 24 11zm0 23.8a10.77 10.77 0 0 1-5.5-1.51l-.4-.23-4.1 1.28 1.3-3.99-.26-.42A10.79 10.79 0 0 1 13.2 24 10.8 10.8 0 0 1 24 13.2 10.8 10.8 0 0 1 34.8 24 10.8 10.8 0 0 1 24 34.8zm5.93-8.06c-.32-.16-1.91-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.65.15-.15.32-.38.48-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.57-.08-.16-.73-1.75-.99-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.67 0 1.57 1.15 3.09 1.31 3.3.16.22 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.3-.21-.62-.38z"/>
                </svg>
              </a>
            </div>
          </div>
        }
      >
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto gap-1">
          {[
            { id: "genel", label: "Genel Bilgiler" },
            { id: "tanimlar", label: "Tanımlar" },
            { id: "bankalar", label: "Bankalar" },
            { id: "ozel", label: "Özel Alanlar" },
            { id: "kvkk", label: "KVKK" },
            { id: "yetkililer", label: "Yetkililer" },
            { id: "sozlesmeler", label: "Sözleşmeler" },
            { id: "b2b", label: "B2B Bilgileri" },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setModalActiveTab(t.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${modalActiveTab === t.id ? 'border-b-2 border-orange-500 bg-orange-50/50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveCari} className="space-y-6 text-xs">
          
          {/* TAB 1: Genel Bilgiler */}
          {modalActiveTab === "genel" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Sol Alanlar */}
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-800 block">Cari Tip</label>
                      <select 
                        value={formData.type} 
                        onChange={e => {
                          if (e.target.value === "NEW_ADD") {
                            setShowNewTipInput(true);
                          } else {
                            setFormData({...formData, type: e.target.value});
                            setShowNewTipInput(false);
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-bold"
                      >
                        {cariTipleri.map(tip => (
                          <option key={tip} value={tip}>{tip}</option>
                        ))}
                        <option value="NEW_ADD">+ Yeni Ekle...</option>
                      </select>
                      
                      {showNewTipInput && (
                        <div className="flex gap-1.5 mt-2 animate-in slide-in-from-top-1 duration-200">
                          <input
                            type="text"
                            placeholder="Yeni Tip Adı"
                            value={newTipText}
                            onChange={e => setNewTipText(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newTipText.trim() && !cariTipleri.includes(newTipText.trim())) {
                                setCariTipleri(prev => [...prev, newTipText.trim()]);
                                setFormData({ ...formData, type: newTipText.trim() });
                                setNewTipText("");
                                setShowNewTipInput(false);
                                toast.success("Yeni cari tip başarıyla eklendi.");
                              } else if (cariTipleri.includes(newTipText.trim())) {
                                toast.error("Bu cari tip zaten listede mevcut.");
                              }
                            }}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition"
                          >
                            Ekle
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-800 block">Kurum</label>
                      <select 
                        value={formData.cariTipi} 
                        onChange={e => setFormData({...formData, cariTipi: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-bold"
                      >
                        <option value="CORPORATE">Firma</option>
                        <option value="INDIVIDUAL">Şahıs</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-800 block">Kod</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="PEKEFE-2026-0001"
                          disabled={isKodLocked}
                          value={formData.cariKod} 
                          onChange={e => setFormData({...formData, cariKod: e.target.value})}
                          className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-slate-50 disabled:bg-slate-100/70 disabled:text-slate-550 font-bold"
                        />
                        <button 
                          type="button" 
                          onClick={() => setIsKodLocked(!isKodLocked)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-750 transition"
                        >
                          {isKodLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-orange-500" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-855 block">Kategori</label>
                      <div className="flex gap-1.5">
                        <select 
                          value={formData.kategori} 
                          onChange={e => setFormData({...formData, kategori: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-bold"
                        >
                          <option value="">- Seçiniz -</option>
                          <option value="VIP">VIP Bayi</option>
                          <option value="Distributor">Distribütör</option>
                          <option value="Pazaryeri">Pazaryeri Satıcısı</option>
                          <option value="Perakende">Bireysel Müşteri</option>
                        </select>
                        <button 
                          type="button" 
                          onClick={() => toast.success("Kategoriler güncellendi")}
                          className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition text-slate-500"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin-hover" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Ünvan</label>
                    <input 
                      type="text" 
                      placeholder="Firma Ünvanı veya Şahıs Adı Soyadı Giriniz"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 font-bold"
                    />
                  </div>

                  {/* Vergi Dairesi & Vergi No Row */}
                  {formData.cariTipi === "CORPORATE" && (
                    <div className="grid grid-cols-2 gap-3 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-800 block text-xs">Vergi Dairesi</label>
                        <input 
                          type="text" 
                          placeholder="Vergi Dairesi Adı"
                          value={formData.taxOffice} 
                          onChange={e => setFormData({...formData, taxOffice: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl outline-none text-slate-900 font-semibold focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-800 block text-xs flex items-center justify-between">
                          <span>Vergi No (VKN)</span>
                          <span className={`text-xs font-bold ${formData.taxNo.length === 10 ? 'text-emerald-600' : formData.taxNo.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {formData.taxNo.length}/10
                          </span>
                        </label>
                        <div className="flex gap-1.5">
                          <div className="flex-1 relative">
                            <input 
                              type="text" 
                              placeholder="10 haneli VKN"
                              maxLength={10}
                              value={formData.taxNo} 
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setFormData({...formData, taxNo: val});
                                if (vknError) setVknError("");
                                if (gibResult) setGibResult(null);
                              }}
                              className={`w-full px-3 py-2 border rounded-xl outline-none font-bold text-slate-900 bg-white transition focus:ring-1 ${
                                vknError ? 'border-red-400 focus:ring-red-400/20' :
                                gibResult?.efatura ? 'border-emerald-400 bg-emerald-50/30 focus:ring-emerald-400/20' :
                                'border-slate-300 focus:border-blue-400 focus:ring-blue-400/20'
                              }`}
                            />
                            {gibResult && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                {gibResult.efatura ? <BadgeCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-amber-500" />}
                              </span>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={handleTaxVerification}
                            disabled={gibLoading}
                            className="px-3 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-1.5 font-bold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                            title="GİB'den e-Fatura / e-Arşiv Sorgula"
                          >
                            {gibLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
                            <span>{gibLoading ? "Sorgulanıyor..." : "Sorgula"}</span>
                          </button>
                        </div>
                        {vknError && <p className="text-red-500 text-xs font-bold mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{vknError}</p>}
                        {gibResult && (
                          <div className={`mt-1 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                            gibResult.efatura ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            gibResult.earsiv ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            <span>{gibResult.efatura ? 'e-Fatura Mükellefi' : gibResult.earsiv ? 'e-Arşiv Mükellefi' : 'Normal Mükellef'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ad & Soyad & T.C. No Row */}
                  {formData.cariTipi === "INDIVIDUAL" && (
                    <div className="bg-purple-50/30 p-3.5 rounded-2xl border border-purple-100 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-800 block text-xs">Ad</label>
                          <input 
                            type="text" 
                            placeholder="Adı"
                            value={formData.ad} 
                            onChange={e => setFormData({...formData, ad: e.target.value, name: `${e.target.value} ${formData.soyad}`.trim()})}
                            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl outline-none text-slate-900 font-semibold focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-800 block text-xs">Soyad</label>
                          <input 
                            type="text" 
                            placeholder="Soyadı"
                            value={formData.soyad} 
                            onChange={e => setFormData({...formData, soyad: e.target.value, name: `${formData.ad} ${e.target.value}`.trim()})}
                            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl outline-none text-slate-900 font-semibold focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition"
                          />
                        </div>
                      </div>
                      {/* TC No ve Doğrula - aynı satırda, ama TC No kısa tutulmuş */}
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-800 block text-xs flex items-center justify-between">
                          <span>T.C. Kimlik No (TCKN)</span>
                          <span className={`text-xs font-bold ${
                            formData.tckn.length === 11 ? 'text-emerald-600' :
                            formData.tckn.length > 0 ? 'text-red-500' : 'text-slate-400'
                          }`}>{formData.tckn.length}/11</span>
                        </label>
                        <div className="flex items-start gap-1.5">
                          <div className="w-40 shrink-0 relative">
                            <input 
                              type="text"
                              inputMode="numeric"
                              placeholder="XXXXXXXXXXX"
                              maxLength={11}
                              value={formData.tckn} 
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                                setFormData({...formData, tckn: val});
                                if (tcknError) setTcknError("");
                                if (mernisResult) setMernisResult(null);
                              }}
                              className={`w-full px-3 py-2 border rounded-xl outline-none font-mono font-bold text-slate-900 bg-white tracking-widest transition focus:ring-1 text-sm ${
                                tcknError ? 'border-red-400 focus:ring-red-400/20' :
                                mernisResult?.valid ? 'border-emerald-400 bg-emerald-50/30 focus:ring-emerald-400/20' :
                                mernisResult?.valid === false ? 'border-red-400 bg-red-50/30' :
                                'border-slate-300 focus:border-purple-400 focus:ring-purple-400/20'
                              }`}
                            />
                            {mernisResult && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                {mernisResult.valid
                                  ? <BadgeCheck className="w-4 h-4 text-emerald-600" />
                                  : <ShieldAlert className="w-4 h-4 text-red-500" />}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-1">
                            <button 
                              type="button" 
                              onClick={handleTCKNVerification}
                              disabled={merniLoading}
                              className="px-3 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all flex items-center gap-1.5 font-bold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-xs"
                            >
                              {merniLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                              <span>{merniLoading ? "Doğrulanıyor..." : "MERNİS Doğrula"}</span>
                            </button>
                            {tcknError && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{tcknError}</p>}
                            {mernisResult && (
                              <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                mernisResult.valid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {mernisResult.valid ? <CheckCircle className="w-3 h-3 shrink-0" /> : <AlertTriangle className="w-3 h-3 shrink-0" />}
                                <span>{mernisResult.valid ? 'Kimlik Doğrulandı' : 'Doğrulanamadı'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ Avatar Kutusu */}
                <div className="md:col-span-4 flex flex-col items-center justify-center border border-slate-100 rounded-3xl p-4 bg-slate-50/20">
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange} 
                  />
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 bg-white shadow-sm flex items-center justify-center cursor-pointer group"
                  >
                    <Image 
                      src={formData.entegrasyonHaritalama?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                      alt="Avatar" 
                      fill
                      sizes="128px"
                      className="object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Değiştir</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        avatarInputRef.current?.click();
                      }}
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow border-2 border-white transition"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-3">Cari Kart Profil</span>
                </div>
              </div>

              {/* Adresler Bölümü */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex justify-between items-center bg-sky-50 px-4 py-2 rounded-xl border border-sky-100">
                  <h3 className="font-extrabold text-sky-900 text-sm">Adres Listesi & Tanımları</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      const newAddr: Address = {
                        id: `addr-${Date.now()}`,
                        title: `Adres ${formData.adresler.length + 1}`,
                        country: "Türkiye",
                        type: "both",
                        city: "SAMSUN",
                        district: "İLKADIM",
                        fullAddress: "",
                        mobile: ""
                      };
                      setFormData({ ...formData, adresler: [...formData.adresler, newAddr] });
                      toast.success("Yeni adres kartı eklendi.");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition"
                  >
                    + Adres Ekle
                  </button>
                </div>

                {formData.adresler.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-2xl">Kayıtlı adres bulunmuyor. Yeni bir tane ekleyebilirsiniz.</p>
                ) : (
                  formData.adresler.map((addr, index) => (
                    <div key={addr.id} className="p-4 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-150">
                        <span className="font-black text-slate-700">Adres {index + 1} ({addr.title})</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const filtered = formData.adresler.filter(a => a.id !== addr.id);
                            setFormData({ ...formData, adresler: filtered });
                            toast.info("Adres kartı silindi.");
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition border border-red-100"
                        >
                          Kaldır (Sil)
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Adres Adı</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ev Adresim, İş Adresim"
                            value={addr.title}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].title = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Ülke</label>
                          <input 
                            type="text" 
                            value={addr.country || "Türkiye"}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].country = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Tip</label>
                          <select 
                            value={addr.type}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].type = e.target.value as any;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          >
                            <option value="both">Fatura + Sevk</option>
                            <option value="billing">Fatura</option>
                            <option value="shipping">Sevk</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Şehir</label>
                          <select
                            value={addr.city}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].city = e.target.value;
                              updated[index].district = "";
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          >
                            <option value="" disabled>Şehir Seçin</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">İlçe</label>
                          <select
                            disabled={!addr.city}
                            value={addr.district}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].district = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none disabled:opacity-50"
                          >
                            <option value="" disabled>İlçe Seçin</option>
                            {addr.city && (turkeyLocations[addr.city] || []).map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">Belde</label>
                          <input 
                            type="text" 
                            placeholder="Semt / Belde..."
                            value={addr.town || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].town = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">P.Kod</label>
                          <input 
                            type="text" 
                            placeholder="Posta Kodu"
                            value={addr.postalCode || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].postalCode = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-800 block">Açık Adres</label>
                        <textarea 
                          rows={2}
                          required
                          placeholder="Adalet mahallesi 100. Yıl bulvarı..."
                          value={addr.fullAddress}
                          onChange={(e) => {
                            const updated = [...formData.adresler];
                            updated[index].fullAddress = e.target.value;
                            setFormData({ ...formData, adresler: updated });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">Telefon</label>
                          <Input 
                            type="phone" 
                            placeholder="Tel"
                            value={addr.phone || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].phone = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">Cep (Gsm)</label>
                          <Input 
                            type="phone" 
                            placeholder="Cep Telefonu"
                            value={addr.mobile || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].mobile = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">E-Posta</label>
                          <input 
                            type="email" 
                            placeholder="Mail adresi"
                            value={addr.email || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].email = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">Telefon 2</label>
                          <Input 
                            type="phone" 
                            placeholder="Tel 2"
                            value={addr.phone2 || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].phone2 = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">Cep 2</label>
                          <Input 
                            type="phone" 
                            placeholder="Cep 2"
                            value={addr.mobile2 || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].mobile2 = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-extrabold text-slate-800 block">Yetkili Adı</label>
                          <input 
                            type="text" 
                            placeholder="Yetkili Kişi"
                            value={addr.contactPerson || ""}
                            onChange={(e) => {
                              const updated = [...formData.adresler];
                              updated[index].contactPerson = e.target.value;
                              setFormData({ ...formData, adresler: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Tanımlar & Finansal Bilgiler */}
          {modalActiveTab === "tanimlar" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="font-black text-slate-800 text-sm">Grup Tanımları & Nitelikler</h4>
                
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">E-Ticaret (Grup 1)</label>
                    <input 
                      type="text" 
                      value={formData.tanimlar.grup1}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, grup1: e.target.value }
                      })}
                      placeholder="Grup 1"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Grup 2</label>
                    <input 
                      type="text" 
                      value={formData.tanimlar.grup2}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, grup2: e.target.value }
                      })}
                      placeholder="Grup 2"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Grup 3</label>
                    <input 
                      type="text" 
                      value={formData.tanimlar.grup3}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, grup3: e.target.value }
                      })}
                      placeholder="Grup 3"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Grup 4</label>
                    <input 
                      type="text" 
                      value={formData.tanimlar.grup4}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, grup4: e.target.value }
                      })}
                      placeholder="Grup 4"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">İstihbarat Notu</label>
                    <input 
                      type="text" 
                      value={formData.tanimlar.istihbarat}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, istihbarat: e.target.value }
                      })}
                      placeholder="İstihbarat Bilgisi"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">UYARI (Kırmızı Alan)</label>
                    <input 
                      type="text" 
                      value={formData.tanimlar.uyari}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, uyari: e.target.value }
                      })}
                      placeholder="Cari Uyarı Notu (Örn: Çek Yasağı)"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold text-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Diğer Ünvan</label>
                  <input 
                    type="text" 
                    value={formData.tanimlar.digerUnvan}
                    onChange={e => setFormData({
                      ...formData,
                      tanimlar: { ...formData.tanimlar, digerUnvan: e.target.value }
                    })}
                    placeholder="Ek Ticari Ünvan veya Tabela Adı"
                    className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Fiyat Grubu Seçin</label>
                    <select
                      value={formData.priceGroup}
                      onChange={e => setFormData({ ...formData, priceGroup: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    >
                      <option value="Liste">Liste Fiyatı</option>
                      <option value="Özel İskonto">Özel İskonto</option>
                      <option value="Toptan Bayi">Toptan Bayi</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Birim Fiyat Grubu</label>
                    <select
                      value={formData.tanimlar.birimFiyatGrubu}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, birimFiyatGrubu: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="Grup A">Grup A</option>
                      <option value="Grup B">Grup B</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Cari Grubu</label>
                    <select
                      value={formData.dealerGroup}
                      onChange={e => setFormData({ ...formData, dealerGroup: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    >
                      <option value="Standart">Standart</option>
                      <option value="Gold">Gold</option>
                      <option value="Platin">Platin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Doğum Tarihi</label>
                    <input 
                      type="date"
                      value={formData.dogumTarihi}
                      onChange={e => setFormData({ ...formData, dogumTarihi: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="font-extrabold text-slate-800 block">KEP Adresi</label>
                    <input 
                      type="text"
                      value={formData.tanimlar.kepAdresi}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, kepAdresi: e.target.value }
                      })}
                      placeholder="kep@hs01.kep.tr"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Hesapları (İlişkili Cari)</label>
                    <input 
                      type="text"
                      value={formData.tanimlar.hesaplari}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, hesaplari: e.target.value }
                      })}
                      placeholder="Hesap Kartı Kodu"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">İşleri (Sektör)</label>
                    <input 
                      type="text"
                      value={formData.tanimlar.isleri}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, isleri: e.target.value }
                      })}
                      placeholder="Geleneksel & Doğal Lezzetler, Gıda vb."
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Plasiyer</label>
                    <select
                      value={formData.tanimlar.plasiyer}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, plasiyer: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    >
                      <option value="">Plasiyer Seçiniz</option>
                      <option value="PLA-01">Ahmet Yılmaz</option>
                      <option value="PLA-02">Mehmet Demir</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Diğer Birim Fiyat Grupları</label>
                    <select
                      value={formData.tanimlar.digerBirimFiyatGruplari}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, digerBirimFiyatGruplari: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    >
                      <option value="">Seçiniz</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Varsayılan Şube</label>
                    <input 
                      type="text"
                      value={formData.tanimlar.varsayilanSube}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: { ...formData.tanimlar, varsayilanSube: e.target.value }
                      })}
                      placeholder="Merkez Şube"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Finansal Bilgiler */}
              <div className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="font-black text-slate-800 text-sm">Finansal Bilgiler</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Döviz Türü</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                    >
                      <option value="TRY">TRY (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Teminat Yerel Tutar</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.teminatYerelTutar}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, teminatYerelTutar: parseFloat(e.target.value) || 0 }
                        }
                      })}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Açık Hesap Yerel Limit</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.acikHesapYerelLimit}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, acikHesapYerelLimit: parseFloat(e.target.value) || 0 }
                        }
                      })}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Hesap Kesim Günü</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.hesapKesimGunu}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, hesapKesimGunu: parseInt(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Çalışılacak Vade Gün</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.calisilacakVadeGun}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, calisilacakVadeGun: parseInt(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-800 block">Gecikme Limit Günü</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.gecikmeLimitGunu}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, gecikmeLimitGunu: parseInt(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Varsayılan Alış İskontosu (%)</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.varsayilanAlisIskontosu}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, varsayilanAlisIskontosu: parseFloat(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold text-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Varsayılan Satış İskontosu (%)</label>
                    <input 
                      type="number" 
                      value={formData.tanimlar.finansalBilgiler.varsayilanSatisIskontosu}
                      onChange={e => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: { ...formData.tanimlar.finansalBilgiler, varsayilanSatisIskontosu: parseFloat(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl outline-none font-bold text-orange-600"
                    />
                  </div>
                </div>

                {/* IOS Switch list */}
                <div className="grid grid-cols-2 gap-4 border border-slate-150 p-4 rounded-2xl bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Ekstre gönder</p>
                      <p className="text-xs text-slate-400">Mutabakat veya borç ekstreleri otomatik e-postalanır.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: {
                            ...formData.tanimlar.finansalBilgiler,
                            ekstreGonder: !formData.tanimlar.finansalBilgiler.ekstreGonder
                          }
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        formData.tanimlar.finansalBilgiler.ekstreGonder ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.tanimlar.finansalBilgiler.ekstreGonder ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Limit Kontrolü</p>
                      <p className="text-xs text-slate-400">Risk limiti aşıldığında sipariş durdurulur.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: {
                            ...formData.tanimlar.finansalBilgiler,
                            limitKontrolu: !formData.tanimlar.finansalBilgiler.limitKontrolu
                          }
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        formData.tanimlar.finansalBilgiler.limitKontrolu ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.tanimlar.finansalBilgiler.limitKontrolu ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 col-span-2">
                    <div>
                      <p className="font-bold text-slate-800">Veresiye Olacak Mı?</p>
                      <p className="text-xs text-slate-400">Cari hesaba açık hesap borç kaydı girilebilir.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: {
                            ...formData.tanimlar.finansalBilgiler,
                            veresiyeOlacakMi: !formData.tanimlar.finansalBilgiler.veresiyeOlacakMi
                          }
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        formData.tanimlar.finansalBilgiler.veresiyeOlacakMi ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.tanimlar.finansalBilgiler.veresiyeOlacakMi ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 col-span-2">
                    <div>
                      <p className="font-bold text-slate-800">Pos Cihazı Kullanılacak mı?</p>
                      <p className="text-xs text-slate-400">Fiziksel POS tahsilatları bu hesaba işlenir.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        tanimlar: {
                          ...formData.tanimlar,
                          finansalBilgiler: {
                            ...formData.tanimlar.finansalBilgiler,
                            posCihaziKullanilacakMi: !formData.tanimlar.finansalBilgiler.posCihaziKullanilacakMi
                          }
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        formData.tanimlar.finansalBilgiler.posCihaziKullanilacakMi ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.tanimlar.finansalBilgiler.posCihaziKullanilacakMi ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Bankalar */}
          {modalActiveTab === "bankalar" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <button 
                  type="button"
                  onClick={() => {
                    const newBank = {
                      id: `bank-${Date.now()}`,
                      iban: "", bankaAdi: "", subeAdi: "", subeKodu: "", hesapNo: ""
                    };
                    setFormData({ ...formData, bankalar: [...formData.bankalar, newBank] });
                    toast.success("Yeni banka hesabı satırı eklendi.");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  + Banka Bilgisi Ekle
                </button>
                <div className="p-1.5 border border-slate-200 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition text-slate-500 text-xs font-bold flex items-center gap-1">
                  <span>Dışa Aktar</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">Sil</th>
                      <th className="px-3 py-2 w-48">IBAN</th>
                      <th className="px-3 py-2">Banka Adı</th>
                      <th className="px-3 py-2">Şube Adı</th>
                      <th className="px-3 py-2 w-24">Şube Kodu</th>
                      <th className="px-3 py-2 w-32">Hesap No</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.bankalar.map((bank, index) => (
                      <tr key={bank.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-3 py-2 text-center">
                          <button 
                            type="button"
                            onClick={() => {
                              const filtered = formData.bankalar.filter(b => b.id !== bank.id);
                              setFormData({ ...formData, bankalar: filtered });
                              toast.info("Banka kaydı kaldırıldı.");
                            }}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-md transition"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="TR00..." 
                            required
                            value={bank.iban}
                            onChange={e => {
                              const updated = [...formData.bankalar];
                              updated[index].iban = e.target.value;
                              setFormData({ ...formData, bankalar: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none font-mono"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Banka Adı" 
                            required
                            value={bank.bankaAdi}
                            onChange={e => {
                              const updated = [...formData.bankalar];
                              updated[index].bankaAdi = e.target.value;
                              setFormData({ ...formData, bankalar: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Şube Adı" 
                            value={bank.subeAdi}
                            onChange={e => {
                              const updated = [...formData.bankalar];
                              updated[index].subeAdi = e.target.value;
                              setFormData({ ...formData, bankalar: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Kod" 
                            value={bank.subeKodu}
                            onChange={e => {
                              const updated = [...formData.bankalar];
                              updated[index].subeKodu = e.target.value;
                              setFormData({ ...formData, bankalar: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none font-bold"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Hesap No" 
                            value={bank.hesapNo}
                            onChange={e => {
                              const updated = [...formData.bankalar];
                              updated[index].hesapNo = e.target.value;
                              setFormData({ ...formData, bankalar: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                    {formData.bankalar.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-bold bg-white">Veri yok</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Özel Alanlar */}
          {modalActiveTab === "ozel" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="font-black text-slate-800 text-sm">Cari Fiyat Formülleri & Özel Nitelikler</h4>
                
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-800 block">Cari Fiyat Formülü (Örn: MATRAH * 0.90)</label>
                  <input 
                    type="text"
                    placeholder="MATRAH * 0.90"
                    value={formData.priceFormula}
                    onChange={e => setFormData({ ...formData, priceFormula: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none font-mono text-orange-600 font-bold"
                  />
                  <p className="text-xs text-slate-400">Bu cari için B2B portalında özel fiyatlandırma formülünü tanımlar.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KVKK */}
          {modalActiveTab === "kvkk" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-4">
                <h4 className="font-black text-slate-800 text-sm">KVKK İzinleri & Aydınlatma Metni Onay Durumu</h4>
                
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-800 block">KVKK İzni</label>
                  <select
                    value={formData.kvkk.izni}
                    onChange={e => setFormData({
                      ...formData,
                      kvkk: { ...formData.kvkk, izni: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-slate-800"
                  >
                    <option value="Onay Verildi">Onay Verildi</option>
                    <option value="Onay Verilmedi">Onay Verilmedi</option>
                    <option value="Bekliyor">Onay Bekleniyor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-800 block">KVKK Açıklama / Not</label>
                  <textarea 
                    rows={3}
                    placeholder="Müşterinin aydınlatma metnini onayladığı tarih veya fiziksel form no..."
                    value={formData.kvkk.aciklama}
                    onChange={e => setFormData({
                      ...formData,
                      kvkk: { ...formData.kvkk, aciklama: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Yetkililer */}
          {modalActiveTab === "yetkililer" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <button 
                  type="button"
                  onClick={() => {
                    const newOfficer = {
                      id: `yetkili-${Date.now()}`,
                      gorev: "", ad: "", soyad: "", telefon: "", email: "", not: ""
                    };
                    setFormData({ ...formData, yetkililer: [...formData.yetkililer, newOfficer] });
                    toast.success("Yeni yetkili / irtibat kişisi eklendi.");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                >
                  + Yetkili Ekle
                </button>
                <div className="p-1.5 border border-slate-200 bg-white rounded-lg cursor-pointer hover:bg-slate-50 transition text-slate-500 text-xs font-bold flex items-center gap-1">
                  <span>Dışa Aktar</span>
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">Sil</th>
                      <th className="px-3 py-2">Görev</th>
                      <th className="px-3 py-2">Ad</th>
                      <th className="px-3 py-2">Soyad</th>
                      <th className="px-3 py-2 w-32">Telefon</th>
                      <th className="px-3 py-2 w-48">E-Posta</th>
                      <th className="px-3 py-2">Not</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.yetkililer.map((officer, index) => (
                      <tr key={officer.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-3 py-2 text-center">
                          <button 
                            type="button"
                            onClick={() => {
                              const filtered = formData.yetkililer.filter(y => y.id !== officer.id);
                              setFormData({ ...formData, yetkililer: filtered });
                              toast.info("Yetkili kaydı kaldırıldı.");
                            }}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-md transition"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Satınalma, Muhasebe vb." 
                            required
                            value={officer.gorev}
                            onChange={e => {
                              const updated = [...formData.yetkililer];
                              updated[index].gorev = e.target.value;
                              setFormData({ ...formData, yetkililer: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Adı" 
                            required
                            value={officer.ad}
                            onChange={e => {
                              const updated = [...formData.yetkililer];
                              updated[index].ad = e.target.value;
                              setFormData({ ...formData, yetkililer: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none font-bold"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Soyadı" 
                            required
                            value={officer.soyad}
                            onChange={e => {
                              const updated = [...formData.yetkililer];
                              updated[index].soyad = e.target.value;
                              setFormData({ ...formData, yetkililer: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Tel" 
                            value={officer.telefon}
                            onChange={e => {
                              const updated = [...formData.yetkililer];
                              updated[index].telefon = e.target.value;
                              setFormData({ ...formData, yetkililer: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="email" 
                            placeholder="E-posta" 
                            value={officer.email}
                            onChange={e => {
                              const updated = [...formData.yetkililer];
                              updated[index].email = e.target.value;
                              setFormData({ ...formData, yetkililer: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input 
                            type="text" 
                            placeholder="Notlar" 
                            value={officer.not}
                            onChange={e => {
                              const updated = [...formData.yetkililer];
                              updated[index].not = e.target.value;
                              setFormData({ ...formData, yetkililer: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                    {formData.yetkililer.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-bold bg-white">Veri yok</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: Sözleşmeler */}
          {modalActiveTab === "sozlesmeler" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-slate-50/50 p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3 hover:bg-slate-100/50 transition cursor-pointer relative"
                   onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const newFile = {
                        name: file.name,
                        url: `/uploads/${file.name}`,
                        date: new Date().toLocaleDateString("tr-TR")
                      };
                      setFormData(prev => ({
                        ...prev,
                        dosyalar: [...prev.dosyalar, newFile]
                      }));
                      toast.success(`${file.name} başarıyla sözleşmelere eklendi.`);
                    }
                  }}
                />
                <Upload className="w-10 h-10 text-orange-500 mx-auto animate-bounce-slow" />
                <div>
                  <p className="font-black text-slate-800 text-sm">Sözleşme veya Evrak Seçin / Sürükleyin</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, Word, Excel, PNG veya JPEG (Maks. 10MB)</p>
                </div>
              </div>

              {/* List of uploaded files */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  Yüklenen Belgeler ({formData.dosyalar.length})
                </h4>
                {formData.dosyalar.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-white text-slate-400 italic">
                    Henüz belge yüklenmemiş.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {formData.dosyalar.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 bg-white rounded-xl shadow-sm hover:border-slate-300 transition">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-semibold text-xs">
                            {file.name.split('.').pop()?.toUpperCase() || "DOC"}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-800 truncate text-xs">{file.name}</p>
                            <p className="text-xs text-slate-400">{file.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={file.url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-450 hover:text-slate-700 transition" title="İndir">
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = formData.dosyalar.filter((_, i) => i !== idx);
                              setFormData({ ...formData, dosyalar: updated });
                              toast.info("Belge kaldırıldı.");
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 transition" 
                            title="Sil"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: B2B Bilgileri */}
          {modalActiveTab === "b2b" && (
            <div className="space-y-6 animate-in fade-in duration-300 text-xs">
              {/* Sub-tabs for B2B */}
              <div className="flex border-b border-slate-200 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setB2bSubTab("kullanici")}
                  className={`pb-2 px-3 font-bold transition ${b2bSubTab === "kullanici" ? "border-b-2 border-emerald-500 text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Kullanıcı Bilgileri
                </button>
                <button
                  type="button"
                  onClick={() => setB2bSubTab("ayarlar")}
                  className={`pb-2 px-3 font-bold transition ${b2bSubTab === "ayarlar" ? "border-b-2 border-emerald-500 text-emerald-600 font-extrabold" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Ayarlar & Parametreler
                </button>
              </div>

              {b2bSubTab === "kullanici" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">B2B Kullanıcı Adı / Adı Soyadı</label>
                      <input
                        type="text"
                        placeholder="Kullanıcı Adı Soyadı"
                        value={b2bUserForm.adSoyad}
                        onChange={e => setB2bUserForm({ ...b2bUserForm, adSoyad: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">E-Posta Adresi</label>
                      <input
                        type="email"
                        placeholder="kullanici@e-ticaret.com"
                        value={b2bUserForm.email}
                        onChange={e => setB2bUserForm({ ...b2bUserForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">Portal Şifresi</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Şifre"
                          value={b2bUserForm.password}
                          onChange={e => setB2bUserForm({ ...b2bUserForm, password: e.target.value })}
                          className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-xs font-bold"
                        >
                          {showPassword ? "Gizle" : "Göster"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="b2bUserActive"
                        checked={b2bUserForm.isActive}
                        onChange={e => setB2bUserForm({ ...b2bUserForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="b2bUserActive" className="font-bold text-slate-800 cursor-pointer select-none">
                        B2B Portalı Aktif (Giriş İzni Verilsin)
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const emailVal = b2bUserForm.email || formData.email;
                        const nameVal  = b2bUserForm.adSoyad || formData.yetkiliKisi || formData.name;
                        const passVal  = b2bUserForm.password;

                        if (!emailVal) { toast.error("E-posta adresi zorunludur."); return; }
                        if (!passVal || passVal.length < 6) { toast.error("Şifre en az 6 karakter olmalıdır."); return; }

                        const targetId = activeAccount?.id;
                        if (!targetId) { toast.error("Önce bir cari kart seçin."); return; }

                        const tid = toast.loading("B2B kullanıcısı kaydediliyor...");
                        try {
                          const res = await fetch(`/api/accounting/current-accounts/${targetId}/b2b-user`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              adSoyad: nameVal,
                              email:   emailVal,
                              password: passVal,
                              isActive: b2bUserForm.isActive,
                            }),
                          });
                          const data = await res.json();
                          toast.dismiss(tid);
                          if (!res.ok || data.error) {
                            toast.error(data.error || "Kullanıcı kaydedilemedi.");
                          } else {
                            toast.success(`👤 ${data.message}`);
                            // Cari detaylarını yenile
                            fetchActiveDetails(targetId);
                          }
                        } catch {
                          toast.dismiss(tid);
                          toast.error("Sunucu hatası: kullanıcı kaydedilemedi.");
                        }
                      }}
                      className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Portal Kullanıcısını Kaydet / Oluştur
                    </button>
                  </div>

                </div>
              )}

              {b2bSubTab === "ayarlar" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">Fiyat Grubu Yetkisi</label>
                      <select
                        value={formData.priceGroup}
                        onChange={e => setFormData({ ...formData, priceGroup: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900"
                      >
                        <option value="Liste">Liste Fiyatı</option>
                        <option value="Bayi-1">Bayi Özel Fiyatı 1</option>
                        <option value="Bayi-2">Bayi Özel Fiyatı 2</option>
                        <option value="Distributor">Distribütör Özel Fiyatı</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">Minimum Sipariş Limiti (TRY)</label>
                      <input
                        type="number"
                        placeholder="Miktar girin"
                        value={formData.tanimlar?.finansalBilgiler?.acikHesapYerelLimit || 0}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setFormData({
                            ...formData,
                            tanimlar: {
                              ...formData.tanimlar,
                              finansalBilgiler: {
                                ...formData.tanimlar.finansalBilgiler,
                                acikHesapYerelLimit: val
                              }
                            }
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">Varsayılan İskonto Oranı (%)</label>
                      <input
                        type="number"
                        placeholder="Örn: 10"
                        value={formData.discountRate}
                        onChange={e => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-800 block">Kredi Limiti (TRY)</label>
                      <input
                        type="number"
                        placeholder="Miktar girin"
                        value={formData.creditLimit}
                        onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="b2bLimitKontrol"
                        checked={formData.tanimlar?.finansalBilgiler?.limitKontrolu || false}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            tanimlar: {
                              ...formData.tanimlar,
                              finansalBilgiler: {
                                ...formData.tanimlar.finansalBilgiler,
                                limitKontrolu: e.target.checked
                              }
                            }
                          });
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="b2bLimitKontrol" className="font-bold text-slate-800 cursor-pointer select-none">
                        Siparişlerde Limit Kontrolü Yapılsın
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="b2bVeresiye"
                        checked={formData.tanimlar?.finansalBilgiler?.veresiyeOlacakMi ?? true}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            tanimlar: {
                              ...formData.tanimlar,
                              finansalBilgiler: {
                                ...formData.tanimlar.finansalBilgiler,
                                veresiyeOlacakMi: e.target.checked
                              }
                            }
                          });
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="b2bVeresiye" className="font-bold text-slate-800 cursor-pointer select-none">
                        Açık Hesap (Veresiye) Siparişe İzin Ver
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4">
            <div>
              {activeAccount && formData.name && (
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCariModalOpen(false);
                    setIsDeleteOpen(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Sil
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsCariModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-md"
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE CARI DIALOG */}
      <ConfirmDialog 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCari}
        title="Cari Kartı Sil"
        message={`${activeAccount?.name} ünvanlı cari kartı silmek istediğinize emin misiniz? Bu işlem ilişkili fatura ve hareketleri koruyarak cariyi arşivleyecektir.`}
      />

      {/* CARI ESLESTIRME (MAPPING / MERGING) MODAL */}
      <Modal 
        isOpen={isMergeModalOpen} 
        onClose={() => setIsMergeModalOpen(false)} 
        title="Mükerrer Cari Kartları Eşleştir ve Birleştir"
      >
        <form onSubmit={handleMergeCari} className="space-y-4 text-xs">
          <p className="text-slate-500 leading-relaxed font-semibold">
            Farklı kaynaklardan (Trendyol, Shopify vb.) mükerrer olarak içeri aktarılmış olan cari kayıtları birleştirin. Seçilen mükerrer carilerin tüm bakiyeleri, faturaları, siparişleri ve evrakları otomatik olarak seçilen birincil cariye aktarılacaktır.
          </p>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Birincil Cari Kart (Tüm Kayıtların Aktarılacağı Hedef)</label>
            <select 
              value={mergePrimaryId} onChange={e => setMergePrimaryId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl outline-none text-slate-800"
              required
            >
              <option value="">Hedef Cariyi Seçin...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.kaynakPlatform} / Bakiye: {a.balance} TRY)</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Eşleştirilecek / Birleştirilecek Mükerrer Cariler (Arşivlenecekler)</label>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto space-y-2">
              {accounts
                .filter(a => a.id !== mergePrimaryId)
                .map(a => {
                  const isChecked = mergeDuplicateIds.includes(a.id);
                  return (
                    <label key={a.id} className="flex items-center gap-2.5 cursor-pointer select-none p-1.5 rounded-lg hover:bg-slate-100 transition">
                      <input 
                        type="checkbox" checked={isChecked}
                        onChange={() => {
                          setMergeDuplicateIds(prev => 
                            isChecked ? prev.filter(x => x !== a.id) : [...prev, a.id]
                          );
                        }}
                        className="w-4 h-4 rounded accent-orange-500"
                      />
                      <span className="font-semibold text-slate-800">{a.name}</span>
                      <span className="text-slate-500 text-xs">({a.kaynakPlatform} / {a.balance.toLocaleString('tr-TR')} TRY)</span>
                    </label>
                  );
                })}
              {accounts.filter(a => a.id !== mergePrimaryId).length === 0 && (
                <p className="text-slate-400 italic text-center py-4">Seçilebilecek diğer cari hesap bulunmamaktadır.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button 
              type="button" onClick={() => setIsMergeModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-md"
            >
              Cari Kartları Birleştir
            </button>
          </div>
        </form>
      </Modal>

      {/* ERP Tahsilat / Ödeme Modal */}
      {actionModal.open && (actionModal.type === "tahsilat" || actionModal.type === "ödeme") && activeAccount && (
        <TahsilatForm
          isOpen={true}
          islemTipi={actionModal.type === "ödeme" ? "odeme" : "tahsilat"}
          onClose={() => setActionModal({ open: false, type: null })}
          activeAccount={activeAccount}
          onSaveSuccess={(result) => {
            const isOd = actionModal.type === "ödeme";
            setActionModal({ open: false, type: null });
            fetchActiveDetails(activeAccount.id);
            fetchAccounts();
            setSuccessModalData({
              open: true,
              amount: result.amount,
              paymentMethod: result.paymentMethod,
              closedInvoicesCount: result.closedInvoicesCount || 0,
              newBalance: result.newBalance,
              cariName: activeAccount.name,
              transactionId: result.transaction?.id,
              description: result.transaction?.description,
              date: result.transaction?.date,
              isOdeme: isOd
            });
          }}
        />
      )}

      {/* TAHSILAT BAŞARI SONRASI EYLEMLER MODAL */}
      <Modal
        isOpen={!!successModalData?.open}
        onClose={() => setSuccessModalData(null)}
        title={
          successModalData?.isOdeme ? (
            <div className="flex items-center gap-2 text-red-600 ">
              <CheckCircle className="w-5 h-5 animate-bounce-slow" />
              <span className="font-extrabold tracking-tight">Ödeme Kaydedildi</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 ">
              <CheckCircle className="w-5 h-5 animate-bounce-slow" />
              <span className="font-extrabold tracking-tight">Tahsilat Kaydedildi</span>
            </div>
          )
        }
      >
        {successModalData && (
          <div className="space-y-6 text-xs ">
            <div className={`p-4 rounded-xl space-y-2 border ${
              successModalData.isOdeme 
                ? "bg-red-50/50  border-red-200 " 
                : "bg-emerald-50/50  border-emerald-200 "
            }`}>
              <p className="font-bold text-slate-700  text-xs">
                {successModalData.isOdeme 
                  ? "Ödeme işlemi başarıyla tamamlanmıştır ve muhasebe kayıtları otomatik oluşturulmuştur."
                  : "Tahsilat işlemi başarıyla tamamlanmıştır ve muhasebe kayıtları otomatik oluşturulmuştur."
                }
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold block">Cari Hesap:</span>
                  <span className="font-black text-slate-800 ">{successModalData.cariName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">{successModalData.isOdeme ? "Ödeme Tutarı:" : "Tahsilat Tutarı:"}</span>
                  <span className="font-black text-slate-800 ">{formatCurrency(successModalData.amount, activeAccount?.currency || "TRY")} ({successModalData.paymentMethod})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Kapatılan Fatura:</span>
                  <span className="font-black text-slate-800 ">{successModalData.closedInvoicesCount} Adet</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Güncel Bakiye:</span>
                  <span className={`font-black ${successModalData.newBalance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {formatCurrency(successModalData.newBalance, activeAccount?.currency || "TRY")}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-800 ">Kayıt Sonrası İşlemler</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handlePrintReceipt(successModalData, activeAccount);
                  }}
                  className="flex items-center gap-2.5 p-3 border border-slate-200  hover:bg-slate-50  rounded-xl font-bold transition text-left text-slate-800  w-full"
                >
                  <FileText className={`w-5 h-5 ${successModalData.isOdeme ? "text-red-500" : "text-orange-500"} shrink-0`} />
                  <div>
                    <p className="font-bold text-xs">{successModalData.isOdeme ? "Ödeme Fişi Oluştur" : "Tahsilat Makbuzu Oluştur"}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {successModalData.isOdeme ? "Sistem üzerinde resmi ödeme fişi hazırlar" : "Sistem üzerinde resmi makbuz fişi hazırlar"}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPDF(successModalData, activeAccount);
                  }}
                  className="flex items-center gap-2.5 p-3 border border-slate-200  hover:bg-slate-50  rounded-xl font-bold transition text-left text-slate-800  w-full"
                >
                  <Download className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">PDF Olarak İndir</p>
                    <p className="text-[11px] text-slate-400 font-medium">{successModalData.isOdeme ? "Fişi PDF formatında dışa aktarır" : "Makbuzu PDF formatında dışa aktarır"}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSendEmail(successModalData, activeAccount);
                  }}
                  className="flex items-center gap-2.5 p-3 border border-slate-200  hover:bg-slate-50  rounded-xl font-bold transition text-left text-slate-800  w-full"
                >
                  <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">E-posta Gönder</p>
                    <p className="text-[11px] text-slate-400 font-medium">{successModalData.isOdeme ? "Tedarikçiye e-posta ile fiş iletir" : "Müşteriye e-posta ile makbuz iletir"}</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSendWhatsApp(successModalData, activeAccount);
                  }}
                  className="flex items-center gap-2.5 p-3 border border-slate-200  hover:bg-slate-50  rounded-xl font-bold transition text-left text-slate-800  w-full"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">WhatsApp Gönder</p>
                    <p className="text-[11px] text-slate-400 font-medium">{successModalData.isOdeme ? "WhatsApp üzerinden ödeme bildirimi atar" : "WhatsApp üzerinden makbuz bildirimi atar"}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100  pt-4">
              <button
                type="button"
                onClick={() => {
                  handlePrintReceipt(successModalData, activeAccount);
                }}
                className="px-4 py-2 border border-slate-200  hover:bg-slate-50  rounded-xl font-bold transition text-slate-700 "
              >
                Yazdır
              </button>
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* TAHSILAT / ÖDEME / DEVİR / ALIŞ / SATIŞ MODAL */}
      <Modal
        isOpen={actionModal.open && actionModal.type !== "tahsilat" && actionModal.type !== "ödeme"}
        onClose={() => { setActionModal({ open: false, type: null }); }}
        title={
          <div className="flex items-center gap-2 text-indigo-600 ">
            <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
            <span className="font-extrabold tracking-tight">
              {actionModal.type === "devir" ? (actionModal.devirTipi || "Devir Bakiye Girişi") :
               actionModal.type === "alis" ? `Alış Belgesi: ${actionModal.belgeTipi}` :
               actionModal.type === "satis" ? `Satış Belgesi: ${actionModal.belgeTipi}` : "İşlem Kaydet"}
            </span>
          </div>
        }
      >
        <form onSubmit={handleFinancialAction} className="space-y-4 text-xs">

          {/* Belge tipi badge */}
          {(actionModal.belgeTipi || actionModal.devirTipi) && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border ${
              actionModal.type === "alis" || actionModal.type === "isAlma" ? "bg-orange-50/50 text-orange-700 border-orange-200/50  " :
              actionModal.type === "satis" ? "bg-emerald-50/50 text-emerald-700 border-emerald-200/50  " :
              actionModal.devirTipi === "Alacak Devri" ? "bg-emerald-50/50 text-emerald-700 border-emerald-200/50  " :
              "bg-red-50/50 text-red-700 border-red-200/50  "
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Belge Türü: <strong>{actionModal.belgeTipi || actionModal.devirTipi}</strong></span>
              </div>
            </div>
          )}

          {/* Tarih alanı - Alış/Satış/Devir için */}
          {(actionModal.type === "alis" || actionModal.type === "satis" || actionModal.type === "isAlma" || actionModal.type === "devir") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700  block">Belge Tarihi</label>
                <input type="date" required name="belgeTarihi"
                  defaultValue={new Date().toISOString().substring(0,10)}
                  className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700  block">Belge / Fiş No</label>
                <input type="text" name="belgeNo" placeholder={`#${Date.now().toString().slice(-6)}`}
                  className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Devir tipi için özel alanlar */}
          {actionModal.type === "devir" && (
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700  block">Devir Türü</label>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setActionModal(p => ({...p, devirTipi: "Alacak Devri"}))}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border-2 transition ${
                    actionModal.devirTipi === "Alacak Devri"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                  }`}
                >Alacak Devri</button>
                <button type="button"
                  onClick={() => setActionModal(p => ({...p, devirTipi: "Borç Devri"}))}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border-2 transition ${
                    actionModal.devirTipi === "Borç Devri"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-slate-700 border-slate-200 hover:border-red-300"
                  }`}
                >Borç Devri</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-extrabold text-slate-700  block">İşlem Tutarı ({activeAccount?.currency || "TRY"})</label>
            <Input 
              type="currency" required placeholder="0,00"
              value={actionForm.amount} onChange={e => setActionForm({...actionForm, amount: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* KDV oranı - Alış/Satış belgeleri için */}
          {(actionModal.type === "alis" || actionModal.type === "satis" || actionModal.type === "isAlma") && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700  block">KDV Oranı (%)</label>
                <select name="kdvOrani" defaultValue="20" className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm">
                  <option value="20">%20</option>
                  <option value="10">%10</option>
                  <option value="1">%1</option>
                  <option value="0">%0 (KDV'siz)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700  block">İskonto (%)</label>
                <input type="number" name="iskonto" min="0" max="100" defaultValue={0} step="0.1"
                  className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700  block">Döviz</label>
                <select name="doviz" defaultValue="TRY" className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm">
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          )}

          {(actionModal.type === "alis" || actionModal.type === "satis" || actionModal.type === "isAlma") && (
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700  block">Ürün / Hizmet Açıklaması</label>
              <input type="text" placeholder="Ürün veya hizmet adı..." name="urunAciklama"
                className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="font-extrabold text-slate-700  block">Açıklama / Fiş Notu</label>
            <textarea
              rows={2} placeholder="İşlem detaylarını buraya not edin..."
              value={actionForm.description} onChange={e => setActionForm({...actionForm, description: e.target.value})}
              className="w-full px-3.5 py-2.5 bg-white  border border-slate-200  rounded-xl outline-none font-bold text-slate-800  focus:border-indigo-500 transition-all shadow-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100  pt-4">
            <button 
              type="button" onClick={() => setActionModal({ open: false, type: null })}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className={`px-6 py-2 text-white rounded-xl font-bold transition shadow-md ${
                actionModal.type === "tahsilat" || actionModal.type === "satis" ? "bg-emerald-600 hover:bg-emerald-700" :
                actionModal.type === "ödeme" ? "bg-red-600 hover:bg-red-700" :
                actionModal.type === "devir" && actionModal.devirTipi === "Alacak Devri" ? "bg-emerald-600 hover:bg-emerald-700" :
                actionModal.type === "devir" ? "bg-red-600 hover:bg-red-700" :
                "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* ════ SLIDE-OVER INVOICE DETAIL DRAWER ════ */}
      {isInvoiceDrawerOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-hidden no-print">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsInvoiceDrawerOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-in slide-in-from-right duration-300">
              
              {/* Slide-over header */}
              <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Fatura Detayı</h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">Belge ID: {selectedInvoice.id}</p>
                </div>
                <button 
                  onClick={() => setIsInvoiceDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slide-over Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Cari Hesap Unvanı</p>
                    <p className="font-extrabold text-slate-800 mt-1">{selectedInvoice.currentAccount?.name}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Belge Türü</p>
                    <p className="font-extrabold text-slate-800 mt-1">{selectedInvoice.type}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Düzenleme Tarihi</p>
                    <p className="font-bold text-slate-800 mt-1">{new Date(selectedInvoice.date).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Vade Tarihi</p>
                    <p className="font-bold text-slate-800 mt-1">{new Date(selectedInvoice.dueDate).toLocaleDateString("tr-TR")}</p>
                  </div>
                </div>

                {/* Items breakdown table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Fatura Satırları</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Ürün / Hizmet</th>
                          <th className="px-3 py-2.5 text-center">Miktar</th>
                          <th className="px-3 py-2.5 text-right">Birim Fiyat</th>
                          <th className="px-3 py-2.5 text-center">KDV</th>
                          <th className="px-3 py-2.5 text-right">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.invoiceItems?.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/10">
                            <td className="px-3 py-2 font-bold text-slate-800">{item.name}</td>
                            <td className="px-3 py-2 text-center text-slate-600 font-bold">{item.quantity} Adet</td>
                            <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(item.unitPrice, activeAccount?.currency || "TRY")}</td>
                            <td className="px-3 py-2 text-center text-slate-500">%{item.vatRate || 18}</td>
                            <td className="px-3 py-2 text-right font-black text-slate-800">{formatCurrency(item.totalAmount, activeAccount?.currency || "TRY")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tax summary */}
                <div className="flex justify-end pt-3">
                  <div className="w-64 space-y-1.5 text-xs bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                    <div className="flex justify-between font-bold text-slate-600">
                      <span>Ara Toplam:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount - selectedInvoice.taxAmount, activeAccount?.currency || "TRY")}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>KDV Toplamı:</span>
                      <span>{formatCurrency(selectedInvoice.taxAmount, activeAccount?.currency || "TRY")}</span>
                    </div>
                    <div className="border-t border-slate-200 my-1"></div>
                    <div className="flex justify-between font-black text-slate-900 text-sm">
                      <span>Genel Toplam:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount, activeAccount?.currency || "TRY")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide-over footer actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase ${
                  selectedInvoice.status === "Gönderildi" ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"
                }`}>
                  Fatura Durumu: {selectedInvoice.status}
                </span>
                
                <button
                  onClick={() => {
                    toast.success("Fatura PDF formatında indirme kuyruğuna alındı.");
                    setIsInvoiceDrawerOpen(false);
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" /> PDF Olarak İndir
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
