"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  X, Calendar, CreditCard, Landmark, FileText, Upload, Trash, 
  HelpCircle, CheckCircle, FileSpreadsheet, Paperclip, AlertTriangle, 
  ArrowRight, Save, TrendingUp, TrendingDown, RefreshCw, Clock,
  Info, ChevronDown, ChevronUp, ShieldCheck, BookOpen, Layers, Zap,
  BarChart3, DollarSign, CheckSquare, ListChecks, Eye, Star
} from "lucide-react";
import { formatCurrency, parseTurkishCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { tahsilatFormSchema, TahsilatFormData, TahsilatFormInput } from "@/lib/validations/tahsilat";

interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
}

interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
  type: string;
  notes?: string;
}

// Helper to format YYYY-MM-DD to DD.MM.YYYY
const formatToTurkishDate = (isoDate: string) => {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDate;
};

// Helper to parse DD.MM.YYYY to YYYY-MM-DD
const parseToISODate = (turkishDate: string) => {
  if (!turkishDate) return "";
  const parts = turkishDate.split(".");
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (
      !isNaN(d) && d >= 1 && d <= 31 &&
      !isNaN(m) && m >= 1 && m <= 12 &&
      !isNaN(y) && parts[2].length === 4
    ) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return "";
};

// Calculate overdue days for an invoice
const calcOverdueDays = (dueDateStr: string): number => {
  if (!dueDateStr) return 0;
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// Generate installment schedule
const generateInstallments = (
  totalAmount: number,
  count: number,
  startDate: string,
  currency: string
): Array<{ date: string; amount: number; no: number }> => {
  if (!startDate || count <= 0) return [];
  const installments = [];
  const perInstallment = Math.floor((totalAmount / count) * 100) / 100;
  const remainder = Math.round((totalAmount - perInstallment * count) * 100) / 100;
  const base = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + i);
    const amount = i === count - 1 ? perInstallment + remainder : perInstallment;
    installments.push({
      no: i + 1,
      date: d.toISOString().substring(0, 10),
      amount,
    });
  }
  return installments;
};

interface TahsilatFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** 'tahsilat' = müşteriden tahsilat al | 'odeme' = tedarikçiye ödeme yap */
  islemTipi?: "tahsilat" | "odeme";
  activeAccount: {
    id: string;
    cariKod?: string | null;
    name: string;
    cariTipi: string;
    balance: number;
    currency: string;
    riskLimit?: number | null;
    creditLimit?: number | null;
    invoices?: Invoice[];
  };
  onSaveSuccess: (result: any) => void;
}

const ISLEM_DURUMU_OPTIONS = [
  { value: "Onaylandı", label: "Onaylandı", color: "text-emerald-600 bg-emerald-50 border-emerald-200   ", iconType: "check" },
  { value: "Onay Bekliyor", label: "Onay Bekliyor", color: "text-amber-600 bg-amber-50 border-amber-200   ", iconType: "clock" },
  { value: "Müsvedde", label: "Müsvedde", color: "text-slate-500 bg-slate-50 border-slate-200   ", iconType: "book" },
];

const DOVIZ_KURU_MAP: Record<string, number> = {
  USD: 32.5,
  EUR: 35.2,
  GBP: 41.0,
  TRY: 1,
};

function renderDurumuIcon(iconType: string) {
  if (iconType === "check") return <CheckCircle className="w-3.5 h-3.5" />;
  if (iconType === "clock") return <Clock className="w-3.5 h-3.5" />;
  return <BookOpen className="w-3.5 h-3.5" />;
}

