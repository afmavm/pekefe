"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Banknote, Users, Calendar, Hash, FileText, Sparkles, Plus, 
  Trash2, RefreshCw, AlertCircle, CreditCard, ArrowRight, Search, 
  Check, CheckCircle2, Wallet, Info, ChevronRight, X, LayoutGrid, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, parseTurkishCurrency, formatTurkishCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

interface SupplierListItem {
  id: string;
  name: string;
  tax_no: string;
}

interface BankAccount {
  id: string;
  name: string;
  iban: string;
  currency: string;
  balance: number;
}

interface OpenInvoice {
  invoice_id: string;
  invoice_no: string;
  ettn_no: string;
  invoice_date: string;
  currency: string;
  exchange_rate: number;
  total_gross_amount: number;
  open_amount: number;
  status: string;
  notes: string | null;
}

interface SelectedSupplierDetails {
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  tax_no: string;
  balance: number;
}

export default function TedarikciOdemeleriPage() {
  // Metadata Lists
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);

  // Search and Autocomplete states
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Supplier states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierDetails, setSupplierDetails] = useState<SelectedSupplierDetails | null>(null);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Form inputs
  const [paymentNo, setPaymentNo] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [bankAccountId, setBankAccountId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("TRY");
  const [exchangeRate, setExchangeRate] = useState("1.0000");
  const [paymentAmountStr, setPaymentAmountStr] = useState(""); // UI format (Turkish currency format)
  const [notes, setNotes] = useState("");

  // Settlement Inputs: invoice_id -> applied_amount (number)
  const [settlementAmounts, setSettlementAmounts] = useState<{ [invoiceId: string]: string }>({});

  const [submitLoading, setSubmitLoading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial suppliers and banks
  const fetchMetadata = async () => {
    setMetadataLoading(true);
    try {
      // 1. Fetch suppliers
      const supRes = await fetch("/api/invoices/incoming?lists=true");
      const supData = await supRes.json();
      if (supData.suppliers) {
        setSuppliers(supData.suppliers);
      }

      // 2. Fetch banks
      const bankRes = await fetch("/api/accounting/banks");
      const bankData = await bankRes.json();
      const banksList = Array.isArray(bankData) ? bankData : (bankData?.data || []);
      setBanks(banksList);
    } catch (error) {
      console.error("Metadata fetch error:", error);
      toast.error("Tedarikçi ve banka bilgileri yüklenemedi.");
    } finally {
      setMetadataLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    generatePaymentNo();
  }, []);

  // Generate unique payment voucher code
  const generatePaymentNo = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setPaymentNo(`TED-${dateStr}-${randomSuffix}`);
  };

  // Fetch supplier invoices and balance when selected
  const fetchSupplierInvoices = async (supplierId: string) => {
    if (!supplierId) return;
    setInvoicesLoading(true);
    setSettlementAmounts({});
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/open-invoices`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setSupplierDetails(null);
        setOpenInvoices([]);
      } else {
        setSupplierDetails(data.supplier);
        setOpenInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Supplier invoices fetch error:", error);
      toast.error("Açık faturalar yüklenirken bir hata oluştu.");
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleSelectSupplier = (supplier: SupplierListItem) => {
    setSelectedSupplierId(supplier.id);
    setSupplierSearch(supplier.name);
    setShowDropdown(false);
    fetchSupplierInvoices(supplier.id);
  };

  // Reset selected supplier
  const handleClearSupplier = () => {
    setSelectedSupplierId("");
    setSupplierSearch("");
    setSupplierDetails(null);
    setOpenInvoices([]);
    setSettlementAmounts({});
  };

  // Filtered suppliers based on search query
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch || selectedSupplierId) return suppliers.slice(0, 8);
    const query = supplierSearch.toLowerCase();
    return suppliers.filter(
      sup => 
        sup.name.toLowerCase().includes(query) || 
        (sup.tax_no && sup.tax_no.includes(query))
    ).slice(0, 10);
  }, [suppliers, supplierSearch, selectedSupplierId]);

  // Numeric values
  const paymentAmountNum = useMemo(() => {
    return parseTurkishCurrency(paymentAmountStr) || 0;
  }, [paymentAmountStr]);

  const parsedExchangeRate = useMemo(() => {
    return parseFloat(exchangeRate) || 1.0;
  }, [exchangeRate]);

  // Total applied/settled amount
  const totalSettledNum = useMemo(() => {
    return Object.values(settlementAmounts).reduce((sum, val) => {
      const num = parseTurkishCurrency(val) || 0;
      return sum + num;
    }, 0);
  }, [settlementAmounts]);

  // Remaining / unapplied prepayment
  const unappliedPrepayment = useMemo(() => {
    const diff = paymentAmountNum - totalSettledNum;
    return diff > 0 ? diff : 0;
  }, [paymentAmountNum, totalSettledNum]);

  // New Supplier Balance calculation
  const newSupplierBalance = useMemo(() => {
    if (!supplierDetails) return 0;
    // Payment amount reduces supplier's balance (amount is multiplied by rate to convert to local TRY currency)
    const localPayment = paymentAmountNum * parsedExchangeRate;
    return supplierDetails.balance - localPayment;
  }, [supplierDetails, paymentAmountNum, parsedExchangeRate]);

  // FIFO distribution algorithm
  const handleFIFODistribute = () => {
    if (paymentAmountNum <= 0) {
      toast.warning("Lütfen önce dağıtılacak ödeme tutarı giriniz.");
      return;
    }

    let remainingPayment = paymentAmountNum;
    const newSettlements: { [invoiceId: string]: string } = {};

    // Open invoices are already sorted by date ASC (oldest first) from API
    for (const inv of openInvoices) {
      if (remainingPayment <= 0) {
        newSettlements[inv.invoice_id] = "0,00";
        continue;
      }
      
      const maxApplied = Math.min(remainingPayment, inv.open_amount);
      newSettlements[inv.invoice_id] = formatTurkishCurrency(maxApplied);
      remainingPayment = Math.round((remainingPayment - maxApplied) * 100) / 100;
    }

    setSettlementAmounts(newSettlements);
    toast.success("Ödeme tutarı açık faturalara FIFO sırasıyla otomatik dağıtıldı.");
  };

  // Close all outstanding invoices (match exact open amount)
  const handleMatchAll = () => {
    const newSettlements: { [invoiceId: string]: string } = {};
    let totalNeeded = 0;

    for (const inv of openInvoices) {
      newSettlements[inv.invoice_id] = formatTurkishCurrency(inv.open_amount);
      totalNeeded += inv.open_amount;
    }

    setSettlementAmounts(newSettlements);
    setPaymentAmountStr(formatTurkishCurrency(totalNeeded));
    toast.success("Tüm faturalar kapatıldı ve ödeme tutarı güncellendi.");
  };

  // Reset all settlements to 0
  const handleClearSettlements = () => {
    setSettlementAmounts({});
    toast.info("Tüm eşleştirmeler sıfırlandı.");
  };

  // Individual invoice settlement input change
  const handleSettlementChange = (invoiceId: string, value: string, maxLimit: number) => {
    const numericVal = parseTurkishCurrency(value) || 0;
    
    if (numericVal > maxLimit) {
      toast.error(`Kapatma tutarı faturanın açık bakiyesini (${formatCurrency(maxLimit)}) aşamaz!`);
      // Cap at maximum limit
      setSettlementAmounts(prev => ({
        ...prev,
        [invoiceId]: formatTurkishCurrency(maxLimit)
      }));
      return;
    }

    setSettlementAmounts(prev => ({
      ...prev,
      [invoiceId]: value
    }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      toast.error("Lütfen bir tedarikçi seçin.");
      return;
    }

    if (!paymentNo) {
      toast.error("Ödeme fiş numarası zorunludur.");
      return;
    }

    if (paymentAmountNum <= 0) {
      toast.error("Ödeme tutarı sıfırdan büyük olmalıdır.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Ödeme yöntemi seçilmelidir.");
      return;
    }

    if ((paymentMethod === "Bank Transfer" || paymentMethod === "Credit Card") && !bankAccountId) {
      toast.error("Banka havalesi veya kredi kartı ödemeleri için banka hesabı seçilmelidir.");
      return;
    }

    if (totalSettledNum > paymentAmountNum) {
      toast.error(`Faturalara dağıtılan toplam tutar (${formatCurrency(totalSettledNum)}) ödeme tutarından (${formatCurrency(paymentAmountNum)}) büyük olamaz.`);
      return;
    }

    setSubmitLoading(true);
    const toastId = toast.loading("Ödeme tediye fişi kaydediliyor ve faturalar kapatılıyor...");

    try {
      // Map settlements to API format
      const settlementsPayload = Object.entries(settlementAmounts)
        .map(([invoice_id, val]) => ({
          invoice_id,
          applied_amount: parseTurkishCurrency(val) || 0
        }))
        .filter(set => set.applied_amount > 0);

      const payload = {
        payment_no: paymentNo,
        supplier_id: selectedSupplierId,
        payment_date: paymentDate,
        amount: paymentAmountNum,
        currency: paymentCurrency,
        exchange_rate: parsedExchangeRate,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId || null,
        reference_no: referenceNo || null,
        notes: notes || "",
        settlements: settlementsPayload
      };

      const res = await fetch("/api/payments/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (data.success) {
        toast.success(data.message || "Ödeme başarıyla işlendi!");
        
        // Reset states
        setPaymentAmountStr("");
        setReferenceNo("");
        setNotes("");
        setSettlementAmounts({});
        generatePaymentNo();
        
        // Refresh supplier details and open invoices
        fetchSupplierInvoices(selectedSupplierId);
        fetchMetadata();
      } else {
        toast.error(data.error || "Ödeme kaydedilemedi.");
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error("Servis bağlantı hatası: " + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Page KPI summary details
  const pageKPIs = useMemo(() => {
    // Total open invoices in openInvoices list
    const outstandingTotal = openInvoices.reduce((sum, inv) => sum + inv.open_amount, 0);
    const openCount = openInvoices.length;
    
    // Bank balances summed
    const totalBankBalance = banks.reduce((sum, bank) => {
      // Sum in TRY equivalent for simplicity
      return sum + (bank.currency === "TRY" ? bank.balance : bank.balance * 32); // Approximate standard rate for display
    }, 0);

    return {
      outstandingTotal,
      openCount,
      totalBankBalance
    };
  }, [openInvoices, banks]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-orange-500 shrink-0" /> Tedarikçi Ödemeleri &amp; Tediye
            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/50 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider ml-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Fatura Kapatma (Settlement)
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Tedarikçilere tediye ödemesi gerçekleştirip resmi faturaları FIFO algoritması veya manuel eşleştirme ile kapatın.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-gray-500  text-xs font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" /> Seçili Tedarikçi Borcu
          </span>
          <span className="text-2xl font-bold text-gray-900  mt-2">
            {supplierDetails ? formatCurrency(supplierDetails.balance) : formatCurrency(0)}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            {supplierDetails ? `${supplierDetails.supplier_name}` : "Tedarikçi seçilmedi"}
          </span>
        </div>
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-amber-700  text-xs font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Kalan Açık Fatura Toplamı
          </span>
          <span className="text-2xl font-bold text-amber-700  mt-2">
            {supplierDetails ? formatCurrency(pageKPIs.outstandingTotal) : formatCurrency(0)}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            {pageKPIs.openCount} adet açık alış faturası var
          </span>
        </div>
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-emerald-700  text-xs font-medium flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Dağıtılan / Kapatılan Tutar
          </span>
          <span className="text-2xl font-bold text-emerald-700  mt-2">
            {formatCurrency(totalSettledNum)}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Girilen ödemenin faturalarla eşleşen kısmı
          </span>
        </div>
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-blue-700  text-xs font-medium flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-blue-500" /> Kalan Avans / Ön Ödeme
          </span>
          <span className="text-2xl font-bold text-blue-700  mt-2">
            {formatCurrency(unappliedPrepayment)}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Faturalarla eşleşmeyen kalan tutar (Cari Alacak)
          </span>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Payment Form */}
        <div className="lg:col-span-5 bg-white  rounded-2xl border border-gray-200/60  shadow-sm p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100  mb-6">
            <div className="p-2 bg-amber-50  rounded-xl text-amber-600">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 ">Tediye Ödeme Formu</h3>
              <p className="text-xs text-gray-400">Fiş detaylarını ve ödeme tutarını girin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Supplier Autocomplete Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="text-xs font-semibold text-gray-500  block mb-1">
                Tedarikçi Cari Seçimi *
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tedarikçi adı veya vergi no ile arayın..."
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowDropdown(true);
                    if (selectedSupplierId) {
                      // If typing, reset selection
                      setSelectedSupplierId("");
                      setSupplierDetails(null);
                      setOpenInvoices([]);
                      setSettlementAmounts({});
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full text-sm pl-9 pr-8 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-750  focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                
                {selectedSupplierId && (
                  <button
                    type="button"
                    onClick={handleClearSupplier}
                    className="absolute right-3 top-2.5 hover:text-red-500 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown List */}
              {showDropdown && filteredSuppliers.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white  border border-gray-200  rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-50 ">
                  {filteredSuppliers.map((sup) => (
                    <div
                      key={sup.id}
                      onClick={() => handleSelectSupplier(sup)}
                      className="px-4 py-2.5 hover:bg-gray-50  cursor-pointer text-xs flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-semibold text-gray-800 ">{sup.name}</div>
                        {sup.tax_no && (
                          <div className="text-xs text-gray-400 mt-0.5">VKN/TCKN: {sup.tax_no}</div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Supplier Badge Details */}
            {supplierDetails && (
              <div className="bg-gray-50/80  border border-gray-200/50  rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cari Kodu:</span>
                  <span className="font-semibold text-gray-800 ">{supplierDetails.supplier_code || "Tanımsız"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">VKN/TCKN:</span>
                  <span className="font-semibold text-gray-800 ">{supplierDetails.tax_no || "Tanımsız"}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200/50 ">
                  <span className="text-gray-650 font-medium">Güncel Borç Bakiyesi:</span>
                  <span className={`font-bold text-sm ${supplierDetails.balance >= 0 ? "text-amber-600" : "text-green-600"}`}>
                    {formatCurrency(supplierDetails.balance)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Fiş Numarası *
                </label>
                <input
                  type="text"
                  value={paymentNo}
                  onChange={(e) => setPaymentNo(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-750  font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-750 "
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Para Birimi
                </label>
                <select
                  value={paymentCurrency}
                  onChange={(e) => {
                    setPaymentCurrency(e.target.value);
                    if (e.target.value === "TRY") {
                      setExchangeRate("1.0000");
                    }
                  }}
                  className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none text-gray-750 "
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Döviz Kuru
                </label>
                <input
                  type="number"
                  step="0.0001"
                  disabled={paymentCurrency === "TRY"}
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none disabled:opacity-50 text-gray-755  font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500  block mb-1">
                Ödeme Tipi / Yöntemi *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (e.target.value === "Cash" || e.target.value === "Promissory Note") {
                    setBankAccountId("");
                  }
                }}
                className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none text-gray-750 "
              >
                <option value="Bank Transfer">Banka Havalesi (EFT/Havale)</option>
                <option value="Credit Card">Kredi Kartı</option>
                <option value="Cash">Kasa Hesabı (Nakit)</option>
                <option value="Promissory Note">Firma Çeki/Senet</option>
              </select>
            </div>

            {/* Bank Accounts list (Conditional) */}
            {(paymentMethod === "Bank Transfer" || paymentMethod === "Credit Card") && (
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Çıkış Yapılacak Banka Hesabı *
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none text-gray-750 "
                >
                  <option value="">Banka hesabı seçiniz...</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name} - {bank.currency} (Mevcut: {formatCurrency(bank.balance, bank.currency)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Referans No (Dekont/Seri)
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Banka Dekont no, çek no vb."
                  className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-750 "
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500  block mb-1">
                  Ödeme Tutarı *
                </label>
                <div className="relative">
                  <Input
                    type="currency"
                    value={paymentAmountStr}
                    onChange={(e) => setPaymentAmountStr(e.target.value)}
                    placeholder="0,00"
                    className="w-full text-sm pl-3 pr-10 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-750  font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">
                    {paymentCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500  block mb-1">
                Açıklama / Not
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Örn: Haziran 2026 hammadde faturaları tediye kapaması."
                rows={2}
                className="w-full text-sm px-3 py-2 bg-gray-50/50  border border-gray-200  rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-750  resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading || !selectedSupplierId || paymentAmountNum <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-4"
            >
              {submitLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Ödemeyi Kaydet ve Fişi Kapat
            </button>
          </form>
        </div>

        {/* Right Side: Outstanding Invoices & Distribution */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Outstanding Invoice Settlements */}
          <div className="bg-white  rounded-2xl border border-gray-200/60  shadow-sm p-6">
            {!selectedSupplierId ? (
              <div className="text-center py-20 text-gray-400  space-y-4">
                <div className="w-16 h-16 bg-gray-50  text-gray-350 rounded-full flex items-center justify-center mx-auto border border-dashed border-gray-200 ">
                  <LayoutGrid className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 ">Tedarikçi Seçilmedi</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Kapatılacak açık faturaları listelemek, FIFO dağıtımı yapmak veya ödemeyi kapatmak için sol panelden bir tedarikçi seçin.
                  </p>
                </div>
              </div>
            ) : invoicesLoading ? (
              <div className="py-24 text-center text-gray-400 ">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
                Açık fatura bakiyeleri ve cari hareketler yükleniyor...
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Actions & Distribution Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100 ">
                  <div>
                    <h3 className="font-bold text-gray-900  flex items-center gap-2 text-base">
                      Açık Faturalar & Eşleştirme
                      <span className="text-xs bg-amber-50  text-amber-700  font-bold px-2 py-0.5 rounded-full">
                        {openInvoices.length} Fatura
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Faturalar en eskiden yeniye doğru FIFO sıralıdır</p>
                  </div>
                  
                  {openInvoices.length > 0 && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleFIFODistribute}
                        className="flex-1 sm:flex-none text-[11px] font-bold px-3 py-2 border border-amber-250  bg-amber-50/50 hover:bg-amber-50   text-amber-700  rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Otomatik Dağıt (FIFO)
                      </button>
                      <button
                        type="button"
                        onClick={handleMatchAll}
                        className="flex-1 sm:flex-none text-[11px] font-bold px-3 py-2 border border-gray-200  bg-gray-50 hover:bg-gray-100   text-gray-700  rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        Tümünü Eşitle
                      </button>
                      <button
                        type="button"
                        onClick={handleClearSettlements}
                        className="p-2 border border-red-100 hover:border-red-200 text-red-500 rounded-lg bg-red-50/20 hover:bg-red-50/50   transition"
                        title="Temizle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Open Invoices Table */}
                {openInvoices.length === 0 ? (
                  <div className="text-center py-16 text-gray-400  bg-gray-50/40  rounded-2xl border border-dashed border-gray-200 ">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    Bu tedarikçinin açık fatura borcu bulunmuyor!
                    <div className="text-xs text-gray-400 mt-1">Yapacağınız ödeme doğrudan avans / cari alacak (prepayment) olarak kaydedilecektir.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50/50  text-gray-500  font-semibold border-b border-gray-100 ">
                        <tr>
                          <th className="px-4 py-3">Fatura No / ETTN</th>
                          <th className="px-4 py-3">Tarih</th>
                          <th className="px-4 py-3 text-right">Fatura Tutarı</th>
                          <th className="px-4 py-3 text-right text-amber-600 ">Açık Tutar</th>
                          <th className="px-4 py-3 text-right w-36">Uygulanan Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 ">
                        {openInvoices.map((inv) => {
                          const appliedVal = settlementAmounts[inv.invoice_id] || "";
                          const numericApplied = parseTurkishCurrency(appliedVal) || 0;
                          
                          return (
                            <tr key={inv.invoice_id} className="hover:bg-gray-50/50  transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-gray-800  flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                                  {inv.invoice_no}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[120px]" title={inv.ettn_no}>
                                  {inv.ettn_no}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-gray-500">
                                {new Date(inv.invoice_date).toLocaleDateString("tr-TR")}
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium text-gray-700 ">
                                {formatCurrency(inv.total_gross_amount, inv.currency)}
                              </td>
                              <td className="px-4 py-3.5 text-right font-bold text-amber-600 ">
                                {formatCurrency(inv.open_amount, inv.currency)}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="relative inline-flex items-center">
                                  <Input
                                    type="currency"
                                    placeholder="0,00"
                                    value={appliedVal}
                                    onChange={(e) => handleSettlementChange(inv.invoice_id, e.target.value, inv.open_amount)}
                                    className={`w-28 text-right font-bold text-[11px] px-2 py-1 bg-gray-50  border rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500/20 text-gray-800  ${
                                      numericApplied > 0 
                                        ? "border-emerald-500 bg-emerald-50/20 text-emerald-800 " 
                                        : "border-gray-200 "
                                    }`}
                                  />
                                  <span className="absolute right-2 text-[11px] font-medium text-gray-400 pointer-events-none">
                                    {inv.currency}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Calculation Summary Panel */}
                <div className="bg-gray-50/60  border border-gray-200/50  rounded-2xl p-5 space-y-3.5 text-xs">
                  <h4 className="font-bold text-gray-800  uppercase tracking-wider text-xs">Cari ve Eşleştirme Özeti</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tediye Ödeme Toplamı:</span>
                      <span className="font-bold text-gray-900 ">
                        {formatCurrency(paymentAmountNum, paymentCurrency)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Faturalara Dağıtılan (Kapatılan):</span>
                      <span className="font-bold text-emerald-600 ">
                        -{formatCurrency(totalSettledNum, paymentCurrency)}
                      </span>
                    </div>

                    {unappliedPrepayment > 0 && (
                      <div className="flex justify-between items-center p-2 bg-blue-50/50  border border-blue-100/50  rounded-xl">
                        <span className="text-blue-700  font-semibold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 shrink-0" /> Fazla Ödeme / Cari Avans (Prepayment):
                        </span>
                        <span className="font-black text-blue-700 ">
                          {formatCurrency(unappliedPrepayment, paymentCurrency)}
                        </span>
                      </div>
                    )}
                  </div>

                  {supplierDetails && (
                    <div className="pt-3 border-t border-gray-200/50  space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mevcut Tedarikçi Borcu:</span>
                        <span className="font-semibold text-gray-800 ">
                          {formatCurrency(supplierDetails.balance)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Yapılacak Ödeme (TRY Karşılığı):</span>
                        <span className="font-bold text-red-600 ">
                          -{formatCurrency(paymentAmountNum * parsedExchangeRate)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between pt-2 border-t border-gray-200/50  items-baseline">
                        <span className="text-gray-700  font-bold">Yeni Tedarikçi Borç Bakiyesi:</span>
                        <span className={`text-base font-black ${newSupplierBalance >= 0 ? "text-amber-600" : "text-green-600"}`}>
                          {formatCurrency(newSupplierBalance)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