export function TahsilatForm({ isOpen, onClose, activeAccount, onSaveSuccess, islemTipi = "tahsilat" }: TahsilatFormProps) {
  const isOdeme = islemTipi === "odeme";
  const [banks, setBanks] = useState<Bank[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [dateText, setDateText] = useState("");
  const [showJournalPreview, setShowJournalPreview] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);

  // Filter unpaid or partially paid invoices
  const unpaidInvoices = useMemo(() => {
    return (activeAccount.invoices || []).filter(
      (inv) => inv.status !== "ODENDI" && inv.status !== "IPTAL"
    );
  }, [activeAccount.invoices]);

  // Overdue invoices (for alert)
  const overdueInvoices = useMemo(() => {
    return unpaidInvoices.filter((inv) => calcOverdueDays(inv.dueDate) > 0);
  }, [unpaidInvoices]);

  // React Hook Form Setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TahsilatFormInput>({
    resolver: zodResolver(tahsilatFormSchema),
    defaultValues: {
      tarih: new Date().toISOString().substring(0, 10),
      belgeNo: islemTipi === "odeme" ? `ODE${Date.now().toString().slice(-6)}` : `TSH${Date.now().toString().slice(-6)}`,
      referansNo: "",
      tahsilatTuru: islemTipi === "odeme" ? "Cari Ödemesi" : "Cari Tahsilatı",
      tutar: 0,
      paraBirimi: (activeAccount.currency as any) || "TRY",
      dovizKuru: 1,
      odemeYontemi: "Banka Havalesi",
      islemDurumu: "Onaylandı",
      bankId: "",
      iban: "",
      dekontNo: "",
      islemRefNo: "",
      cekNo: "",
      bankaAdi: "",
      sube: "",
      kesideTarihi: "",
      cekVadeTarihi: "",
      senetNo: "",
      duzenlemeTarihi: "",
      senetVadeTarihi: "",
      taksitSayisi: 1,
      gecikmeKatsayisi: 0,
      gecikmeGun: 0,
      matchedInvoices: [],
      aciklama: "",
      muhasebeNotu: "",
      icNot: "",
    },
  });

  const watchTarih = watch("tarih");
  const watchParaBirimi = watch("paraBirimi");
  const watchDovizKuru = Number(watch("dovizKuru")) || 1;
  const watchTaksitSayisi = Number(watch("taksitSayisi")) || 1;
  const watchIslemDurumu = watch("islemDurumu");
  const watchGecikmeKatsayisi = Number(watch("gecikmeKatsayisi")) || 0;
  const watchGecikmeGun = Number(watch("gecikmeGun")) || 0;

  // Synchronize internal text state with react-hook-form date value
  useEffect(() => {
    if (watchTarih) {
      const formatted = formatToTurkishDate(watchTarih);
      if (formatted !== dateText) {
        setDateText(formatted);
      }
    }
  }, [watchTarih, dateText]);

  // When currency changes, update döviz kuru suggestion
  useEffect(() => {
    if (watchParaBirimi && watchParaBirimi !== "TRY") {
      setValue("dovizKuru", DOVIZ_KURU_MAP[watchParaBirimi] ?? 1);
    } else {
      setValue("dovizKuru", 1);
    }
  }, [watchParaBirimi, setValue]);

  const handleDateTextChange = (val: string) => {
    let cleaned = val.replace(/[^0-9.]/g, "");
    const numbers = cleaned.replace(/\./g, "");
    let formatted = "";
    if (numbers.length > 0) {
      formatted += numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += "." + numbers.substring(2, 4);
    }
    if (numbers.length > 4) {
      formatted += "." + numbers.substring(4, 8);
    }
    setDateText(formatted);
    if (formatted.length === 10) {
      const iso = parseToISODate(formatted);
      if (iso) {
        setValue("tarih", iso);
      }
    }
  };

  // Fetch banks on mount
  useEffect(() => {
    fetch("/api/accounting/banks")
      .then((res) => res.json())
      .then((data) => {
        const banksList = Array.isArray(data) ? data : (data?.data || []);
        setBanks(banksList);
        if (banksList.length > 0) {
          setValue("bankId", banksList[0].id);
        }
      })
      .catch((err) => console.error("Error loading banks:", err));
  }, [setValue]);

  const watchTutar = parseTurkishCurrency(watch("tutar")) || 0;
  const watchOdemeYontemi = watch("odemeYontemi");
  const watchBankId = watch("bankId");
  const watchMatchedInvoices = watch("matchedInvoices") || [];

  // Description and Notes Character Counters
  const watchAciklama = watch("aciklama") || "";
  const watchMuhasebeNotu = watch("muhasebeNotu") || "";
  const watchIcNot = watch("icNot") || "";

  // Selected bank details
  const selectedBank = useMemo(() => {
    return banks.find((b) => b.id === watchBankId);
  }, [banks, watchBankId]);

  // Set IBAN dynamically when bank is selected
  useEffect(() => {
    if (selectedBank) {
      setValue("iban", selectedBank.iban);
    } else {
      setValue("iban", "");
    }
  }, [selectedBank, setValue]);

  // useMemo Calculations for Balances
  const currentBalance = activeAccount.balance;
  const riskLimit = activeAccount.riskLimit || 0;

  // TRY karşılığı
  const tutarTRY = useMemo(() => {
    return watchParaBirimi === "TRY" ? watchTutar : watchTutar * watchDovizKuru;
  }, [watchTutar, watchParaBirimi, watchDovizKuru]);

  const postBalance = useMemo(() => {
    return isOdeme ? currentBalance + watchTutar : currentBalance - watchTutar;
  }, [currentBalance, watchTutar, isOdeme]);

  const availableLimit = useMemo(() => {
    const balanceToUse = postBalance > 0 ? postBalance : 0;
    return riskLimit - balanceToUse;
  }, [riskLimit, postBalance]);

  // Total invoice matching amount
  const matchedTotal = useMemo(() => {
    return watchMatchedInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  }, [watchMatchedInvoices]);

  // Gecikme faizi hesabı
  const gecikmeInterest = useMemo(() => {
    if (watchGecikmeKatsayisi <= 0 || watchGecikmeGun <= 0 || watchTutar <= 0) return 0;
    return (watchTutar * watchGecikmeKatsayisi * watchGecikmeGun) / 36500;
  }, [watchTutar, watchGecikmeKatsayisi, watchGecikmeGun]);

  const toplamTahsilat = useMemo(() => {
    return watchTutar + gecikmeInterest;
  }, [watchTutar, gecikmeInterest]);

  // Taksit planı
  const vadeBaslangic = watch("cekVadeTarihi") || watch("senetVadeTarihi") || watchTarih;
  const installmentPlan = useMemo(() => {
    if ((watchOdemeYontemi === "Çek" || watchOdemeYontemi === "Senet") && watchTaksitSayisi > 1) {
      return generateInstallments(toplamTahsilat, watchTaksitSayisi, vadeBaslangic, activeAccount.currency);
    }
    return [];
  }, [watchOdemeYontemi, watchTaksitSayisi, toplamTahsilat, vadeBaslangic, activeAccount.currency]);

  // Muhasebe yevmiye önizleme
  const journalEntries = useMemo(() => {
    if (watchTutar <= 0) return [];
    const entries: Array<{ hesapNo: string; hesapAdi: string; borc: number; alacak: number }> = [];
    const odemeYontemi = watchOdemeYontemi;

    if (isOdeme) {
      entries.push({ hesapNo: "320.01", hesapAdi: "Satıcılar - " + activeAccount.name.slice(0, 20), borc: watchTutar, alacak: 0 });
      if (odemeYontemi === "Nakit") {
        entries.push({ hesapNo: "100.01", hesapAdi: "Kasa", borc: 0, alacak: watchTutar });
      } else if (odemeYontemi === "Banka Havalesi" || odemeYontemi === "EFT") {
        entries.push({ hesapNo: "102.01", hesapAdi: "Bankalar", borc: 0, alacak: watchTutar });
      } else if (odemeYontemi === "Kredi Kartı" || odemeYontemi === "Pos Tahsilatı") {
        entries.push({ hesapNo: "108.01", hesapAdi: "Diğer Hazır Değerler (POS)", borc: 0, alacak: watchTutar });
      } else if (odemeYontemi === "Çek") {
        entries.push({ hesapNo: "103.01", hesapAdi: "Verilen Çekler ve Ödeme Emirleri", borc: 0, alacak: watchTutar });
      } else if (odemeYontemi === "Senet") {
        entries.push({ hesapNo: "321.01", hesapAdi: "Borç Senetleri", borc: 0, alacak: watchTutar });
      }
    } else {
      // Alacak tarafı - her zaman 120.XX Alıcılar
      if (odemeYontemi === "Nakit") {
        entries.push({ hesapNo: "100.01", hesapAdi: "Kasa", borc: watchTutar, alacak: 0 });
      } else if (odemeYontemi === "Banka Havalesi" || odemeYontemi === "EFT") {
        entries.push({ hesapNo: "102.01", hesapAdi: "Bankalar", borc: watchTutar, alacak: 0 });
      } else if (odemeYontemi === "Kredi Kartı" || odemeYontemi === "Pos Tahsilatı") {
        entries.push({ hesapNo: "108.01", hesapAdi: "Diğer Hazır Değerler (POS)", borc: watchTutar, alacak: 0 });
      } else if (odemeYontemi === "Çek") {
        entries.push({ hesapNo: "101.01", hesapAdi: "Alınan Çekler", borc: watchTutar, alacak: 0 });
      } else if (odemeYontemi === "Senet") {
        entries.push({ hesapNo: "121.01", hesapAdi: "Alacak Senetleri", borc: watchTutar, alacak: 0 });
      }
      entries.push({ hesapNo: "120.01", hesapAdi: "Alıcılar - " + activeAccount.name.slice(0, 20), borc: 0, alacak: watchTutar });
      if (gecikmeInterest > 0) {
        entries.push({ hesapNo: "102.01", hesapAdi: "Bankalar (Gecikme Faizi)", borc: gecikmeInterest, alacak: 0 });
        entries.push({ hesapNo: "642.01", hesapAdi: "Faiz Gelirleri", borc: 0, alacak: gecikmeInterest });
      }
    }
    return entries;
  }, [watchTutar, watchOdemeYontemi, activeAccount.name, gecikmeInterest, isOdeme]);

  // Auto distribute collection amount to oldest invoices first
  const handleAutoDistribute = () => {
    let remainingAmount = watchTutar;
    if (remainingAmount <= 0) {
      toast.error(isOdeme ? "Lütfen önce bir ödeme tutarı girin." : "Lütfen önce bir tahsilat tutarı girin.");
      return;
    }
    const sortedInvoices = [...unpaidInvoices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const matches: Array<{ invoiceId: string; amount: number }> = [];
    for (const inv of sortedInvoices) {
      if (remainingAmount <= 0) break;
      const paymentForInv = Math.min(inv.totalAmount, remainingAmount);
      matches.push({
        invoiceId: inv.id,
        amount: Number(paymentForInv.toFixed(2)),
      });
      remainingAmount -= paymentForInv;
    }
    setValue("matchedInvoices", matches);
    toast.success(isOdeme ? "Ödeme tutarı açık faturalara otomatik olarak dağıtıldı." : "Tahsilat tutarı açık faturalara otomatik olarak dağıtıldı.");
  };

  // Checkbox toggle for Invoice Table
  const handleToggleInvoice = (invId: string, fullAmt: number) => {
    const exists = watchMatchedInvoices.find((i) => i.invoiceId === invId);
    if (exists) {
      setValue(
        "matchedInvoices",
        watchMatchedInvoices.filter((i) => i.invoiceId !== invId)
      );
    } else {
      const unassigned = watchTutar - matchedTotal;
      const payAmount = Math.max(0, Math.min(fullAmt, unassigned));
      setValue("matchedInvoices", [
        ...watchMatchedInvoices,
        { invoiceId: invId, amount: Number(payAmount.toFixed(2)) },
      ]);
    }
  };

  // Matched Invoice Amount Change Handler
  const handleInvoiceAmountChange = (invId: string, val: number) => {
    setValue(
      "matchedInvoices",
      watchMatchedInvoices.map((i) =>
        i.invoiceId === invId ? { ...i, amount: val } : i
      )
    );
  };

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      }));
      setUploadedFiles((prev) => [...prev, ...filesArray]);
      toast.success(`${filesArray.length} dosya yüklendi.`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      }));
      setUploadedFiles((prev) => [...prev, ...filesArray]);
      toast.success(`${filesArray.length} dosya yüklendi.`);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
    toast.info("Dosya kaldırıldı.");
  };

  // On Form Submit Handler
  const onSubmit = async (data: TahsilatFormInput) => {
    if (matchedTotal > 0 && Math.abs(matchedTotal - watchTutar) > 0.01) {
      toast.warning(isOdeme ? "Fatura eşleştirme tutarları toplamı, ödeme tutarı ile eşleşmiyor." : "Fatura eşleştirme tutarları toplamı, tahsilat tutarı ile eşleşmiyor.");
    }

    const toastId = toast.loading(isOdeme ? "Ödeme işlemi kaydediliyor..." : "Tahsilat işlemi kaydediliyor...");
    try {
      const parsedTutar = parseTurkishCurrency(data.tutar) || 0;
      const res = await fetch(`/api/accounting/current-accounts/${activeAccount.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isOdeme ? "odeme" : "tahsilat",
          amount: parsedTutar,
          description: data.aciklama,
          paymentMethod: data.odemeYontemi,
          bankId: (data.odemeYontemi === "Banka Havalesi" || data.odemeYontemi === "EFT" || data.odemeYontemi === "Pos Tahsilatı" || data.odemeYontemi === "Kredi Kartı") ? data.bankId : undefined,
          belgeNo: data.belgeNo,
          belgeTarihi: data.tarih,
          doviz: data.paraBirimi,
          dovizKuru: data.dovizKuru,
          islemDurumu: data.islemDurumu,
          referansNo: data.referansNo,
          tahsilatTuru: data.tahsilatTuru,
          matchedInvoices: data.matchedInvoices,
          iban: data.iban,
          dekontNo: data.dekontNo,
          islemRefNo: data.islemRefNo,
          cekNo: data.cekNo,
          bankaAdi: data.bankaAdi,
          sube: data.sube,
          kesideTarihi: data.kesideTarihi,
          cekVadeTarihi: data.cekVadeTarihi,
          senetNo: data.senetNo,
          duzenlemeTarihi: data.duzenlemeTarihi,
          senetVadeTarihi: data.senetVadeTarihi,
          taksitSayisi: data.taksitSayisi,
          gecikmeKatsayisi: data.gecikmeKatsayisi,
          gecikmeGun: data.gecikmeGun,
          gecikmeInterest: gecikmeInterest,
          toplamTahsilat: toplamTahsilat,
          muhasebeNotu: data.muhasebeNotu,
          icNot: data.icNot,
        }),
      });

      const result = await res.json();
      toast.dismiss(toastId);

      if (!res.ok || result.error) {
        toast.error(result.error || "İşlem kaydedilemedi.");
      } else {
        toast.success(isOdeme ? "💸 Ödeme işlemi başarıyla kaydedildi." : "💰 Tahsilat işlemi başarıyla kaydedildi.");
        reset();
        setUploadedFiles([]);
        onSaveSuccess({ ...result, paymentMethod: data.odemeYontemi, amount: parsedTutar, matchedInvoicesCount: (data.matchedInvoices || []).length });
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(isOdeme ? "Sistemsel hata: Ödeme kaydedilemedi." : "Sistemsel hata: Tahsilat kaydedilemedi.");
    }
  };

  const selectedDurumu = ISLEM_DURUMU_OPTIONS.find(d => d.value === watchIslemDurumu) || ISLEM_DURUMU_OPTIONS[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-3 text-slate-800 ">
          <div className={`p-1.5 rounded-lg ${isOdeme ? "bg-red-100 " : "bg-orange-100 "}`}>
            <Landmark className={`w-4 h-4 ${isOdeme ? "text-red-500 " : "text-orange-500 "}`} />
          </div>
          <div>
            <span className="font-extrabold tracking-tight block text-sm">{isOdeme ? "Ödeme İşlemi Kaydet" : "Tahsilat İşlemi Kaydet"}</span>
            <span className="text-xs text-slate-400 font-normal block -mt-0.5">ERP Seviyesi • v2.0</span>
          </div>
          <div className={`ml-auto mr-8 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${selectedDurumu.color}`}>
            {renderDurumuIcon(selectedDurumu.iconType)}
            {selectedDurumu.label}
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs text-slate-800 ">

        {/* GECİKME UYARISI - Vadesi Geçmiş Fatura */}
        {overdueInvoices.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-50  border border-red-200  rounded-xl animate-in fade-in duration-300">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-red-600 ">
                {overdueInvoices.length} adet vadesi geçmiş fatura bulunmaktadır!
              </p>
              <p className="text-xs text-red-400 mt-0.5">
                En uzun gecikme: {Math.max(...overdueInvoices.map(i => calcOverdueDays(i.dueDate)))} gün • 
                Toplam: {formatCurrency(overdueInvoices.reduce((s, i) => s + i.totalAmount, 0), activeAccount.currency)}
              </p>
            </div>
          </div>
        )}

        {/* ÜST BİLGİ KARTI - Cari Durum Özeti */}
        <div className="bg-slate-50  p-4 border border-slate-200  rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500  font-semibold uppercase tracking-wider block">Cari Hesap</span>
            <span className="font-black text-slate-800  truncate block text-sm">{activeAccount.name}</span>
            <span className="text-xs bg-orange-50  text-orange-600  px-2 py-0.5 rounded-full font-bold inline-block">
              {activeAccount.cariKod || "CR-KODSUZ"} • {activeAccount.cariTipi === "CORPORATE" ? "B2B" : "B2C"}
            </span>
          </div>
          
          <div className="space-y-1 border-l border-slate-200  pl-4">
            <span className="text-xs text-slate-500  font-semibold uppercase tracking-wider block">Mevcut Bakiye</span>
            <span className={`text-sm font-black ${currentBalance > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {formatCurrency(Math.abs(currentBalance), activeAccount.currency)}
            </span>
            <span className="text-xs text-slate-400 block">{currentBalance > 0 ? "▲ Cari Borçlu" : "▼ Biz Borçluyuz"}</span>
          </div>

          <div className="space-y-1 border-l border-slate-200  pl-4">
            <span className="text-xs text-slate-500  font-semibold uppercase tracking-wider block">{isOdeme ? "Ödeme Sonrası" : "Tahsilat Sonrası"}</span>
            <span className={`text-sm font-black transition-colors ${postBalance > 0 ? "text-red-500 " : "text-emerald-500"}`}>
              {formatCurrency(Math.abs(postBalance), activeAccount.currency)}
            </span>
            <span className={`text-xs block ${watchTutar > 0 ? (isOdeme ? "text-red-500 font-bold" : "text-orange-500 font-bold") : "text-slate-400"}`}>
              {watchTutar > 0 ? (isOdeme ? `↓ ${formatCurrency(watchTutar, activeAccount.currency)} ödenecek` : `↓ ${formatCurrency(watchTutar, activeAccount.currency)} tahsil edilecek`) : "Tutar girilmedi"}
            </span>
          </div>

          <div className="space-y-1 border-l border-slate-200  pl-4">
            <span className="text-xs text-slate-500  font-semibold uppercase tracking-wider block">Risk / Limit</span>
            <span className={`text-sm font-black ${availableLimit < 0 ? "text-red-500 " : "text-slate-800 "}`}>
              {formatCurrency(availableLimit, activeAccount.currency)}
            </span>
            <span className="text-xs text-slate-400 block">Risk Limiti: {formatCurrency(riskLimit, activeAccount.currency)}</span>
          </div>
        </div>

        {/* İŞLEM DURUMU TABS */}
        <div className="flex gap-2 p-1 bg-slate-100  rounded-xl">
          {ISLEM_DURUMU_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("islemDurumu", opt.value as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                watchIslemDurumu === opt.value
                  ? `${opt.color} shadow-sm`
                  : "text-slate-500  hover:bg-white "
              }`}
            >
              {renderDurumuIcon(opt.iconType)}
              {opt.label}
            </button>
          ))}
        </div>

        {/* İKİ SÜTUNLU ANA YAPI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* SOL SÜTUN */}
          <div className="space-y-4">
            
            {/* İşlem Genel Bilgileri */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-4">
              <h3 className="font-black text-slate-800  border-b border-slate-100  pb-2 flex items-center gap-1.5 text-sm">
                <FileText className={`w-4 h-4 ${isOdeme ? "text-red-500" : "text-orange-500"}`} />
                İşlem Genel Bilgileri
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* İşlem Tarihi - Hem metin hem picker */}
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700  block">İşlem Tarihi *</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={dateText}
                      onChange={(e) => handleDateTextChange(e.target.value)}
                      placeholder="GG.AA.YYYY"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200  bg-white  rounded-xl outline-none font-bold focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-slate-900 "
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          (datePickerRef.current as any)?.showPicker();
                        } catch (err) {
                          datePickerRef.current?.click();
                        }
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
                      title="Tarih Seç"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <input 
                      ref={datePickerRef}
                      type="date"
                      value={watchTarih || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setValue("tarih", val);
                        }
                      }}
                      className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
                    />
                  </div>
                  {errors.tarih && <p className="text-red-500 text-xs font-bold">{errors.tarih.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700  block">Belge No</label>
                  <input 
                    type="text" 
                    placeholder="TSH00125" 
                    {...register("belgeNo")} 
                    className="w-full px-3 py-2 border border-slate-200  bg-white  rounded-xl outline-none font-bold focus:border-orange-500 text-slate-900 "
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700  block">Referans No</label>
                  <input 
                    type="text" 
                    placeholder="Ref veya Dekont" 
                    {...register("referansNo")} 
                    className="w-full px-3 py-2 border border-slate-200  bg-white  rounded-xl outline-none text-slate-900 "
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700  block">{isOdeme ? "Ödeme Türü *" : "Tahsilat Türü *"}</label>
                  <select 
                    {...register("tahsilatTuru")}
                    className="w-full px-3 py-2 border border-slate-200  bg-white  rounded-xl outline-none font-bold text-slate-900 "
                  >
                    {isOdeme ? (
                      <>
                        <option value="Cari Ödemesi">Cari Ödemesi</option>
                        <option value="Fatura Ödemesi">Fatura Ödemesi</option>
                        <option value="Avans Ödemesi">Avans Ödemesi</option>
                        <option value="Gider Ödemesi">Gider Ödemesi</option>
                        <option value="Tedarikçi Ödemesi">Tedarikçi Ödemesi</option>
                      </>
                    ) : (
                      <>
                        <option value="Cari Tahsilatı">Cari Tahsilatı</option>
                        <option value="Fatura Tahsilatı">Fatura Tahsilatı</option>
                        <option value="Avans Tahsilatı">Avans Tahsilatı</option>
                        <option value="Diğer Gelir Tahsilatı">Diğer Gelir Tahsilatı</option>
                      </>
                    )}
                  </select>
                  {errors.tahsilatTuru && <p className="text-red-500 text-xs font-bold">{errors.tahsilatTuru.message}</p>}
                </div>
              </div>
            </div>

            {/* Tahsilat Tutarı & Yöntemi */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-4">
              <h3 className="font-black text-slate-800  border-b border-slate-100  pb-2 flex items-center gap-1.5 text-sm">
                <CreditCard className={`w-4 h-4 ${isOdeme ? "text-red-500" : "text-emerald-600"}`} />
                {isOdeme ? "Ödeme Tutarı & Yöntemi" : "Tahsilat Tutarı & Yöntemi"}
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="font-extrabold text-slate-700  block">{isOdeme ? "Ödeme Tutarı *" : "Tahsilat Tutarı *"}</label>
                  <Input 
                    type="currency" 
                    required 
                    placeholder="0,00"
                    {...register("tutar")}
                    className="w-full px-3 py-2.5 border border-slate-200  bg-white  rounded-xl outline-none text-slate-900  text-base font-black focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                  />
                  {errors.tutar && <p className="text-red-500 text-xs font-bold">{errors.tutar.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700  block">Para Birimi *</label>
                  <select 
                    {...register("paraBirimi")}
                    className="w-full px-3 py-2.5 border border-slate-200  bg-white  rounded-xl outline-none font-bold text-slate-900  text-base"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Döviz Kuru (yabancı para biriminde) */}
              {watchParaBirimi !== "TRY" && (
                <div className="p-3 bg-blue-50  border border-blue-200  rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-1.5 text-blue-600 ">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="font-bold text-xs">DÖVİZ KURU BİLGİSİ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">1 {watchParaBirimi} = ? TRY</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        {...register("dovizKuru")}
                        className="w-full px-2.5 py-1.5 border border-blue-200  bg-white  rounded-lg outline-none font-bold text-slate-900  focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-500  block">TRY Karşılığı</label>
                      <div className="px-2.5 py-1.5 border border-blue-200  bg-blue-50  rounded-lg font-black text-blue-700 ">
                        {formatCurrency(tutarTRY, "TRY")}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-400 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Kur değeri bankadan alınan anlık değer üzerinden güncellenmektedir. Lütfen doğrulayın.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700  block">Ödeme Yöntemi *</label>
                <select 
                  {...register("odemeYontemi")}
                  className={`w-full px-3 py-2 border rounded-xl outline-none font-bold text-slate-900  bg-white  focus:ring-1 ${
                    isOdeme 
                      ? "border-slate-200  focus:border-red-500 focus:ring-red-500/20" 
                      : "border-slate-200  focus:border-orange-500 focus:ring-orange-500/20"
                  }`}
                >
                  <option value="Banka Havalesi">Banka Havalesi</option>
                  <option value="EFT">EFT</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Pos Tahsilatı">Pos Tahsilatı</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                  <option value="Çek">Çek</option>
                  <option value="Senet">Senet</option>
                </select>
                {errors.odemeYontemi && <p className="text-red-500 text-xs font-bold">{errors.odemeYontemi.message}</p>}
              </div>

              {/* Banka Havalesi / EFT / POS */}
              {(watchOdemeYontemi === "Banka Havalesi" || watchOdemeYontemi === "EFT" || watchOdemeYontemi === "Pos Tahsilatı" || watchOdemeYontemi === "Kredi Kartı") && (
                <div className="p-3 bg-slate-50  border border-slate-200  rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Banka Hesabı *</label>
                      <select 
                        {...register("bankId")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      >
                        <option value="">Hesap Seçin...</option>
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Mevcut Bakiye</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={selectedBank ? `${formatCurrency(selectedBank.balance, selectedBank.currency)}` : "Hesap Seçilmedi"}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-slate-100  rounded-lg text-slate-600  font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700  block">IBAN</label>
                    <input 
                      type="text" 
                      readOnly 
                      {...register("iban")} 
                      className="w-full px-2 py-1.5 border border-slate-200  bg-slate-100  rounded-lg text-xs text-slate-600  font-mono outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Dekont No</label>
                      <input 
                        type="text" 
                        placeholder="DKN-00125" 
                        {...register("dekontNo")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800 "
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">İşlem Referans No</label>
                      <input 
                        type="text" 
                        placeholder="REF-88995" 
                        {...register("islemRefNo")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800 "
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Çek */}
              {watchOdemeYontemi === "Çek" && (
                <div className="p-3 bg-slate-50  border border-slate-200  rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Çek No</label>
                      <input 
                        type="text" 
                        placeholder="Çek seri numarası" 
                        {...register("cekNo")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Banka Adı</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Garanti" 
                        {...register("bankaAdi")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800 "
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Şube</label>
                      <input 
                        type="text" 
                        placeholder="Merkez" 
                        {...register("sube")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800 "
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Keşide Tarihi</label>
                      <input 
                        type="date" 
                        {...register("kesideTarihi")}
                        className="w-full px-2 py-1 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Vade Tarihi</label>
                      <input 
                        type="date" 
                        {...register("cekVadeTarihi")}
                        className="w-full px-2 py-1 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      />
                    </div>
                  </div>
                  {/* Taksit Sayısı */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Taksit Sayısı
                      </label>
                      <select {...register("taksitSayisi")} className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold">
                        {[1,2,3,4,5,6,9,12,18,24,36].map(n => (
                          <option key={n} value={n}>{n} Taksit</option>
                        ))}
                      </select>
                    </div>
                    {watchTaksitSayisi > 1 && (
                      <div className="flex items-end">
                        <button type="button" onClick={() => setShowInstallments(!showInstallments)} className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200   text-slate-700  rounded-lg font-bold transition flex items-center justify-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" />
                          {showInstallments ? "Planı Gizle" : "Taksit Planı"}
                          {showInstallments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Senet */}
              {watchOdemeYontemi === "Senet" && (
                <div className="p-3 bg-slate-50  border border-slate-200  rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Senet No</label>
                      <input 
                        type="text" 
                        placeholder="Senet No" 
                        {...register("senetNo")}
                        className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Düzenleme Tarihi</label>
                      <input 
                        type="date" 
                        {...register("duzenlemeTarihi")}
                        className="w-full px-2 py-1 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block">Vade Tarihi</label>
                      <input 
                        type="date" 
                        {...register("senetVadeTarihi")}
                        className="w-full px-2 py-1 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700  block flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Taksit Sayısı
                      </label>
                      <select {...register("taksitSayisi")} className="w-full px-2 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold">
                        {[1,2,3,4,5,6,9,12,18,24,36].map(n => (
                          <option key={n} value={n}>{n} Taksit</option>
                        ))}
                      </select>
                    </div>
                    {watchTaksitSayisi > 1 && (
                      <div className="flex items-end">
                        <button type="button" onClick={() => setShowInstallments(!showInstallments)} className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200   text-slate-700  rounded-lg font-bold transition flex items-center justify-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" />
                          {showInstallments ? "Planı Gizle" : "Taksit Planı"}
                          {showInstallments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Taksit Planı Tablosu */}
              {showInstallments && installmentPlan.length > 0 && (
                <div className="border border-slate-200  rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-50  px-3 py-2 border-b border-slate-200  flex items-center gap-1.5 font-bold text-xs text-slate-700 ">
                    <ListChecks className="w-3.5 h-3.5 text-orange-500" />
                    TAKSİT PLANI — {watchTaksitSayisi} Taksit
                  </div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50  border-b border-slate-200 ">
                      <tr>
                        <th className="p-2 text-left font-extrabold text-slate-500">No</th>
                        <th className="p-2 text-left font-extrabold text-slate-500">Vade Tarihi</th>
                        <th className="p-2 text-right font-extrabold text-slate-500">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 ">
                      {installmentPlan.map((inst) => (
                        <tr key={inst.no} className="hover:bg-slate-50 ">
                          <td className="p-2 font-bold text-slate-700 ">{inst.no}.</td>
                          <td className="p-2 text-slate-600 ">{new Date(inst.date).toLocaleDateString("tr-TR")}</td>
                          <td className="p-2 text-right font-black text-orange-600 ">{formatCurrency(inst.amount, activeAccount.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={`border-t ${isOdeme ? "bg-red-50  border-red-200 " : "bg-orange-50  border-orange-200 "}`}>
                      <tr>
                        <td colSpan={2} className={`p-2 font-black ${isOdeme ? "text-red-600 " : "text-orange-600 "}`}>TOPLAM</td>
                        <td className={`p-2 text-right font-black ${isOdeme ? "text-red-600 " : "text-orange-600 "}`}>{formatCurrency(toplamTahsilat, activeAccount.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* GECİKME FAİZİ HESAPLAMA */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-3">
              <h3 className="font-black text-slate-800  border-b border-slate-100  pb-2 flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-red-500" />
                Gecikme Faizi Hesabı
                <span className="ml-auto text-[11px] text-slate-400 font-normal">İsteğe bağlı</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700  block">Gecikme Gün Sayısı</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    {...register("gecikmeGun")}
                    className="w-full px-2.5 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold outline-none focus:border-red-400"
                  />
                  {overdueInvoices.length > 0 && (
                    <button type="button" onClick={() => setValue("gecikmeGun", Math.max(...overdueInvoices.map(i => calcOverdueDays(i.dueDate))))}
                      className="text-[11px] text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      Max gecikme gününü uygula ({Math.max(...overdueInvoices.map(i => calcOverdueDays(i.dueDate)))} gün)
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700  block">Yıllık Faiz Oranı (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    placeholder="0.00"
                    {...register("gecikmeKatsayisi")}
                    className="w-full px-2.5 py-1.5 border border-slate-200  bg-white  rounded-lg text-slate-800  font-bold outline-none focus:border-red-400"
                  />
                </div>
              </div>
              {gecikmeInterest > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-red-50  border border-red-200  rounded-xl">
                  <span className="font-bold text-red-600  text-[11px]">Hesaplanan Gecikme Faizi:</span>
                  <span className="font-black text-red-600 ">{formatCurrency(gecikmeInterest, activeAccount.currency)}</span>
                </div>
              )}
              {gecikmeInterest > 0 && (
                <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isOdeme 
                    ? "bg-red-50  border-red-200 " 
                    : "bg-orange-50  border-orange-200 "
                }`}>
                  <span className={`font-bold text-[11px] ${isOdeme ? "text-red-600 " : "text-orange-600 "}`}>
                    {isOdeme ? "Gecikme Dahil Toplam Ödeme:" : "Gecikme Dahil Toplam Tahsilat:"}
                  </span>
                  <span className={`font-black text-sm ${isOdeme ? "text-red-600 " : "text-orange-600 "}`}>
                    {formatCurrency(toplamTahsilat, activeAccount.currency)}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-400 flex items-start gap-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                Formül: Anapara × Faiz Oranı × Gün / 36.500 (Günlük Bileşik Faiz)
              </p>
            </div>

            {/* NOTLAR */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-3">
              <h3 className="font-black text-slate-800  border-b border-slate-100  pb-2 flex items-center gap-1.5 text-sm">
                <BookOpen className="w-4 h-4 text-violet-600" />
                Açıklama & Notlar
              </h3>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-extrabold text-slate-700  block">Açıklama</label>
                  <span className="text-[11px] text-slate-400 font-bold">{watchAciklama.length} / 500</span>
                </div>
                <textarea 
                  rows={2}
                  maxLength={500}
                  placeholder="Cari eksterde görünecek genel açıklama..."
                  {...register("aciklama")}
                  className="w-full px-3 py-1.5 border border-slate-200  bg-white  rounded-xl outline-none resize-none text-slate-800 "
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-slate-700  block">Muhasebe Notu</label>
                    <span className="text-[11px] text-slate-400 font-bold">{watchMuhasebeNotu.length}/500</span>
                  </div>
                  <textarea 
                    rows={2}
                    maxLength={500}
                    placeholder="Sadece muhasebe birimine..."
                    {...register("muhasebeNotu")}
                    className="w-full px-3 py-1.5 border border-slate-200  bg-white  rounded-xl outline-none resize-none text-slate-800 "
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold text-slate-700  block">İç Not</label>
                    <span className="text-[11px] text-slate-400 font-bold">{watchIcNot.length}/500</span>
                  </div>
                  <textarea 
                    rows={2}
                    maxLength={500}
                    placeholder="Sistem içinde kalacak..."
                    {...register("icNot")}
                    className="w-full px-3 py-1.5 border border-slate-200  bg-white  rounded-xl outline-none resize-none text-slate-800 "
                  />
                </div>
              </div>
            </div>

          </div>

          {/* SAĞ SÜTUN */}
          <div className="space-y-4">
            
            {/* Açık Fatura Eşleştirme */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100  pb-2">
                <h3 className="font-black text-slate-800  flex items-center gap-1.5 text-sm">
                  <FileSpreadsheet className={`w-4 h-4 ${isOdeme ? "text-red-500" : "text-orange-500"}`} />
                  Açık Fatura Eşleştirme
                  {unpaidInvoices.length > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${isOdeme ? "bg-red-100  text-red-600 " : "bg-orange-100  text-orange-600 "}`}>
                      {unpaidInvoices.length} Açık
                    </span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className={`px-2.5 py-1 font-semibold rounded-lg transition text-xs flex items-center gap-1 ${
                    isOdeme 
                      ? "bg-red-50 hover:bg-red-100   text-red-600 " 
                      : "bg-orange-50 hover:bg-orange-100   text-orange-600 "
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  FIFO Otomatik Dağıt
                </button>
              </div>

              {unpaidInvoices.length === 0 ? (
                <div className="text-center py-8 bg-slate-50  border border-dashed border-slate-200  rounded-xl text-slate-400 italic">
                  Cariye ait açık fatura bulunmamaktadır.
                </div>
              ) : (
                <div className="border border-slate-200  rounded-xl overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-50  border-b border-slate-200  text-slate-500  font-extrabold sticky top-0">
                        <tr>
                          <th className="p-2 w-8 text-center">Seç</th>
                          <th className="p-2">Fatura No</th>
                          <th className="p-2">Tarih / Vade</th>
                          <th className="p-2 text-right">Borç</th>
                          <th className="p-2 text-right">Kapatılacak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 ">
                        {unpaidInvoices.map((inv) => {
                          const match = watchMatchedInvoices.find((i) => i.invoiceId === inv.id);
                          const isChecked = !!match;
                          const kapatilacakTutar = match ? (Number(match.amount) || 0) : 0;
                          const overdueDays = calcOverdueDays(inv.dueDate);
                          
                          return (
                            <tr key={inv.id} className={`hover:bg-slate-50/60  ${isChecked ? (isOdeme ? "bg-red-50/40 " : "bg-orange-50/40 ") : ""}`}>
                              <td className="p-2 text-center">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleInvoice(inv.id, inv.totalAmount)}
                                  className={`w-3.5 h-3.5 rounded border-slate-300 focus:ring-0 cursor-pointer ${isOdeme ? "text-red-500  accent-red-500" : "text-orange-500  accent-orange-500"}`}
                                />
                              </td>
                              <td className="p-2">
                                <span className="font-bold text-slate-800  truncate max-w-[80px] block">{inv.id.slice(0, 10)}</span>
                                {overdueDays > 0 && (
                                  <span className="text-[11px] text-red-500 font-bold flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    {overdueDays}g gecikmiş
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-slate-500 ">
                                <span className="block">{new Date(inv.date).toLocaleDateString("tr-TR")}</span>
                                <span className={`text-[11px] block ${overdueDays > 0 ? "text-red-400" : "text-slate-400"}`}>
                                  V: {new Date(inv.dueDate).toLocaleDateString("tr-TR")}
                                </span>
                              </td>
                              <td className="p-2 text-right font-bold text-slate-800 ">
                                {formatCurrency(inv.totalAmount, activeAccount.currency)}
                              </td>
                              <td className="p-2 text-right w-24">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  disabled={!isChecked}
                                  value={kapatilacakTutar || ""}
                                  onChange={(e) => handleInvoiceAmountChange(inv.id, Number(e.target.value))}
                                  className="w-full px-1.5 py-0.5 border border-slate-200  bg-white  rounded font-bold text-right text-slate-800  outline-none disabled:bg-slate-50  disabled:text-slate-400"
                                  placeholder="0.00"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {watchTutar > 0 && (
                <div className="flex justify-between items-center bg-slate-50  px-3 py-2 rounded-xl border border-slate-200  font-bold text-xs">
                  <span className="text-slate-500">Dağıtılan / Kapatılan:</span>
                  <div className="flex items-center gap-2">
                    <span className={`${Math.abs(matchedTotal - watchTutar) < 0.01 ? "text-emerald-600 " : (isOdeme ? "text-red-500  font-extrabold" : "text-orange-500  font-extrabold")}`}>
                      {formatCurrency(matchedTotal, activeAccount.currency)} / {formatCurrency(watchTutar, activeAccount.currency)}
                    </span>
                    {Math.abs(matchedTotal - watchTutar) < 0.01 && watchMatchedInvoices.length > 0 && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dosya Yükleme */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-3">
              <h3 className="font-black text-slate-800  border-b border-slate-100  pb-2 flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4 text-teal-600" />
                Destekleyici Belgeler
              </h3>
              
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? (isOdeme ? "border-red-500 bg-red-50/20 " : "border-orange-500 bg-orange-50/20 ") 
                    : "border-slate-200  hover:border-slate-300 hover:bg-slate-50/40 "
                }`}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  className="hidden"
                />
                <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-800 ">Dekont veya evrak sürükleyin ya da seçin</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOCX (Maks. 5MB)</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-500 text-xs">Yüklenen Belgeler ({uploadedFiles.length})</span>
                  <div className="space-y-1.5">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 border border-slate-200  bg-slate-50  rounded-xl">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className={`w-4 h-4 shrink-0 ${isOdeme ? "text-red-500" : "text-orange-500"}`} />
                          <span className="font-bold text-slate-800  truncate text-xs">{file.name}</span>
                          <span className="text-[11px] text-slate-400">({file.size})</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MUHASEBEYEVMİYE ÖNİZLEME */}
            <div className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => setShowJournalPreview(!showJournalPreview)}
                className="w-full flex items-center justify-between group"
              >
                <h3 className="font-black text-slate-800  flex items-center gap-1.5 text-sm">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Muhasebe Yevmiye Önizlemesi
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-slate-600 transition">
                  <Eye className="w-3.5 h-3.5" />
                  {showJournalPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>

              {showJournalPreview && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  {journalEntries.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-[11px] italic">
                      Tutar girildiğinde yevmiye kaydı önizlenecek.
                    </div>
                  ) : (
                    <div className="border border-slate-200  rounded-xl overflow-hidden">
                      <div className="bg-indigo-50  px-3 py-2 border-b border-indigo-200  flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-bold text-xs text-indigo-700 ">
                          {new Date(watchTarih).toLocaleDateString("tr-TR")} — {watch("belgeNo")} Tahsilat Fişi
                        </span>
                      </div>
                      <table className="w-full text-[11px]">
                        <thead className="bg-slate-50  border-b border-slate-200 ">
                          <tr>
                            <th className="p-2 text-left font-extrabold text-slate-500">Hesap No</th>
                            <th className="p-2 text-left font-extrabold text-slate-500">Hesap Adı</th>
                            <th className="p-2 text-right font-extrabold text-slate-500">Borç</th>
                            <th className="p-2 text-right font-extrabold text-slate-500">Alacak</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 ">
                          {journalEntries.map((entry, idx) => (
                            <tr key={idx} className={`${entry.borc > 0 ? "bg-emerald-50/30 " : "bg-red-50/30 "}`}>
                              <td className="p-2 font-mono font-black text-slate-700 ">{entry.hesapNo}</td>
                              <td className="p-2 text-slate-700 ">{entry.hesapAdi}</td>
                              <td className="p-2 text-right font-bold text-emerald-600 ">
                                {entry.borc > 0 ? formatCurrency(entry.borc, activeAccount.currency) : "—"}
                              </td>
                              <td className="p-2 text-right font-bold text-red-500 ">
                                {entry.alacak > 0 ? formatCurrency(entry.alacak, activeAccount.currency) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-slate-200  bg-slate-50 ">
                          <tr>
                            <td colSpan={2} className="p-2 font-black text-slate-700  text-right">TOPLAM</td>
                            <td className="p-2 text-right font-black text-emerald-600">{formatCurrency(journalEntries.reduce((s, e) => s + e.borc, 0), activeAccount.currency)}</td>
                            <td className="p-2 text-right font-black text-red-500">{formatCurrency(journalEntries.reduce((s, e) => s + e.alacak, 0), activeAccount.currency)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="text-[11px] text-slate-400 p-2 text-center italic">
                        Bu önizlemedir. Gerçek kayıt muhasebe modülünde oluşturulacaktır.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* TAHSİLAT SONUCU ÖZETİ */}
        {watchTutar > 0 && (
          <div className={`p-4 rounded-2xl animate-in fade-in duration-300 border ${
            isOdeme 
              ? "bg-gradient-to-r from-red-50 to-rose-50   border-red-200 " 
              : "bg-gradient-to-r from-orange-50 to-amber-50   border-orange-200 "
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className={`w-5 h-5 shrink-0 ${isOdeme ? "text-red-500 " : "text-orange-500 "}`} />
              <h4 className="font-bold text-slate-800  text-xs">{isOdeme ? "Ödeme Önizleme Özeti" : "Tahsilat Önizleme Özeti"}</h4>
              <span className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${selectedDurumu.color}`}>
                {renderDurumuIcon(selectedDurumu.iconType)}
                {selectedDurumu.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-2 bg-white/70  rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Ana Tutar</span>
                <span className={`font-black ${isOdeme ? "text-red-600 " : "text-orange-600 "}`}>{formatCurrency(watchTutar, activeAccount.currency)}</span>
              </div>
              {watchParaBirimi !== "TRY" && (
                <div className="text-center p-2 bg-white/70  rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">TRY Karşılığı</span>
                  <span className="font-black text-blue-600 ">{formatCurrency(tutarTRY, "TRY")}</span>
                </div>
              )}
              {gecikmeInterest > 0 && (
                <div className="text-center p-2 bg-white/70  rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Gecikme Faizi</span>
                  <span className="font-black text-red-600 ">+{formatCurrency(gecikmeInterest, activeAccount.currency)}</span>
                </div>
              )}
              <div className="text-center p-2 bg-white/70  rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Eşleşen Fatura</span>
                <span className="font-black text-slate-800 ">{watchMatchedInvoices.length} Adet</span>
              </div>
              <div className="text-center p-2 bg-white/70  rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Kalan Bakiye</span>
                <span className={`font-black ${postBalance > 0 ? "text-red-500" : "text-emerald-500"}`}>
                  {formatCurrency(Math.abs(postBalance), activeAccount.currency)}
                </span>
              </div>
              {gecikmeInterest > 0 && (
                <div className={`text-center p-2 rounded-xl border col-span-2 md:col-span-1 ${
                  isOdeme 
                    ? "bg-red-100  border-red-200 " 
                    : "bg-orange-100  border-orange-200 "
                }`}>
                  <span className={`text-[11px] uppercase font-bold block ${isOdeme ? "text-red-500" : "text-orange-500"}`}>
                    {isOdeme ? "Toplam Ödeme" : "Toplam Tahsilat"}
                  </span>
                  <span className={`font-black text-sm ${isOdeme ? "text-red-700 " : "text-orange-700 "}`}>
                    {formatCurrency(toplamTahsilat, activeAccount.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALT BUTONLAR */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-border pt-4 gap-3">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => {
                reset();
                setValue("tutar", 0);
                setValue("matchedInvoices", []);
                setShowJournalPreview(false);
                setShowInstallments(false);
                toast.info("Form taslak olarak sıfırlandı.");
              }}
              className="px-4 py-2 border border-slate-200  text-slate-600  hover:bg-slate-50  rounded-xl font-bold transition text-xs"
            >
              Taslak Temizle
            </button>
            <button
              type="button"
              onClick={() => setShowJournalPreview(!showJournalPreview)}
              className="px-3 py-2 border border-indigo-200  text-indigo-600  hover:bg-indigo-50  rounded-xl font-bold transition text-xs flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Yevmiye Önizle
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 md:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200   text-slate-700  rounded-xl font-bold transition text-xs"
            >
              İptal
            </button>
            <button 
              type="button"
              onClick={() => {
                setValue("islemDurumu", "Müsvedde");
                toast.info("Müsvedde olarak kaydedildi.");
              }}
              className="flex-1 md:flex-none px-4 py-2 border border-slate-300  text-slate-600  hover:bg-slate-100  rounded-xl font-bold transition text-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Müsvedde
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 md:flex-none px-5 py-2.5 text-white rounded-xl font-bold transition shadow-md flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 ${
                isOdeme 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" 
                  : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
              }`}
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Kaydediliyor..." : (isOdeme ? "Ödemeyi Kaydet" : "Tahsilatı Kaydet")}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}

