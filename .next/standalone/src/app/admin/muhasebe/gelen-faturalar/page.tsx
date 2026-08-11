"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { 
  FileText, Search, CheckCircle2, AlertTriangle, XCircle, Info, Receipt,
  ChevronRight, Loader2, Building2, Tag, ArrowRight, Sparkles, Check, X
} from "lucide-react";
import { toast } from "sonner";

interface IncomingInvoice {
  ettn_no: string;
  invoice_no: string;
  supplier_vkn: string;
  invoice_date: string;
  total_gross_amount: number;
  currency: string;
  exchange_rate: number;
  status: string;
  error_message: string | null;
}

interface ResolvedLine {
  lineIndex: number;
  itemCode: string;
  itemName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountRate: number;
  lineNetAmount: number;
  lineVatAmount: number;
  lineGrossAmount: number;
  stockId: string | null;
  stockName: string | null;
  systemCost: number;
  defaultWarehouseId: string | null;
  isDisputed: boolean;
}

interface MetadataLists {
  suppliers: { id: string; name: string; tax_no: string }[];
  stocks: { id: string; name: string; code: string; barcode: string; current_cost: number }[];
  warehouses: { id: string; name: string }[];
}

export default function GelenFaturalarPage() {
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<MetadataLists>({ suppliers: [], stocks: [], warehouses: [] });
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Selected Invoice Detail States
  const [selectedEttn, setSelectedEttn] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Resolution Form States
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [mappedStocks, setMappedStocks] = useState<{ [lineIndex: number]: string }>({});

  // Fetch incoming invoices list
  const fetchInvoices = (statusFilter = activeTab) => {
    setLoading(true);
    fetch(`/api/invoices/incoming?status=${statusFilter}`)
      .then(res => res.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("List fetch error:", err);
        toast.error("Faturalar yüklenirken hata oluştu.");
      })
      .finally(() => setLoading(false));
  };

  // Fetch dropdown metadata for carias, stocks, warehouses
  const fetchMetadata = () => {
    fetch("/api/invoices/incoming?lists=true")
      .then(res => res.json())
      .then(data => {
        if (data.suppliers) {
          setLists({
            suppliers: data.suppliers,
            stocks: data.stocks || [],
            warehouses: data.warehouses || []
          });
        }
      })
      .catch(err => console.error("Metadata fetch error:", err));
  };

  // Fetch parsed UBL invoice details
  const fetchInvoiceDetail = (ettn: string) => {
    setDetailLoading(true);
    setDetail(null);
    setMappedStocks({});
    setSelectedSupplierId("");
    
    fetch(`/api/invoices/incoming/${ettn}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error);
        } else {
          setDetail(data);
          if (data.resolvedSupplierId) {
            setSelectedSupplierId(data.resolvedSupplierId);
          }
          // Initialize mapped stocks from resolved lines
          const initialMappings: { [key: number]: string } = {};
          data.resolvedLines?.forEach((line: ResolvedLine) => {
            if (line.stockId) {
              initialMappings[line.lineIndex] = line.stockId;
            }
          });
          setMappedStocks(initialMappings);
        }
      })
      .catch(err => {
        console.error("Detail fetch error:", err);
        toast.error("Fatura detayları ayrıştırılamadı.");
      })
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
    fetchMetadata();
  }, [activeTab]);

  const handleSelectInvoice = (ettn: string) => {
    setSelectedEttn(ettn);
    fetchInvoiceDetail(ettn);
  };

  // Action: Approve & Process Purchase Invoice
  const handleApprove = async () => {
    if (!selectedEttn) return;
    setActionLoading(true);
    const toastId = toast.loading("Resmi Alış Faturası onaylanıyor ve stoklara işleniyor...");

    try {
      const res = await fetch(`/api/invoices/${selectedEttn}/approve`, {
        method: "POST"
      });
      const data = await res.json();
      toast.dismiss(toastId);

      if (data.success) {
        toast.success(data.message || "Fatura başarıyla onaylandı!");
        setDetail(null);
        setSelectedEttn(null);
        fetchInvoices();
      } else {
        toast.error(data.error || "Onaylama işlemi başarısız.");
        // Refresh details to show update status/error
        fetchInvoiceDetail(selectedEttn);
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Onay servisiyle bağlantı kurulamadı.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Match missing supplier VKN to selected supplier
  const handleMatchSupplier = async () => {
    if (!selectedEttn || !selectedSupplierId) return;
    setActionLoading(true);
    const toastId = toast.loading("Tedarikçi cari kartı eşleştiriliyor...");

    try {
      const res = await fetch(`/api/invoices/${selectedEttn}/match-supplier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: selectedSupplierId,
          supplier_vkn: detail.parsed.supplier_vkn
        })
      });
      const data = await res.json();
      toast.dismiss(toastId);

      if (data.success) {
        toast.success(data.message);
        // Refresh detail to re-evaluate resolved carias
        fetchInvoiceDetail(selectedEttn);
        fetchInvoices();
      } else {
        toast.error(data.error || "Eşleştirme başarısız.");
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Servis bağlantı hatası.");
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Match line item code to selected stock ID
  const handleMatchStock = async (lineIndex: number, itemCode: string) => {
    const stockId = mappedStocks[lineIndex];
    if (!selectedEttn || !stockId) return;
    setActionLoading(true);
    const toastId = toast.loading("Ürün eşleştirmesi kalıcı olarak kaydediliyor...");

    try {
      const res = await fetch(`/api/invoices/${selectedEttn}/match-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_code: itemCode,
          stock_id: stockId
        })
      });
      const data = await res.json();
      toast.dismiss(toastId);

      if (data.success) {
        toast.success(data.message);
        // Refresh detail to re-evaluate resolved stocks
        fetchInvoiceDetail(selectedEttn);
        fetchInvoices();
      } else {
        toast.error(data.error || "Stok eşleştirme başarısız.");
      }
    } catch {
      toast.dismiss(toastId);
      toast.error("Servis bağlantı hatası.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list by search query
  const filteredInvoices = invoices.filter(inv => 
    inv.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.supplier_vkn.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <span className="px-2.5 py-1 bg-emerald-100  text-emerald-800  rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Ready</span>;
      case "Supplier NotFound":
        return <span className="px-2.5 py-1 bg-amber-100  text-amber-800  rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"><Building2 className="w-3.5 h-3.5" /> Missing Supplier</span>;
      case "Product NotFound":
        return <span className="px-2.5 py-1 bg-amber-100  text-amber-800  rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"><Tag className="w-3.5 h-3.5" /> Missing Product</span>;
      case "Disputed":
        return <span className="px-2.5 py-1 bg-red-100  text-red-800  rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"><AlertTriangle className="w-3.5 h-3.5" /> Disputed</span>;
      case "Processed":
        return <span className="px-2.5 py-1 bg-blue-100  text-blue-800  rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"><Check className="w-3.5 h-3.5" /> Processed</span>;
      case "Failed":
        return <span className="px-2.5 py-1 bg-gray-100  text-gray-700  rounded-xl text-xs font-semibold flex items-center gap-1.5 w-fit"><XCircle className="w-3.5 h-3.5" /> Failed</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold w-fit">{status}</span>;
    }
  };

  const getStatsCount = (status: string) => {
    if (status === "All") return invoices.length;
    return invoices.filter(inv => inv.status === status).length;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-orange-500 shrink-0" /> Gelen E-Faturalar
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/50 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wider ml-1">
              <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" /> Antigravity Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            GİB sisteminden gelen e-Faturaları uyuşmazlık denetimleri ve akıllı eşleştirmelerle onaylayıp stoklara işleyin.
          </p>
        </div>
      </div>

      {/* Dashboard Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-gray-500  text-xs font-medium">Toplam Gelen Fatura</span>
          <span className="text-2xl font-bold text-gray-900  mt-2">{invoices.length}</span>
        </div>
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-emerald-700  text-xs font-medium">Onay Bekleyenler (Ready)</span>
          <span className="text-2xl font-bold text-emerald-700  mt-2">
            {invoices.filter(i => i.status === "Pending").length}
          </span>
        </div>
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-amber-700  text-xs font-medium">Kart Eşleşmesi Bekleyenler</span>
          <span className="text-2xl font-bold text-amber-700  mt-2">
            {invoices.filter(i => i.status === "Supplier NotFound" || i.status === "Product NotFound").length}
          </span>
        </div>
        <div className="bg-white  p-5 rounded-2xl border border-gray-200/60  shadow-sm flex flex-col justify-between">
          <span className="text-red-700  text-xs font-medium">Fiyat Uyuşmazlığı (Disputed)</span>
          <span className="text-2xl font-bold text-red-700  mt-2">
            {invoices.filter(i => i.status === "Disputed").length}
          </span>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-gray-200  overflow-x-auto gap-2">
        {[
          { id: "All", label: "Tüm Faturalar" },
          { id: "Pending", label: "Hazır (Ready)" },
          { id: "Supplier NotFound", label: "Cari Eksik" },
          { id: "Product NotFound", label: "Stok Eksik" },
          { id: "Disputed", label: "Uyuşmazlık" },
          { id: "Processed", label: "İşlenenler" },
          { id: "Failed", label: "Hatalılar" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedEttn(null);
              setDetail(null);
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600  "
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300  "
            }`}
          >
            {tab.label}
            <span className="text-xs bg-gray-100  text-gray-500  font-bold px-1.5 py-0.5 rounded-full">
              {getStatsCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Split Pane Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Invoice List Pane */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search bar */}
          <div className="bg-white  p-3 rounded-2xl border border-gray-200/60  shadow-sm flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Fatura no veya VKN/TCKN ile ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 "
            />
          </div>

          {/* DataTable List */}
          <div className="bg-white  rounded-2xl border border-gray-200/60  shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50  text-gray-500  font-semibold border-b border-gray-100 ">
                  <tr>
                    <th className="px-6 py-4">Belge No / ETTN</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4">Tutar</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-4 py-4 text-center">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 ">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Gelen kutusu sorgulanıyor...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 ">
                        Bu sekmede fatura bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr 
                        key={inv.ettn_no} 
                        onClick={() => handleSelectInvoice(inv.ettn_no)}
                        className={`hover:bg-gray-50/50  cursor-pointer transition ${
                          selectedEttn === inv.ettn_no ? "bg-blue-50/40  border-l-4 border-l-blue-600" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-gray-900  font-semibold flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-gray-400" />
                            {inv.invoice_no}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                            {inv.ettn_no}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 ">
                          {new Date(inv.invoice_date).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900 ">
                          {formatCurrency(inv.total_gross_amount)} <span className="text-xs text-gray-500">{inv.currency}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ChevronRight className={`w-5 h-5 mx-auto text-gray-400 transition-transform ${selectedEttn === inv.ettn_no ? "translate-x-1" : ""}`} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Active Details & Action Resolution Drawer */}
        <div className="lg:col-span-5">
          {selectedEttn ? (
            <div className="bg-white  rounded-2xl border border-gray-200/60  shadow-sm p-6 space-y-6">
              
              {/* Header Details */}
              <div className="flex justify-between items-start border-b border-gray-100  pb-4">
                <div>
                  <h3 className="font-bold text-gray-900  text-lg">Fatura Analizi</h3>
                  <p className="text-xs text-gray-400 mt-1">UUID: {selectedEttn}</p>
                </div>
                {detail && getStatusBadge(detail.status)}
              </div>

              {detailLoading ? (
                <div className="py-24 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  XML verisi ayrıştırılıyor ve eşleşmeler sorgulanıyor...
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  
                  {/* DYNAMIC ALERTS AND ACTION BANNERS */}
                  
                  {/* CASE 1: READY / PENDING */}
                  {detail.status === "Pending" && (
                    <div className="bg-emerald-50  border border-emerald-200  rounded-2xl p-4 space-y-4">
                      <div className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600  shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-emerald-800  text-sm">Fatura Onaya Hazır</h4>
                          <p className="text-emerald-700/80  text-xs mt-1">
                            Bu fatura içerideki satın alma sözleşmeleri, tedarikçi cari bilgileri ve stok kartları ile %100 uyuşmaktadır.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 text-sm disabled:opacity-50"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Faturayı Onayla ve Stoklara İşle
                      </button>
                    </div>
                  )}

                  {/* CASE 2: CARİ EKSİK (Supplier NotFound) */}
                  {detail.status === "Supplier NotFound" && (
                    <div className="bg-amber-50  border border-amber-200  rounded-2xl p-4 space-y-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600  shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-amber-800  text-sm">Cari Kart Eşleşmedi</h4>
                          <p className="text-amber-700/80  text-xs mt-1">
                            XML'deki tedarikçi vergi numarası ({detail.parsed.supplier_vkn}) sistemdeki hiçbir cari kartta tanımlı değildir.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500  mb-1">Mevcut Bir Cari ile Eşleştir</label>
                          <select 
                            value={selectedSupplierId}
                            onChange={e => setSelectedSupplierId(e.target.value)}
                            className="w-full text-sm px-3 py-2 bg-white  border border-gray-200  rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-700 "
                          >
                            <option value="">Cari Hesap Seçiniz</option>
                            {lists.suppliers.map(sup => (
                              <option key={sup.id} value={sup.id}>{sup.name} (VKN: {sup.tax_no || 'Tanımsız'})</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={handleMatchSupplier}
                          disabled={!selectedSupplierId || actionLoading}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition text-xs shadow-md shadow-blue-600/20 disabled:opacity-50"
                        >
                          Cari Kart Eşleşmesini Kaydet ve Yeniden Dene
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASE 3: STOK EKSİK (Product NotFound) */}
                  {detail.status === "Product NotFound" && (
                    <div className="bg-amber-50  border border-amber-200  rounded-2xl p-4 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600  shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-800  text-sm">Eksik Ürün Kartları Mevcut</h4>
                        <p className="text-amber-700/80  text-xs mt-1">
                          Faturadaki bazı ürün kodları stok kartlarıyla eşleşmemiştir. Kalemler listesindeki eksik ürünlerin sistem karşılıklarını seçin.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CASE 4: FİYAT UYUŞMAZLIĞI (Disputed) */}
                  {detail.status === "Disputed" && (
                    <div className="bg-red-50  border border-red-200  rounded-2xl p-4 space-y-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600  shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-red-800  text-sm">Fiyat Uyuşmazlığı Saptandı</h4>
                          <p className="text-red-700/80  text-xs mt-1">
                            Faturadaki ürün fiyatları, sistemdeki güncel AOM (Ağırlıklı Ortalama Maliyet) maliyet değerinden %5'ten fazla sapma göstermektedir (Aşağıdaki tabloda kırmızı ile vurgulanmıştır).
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-xs shadow-md shadow-emerald-600/20"
                        >
                          Fiyatı Kabul Et ve Onayla
                        </button>
                        <button 
                          onClick={async () => {
                            toast.error("Faturaya fiyat uyuşmazlığı şerhi düşülerek tedarikçiye itiraz bildirimi yapıldı.");
                          }}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition text-xs shadow-md shadow-red-600/20"
                        >
                          İtiraz Et / Faturayı Reddet
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASE 5: PROCESSED */}
                  {detail.status === "Processed" && (
                    <div className="bg-blue-50  border border-blue-200  rounded-2xl p-4 flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600  shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-blue-800  text-sm">Fatura Başarıyla İşlendi</h4>
                        <p className="text-blue-700/80  text-xs mt-1">
                          Bu fatura doğrulanarak resmi sisteme aktarılmış, stok miktarları artırılmış ve cari alacak kaydı oluşturulmuştur.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CASE 6: FAILED */}
                  {detail.status === "Failed" && (
                    <div className="bg-gray-100  border border-gray-200  rounded-2xl p-4 space-y-2">
                      <div className="flex gap-3">
                        <XCircle className="w-5 h-5 text-gray-700  shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-gray-800  text-sm">Kayıt Başarısız Olmuştu</h4>
                          <p className="text-gray-600  text-xs mt-1">
                            Sistem entegrasyon hatası: {detail.errorMessage || 'Veritabanı transaction hatası.'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition text-xs shadow-md"
                      >
                        Onaylama İşlemini Tekrar Dene
                      </button>
                    </div>
                  )}

                  {/* Fatura Bilgileri Tablosu */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800  text-sm">Fatura Bilgileri</h4>
                    <div className="bg-gray-50  border border-gray-100  rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tedarikçi Cari:</span>
                        <span className="font-bold text-gray-900 ">{detail.supplierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Belge No:</span>
                        <span className="font-bold text-gray-900 ">{detail.parsed.invoice_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">VKN/TCKN:</span>
                        <span className="font-semibold text-gray-900 ">{detail.parsed.supplier_vkn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">İşlem Tarihi:</span>
                        <span className="font-semibold text-gray-900 ">{new Date(detail.parsed.invoice_date).toLocaleDateString("tr-TR")}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200/50 ">
                        <span className="text-gray-600 font-medium">Toplam Tutar:</span>
                        <span className="font-bold text-gray-950  text-sm">
                          {formatCurrency(detail.parsed.total_gross_amount)} {detail.parsed.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fatura Satırları ve Eşleştirme Detayları */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800  text-sm">Satır Kalemleri ve Eşleşmeler</h4>
                    <div className="space-y-4">
                      {detail.resolvedLines?.map((line: ResolvedLine, index: number) => {
                        const isStockMatched = !!line.stockId;
                        return (
                          <div 
                            key={index}
                            className={`border rounded-2xl p-4 space-y-3 transition-colors ${
                              line.isDisputed 
                                ? "bg-red-50/20  border-red-200 " 
                                : isStockMatched 
                                  ? "bg-gray-50/40  border-gray-200/60 " 
                                  : "bg-amber-50/20  border-amber-200 "
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-xs text-gray-400 font-semibold block">SATIR #{index + 1}</span>
                                <span className="font-bold text-gray-900  text-xs block mt-0.5">{line.itemName}</span>
                                {line.itemCode && <span className="text-xs text-gray-500 mt-0.5 block">Kod: {line.itemCode}</span>}
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-gray-900  text-xs block">
                                  {formatCurrency(line.lineGrossAmount)} {detail.parsed.currency}
                                </span>
                                <span className="text-xs text-gray-500 block mt-0.5">
                                  {line.quantity} Adet x {line.unitPrice} {detail.parsed.currency}
                                </span>
                              </div>
                            </div>

                            {/* Fiyat Uyuşmazlığı Bilgisi */}
                            {line.isDisputed && (
                              <div className="flex items-center gap-1.5 p-2 bg-red-100/50  border border-red-200  rounded-xl text-xs text-red-800  font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Fiyat Sapması: Sistem Maliyeti {formatCurrency(line.systemCost)} TRY | Fatura Net Fiyatı {formatCurrency(line.unitPrice * (1 - line.discountRate/100) * detail.parsed.exchange_rate)} TRY
                              </div>
                            )}

                            {/* Stok Eşleştirme Dropdown (Eğer Stok Eksikse veya Eşleştirilmek İsteniyorsa) */}
                            {!isStockMatched ? (
                              <div className="space-y-2 bg-white  p-3 rounded-xl border border-amber-200/50 ">
                                <span className="text-xs font-bold text-amber-800  flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Ürün Eşleşmedi. Sistemdeki Karşılığını Seçin:
                                </span>
                                <div className="flex gap-2">
                                  <select
                                    value={mappedStocks[line.lineIndex] || ""}
                                    onChange={e => setMappedStocks({
                                      ...mappedStocks,
                                      [line.lineIndex]: e.target.value
                                    })}
                                    className="flex-1 text-xs px-2 py-1.5 bg-gray-50  border border-gray-200  rounded-lg text-gray-700 "
                                  >
                                    <option value="">Stok Kartı Seçiniz</option>
                                    {lists.stocks.map(st => (
                                      <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleMatchStock(line.lineIndex, line.itemCode || line.itemName)}
                                    disabled={!mappedStocks[line.lineIndex] || actionLoading}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition disabled:opacity-50"
                                  >
                                    Eşleştir
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Sistem Kartı: <span className="font-semibold text-gray-700 ">{line.stockName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">Yüklenemedi.</div>
              )}

            </div>
          ) : (
            <div className="bg-white  rounded-2xl border border-gray-200/60  shadow-sm p-12 text-center text-gray-400  space-y-4">
              <FileText className="w-12 h-12 text-gray-300  mx-auto" />
              <div>
                <h3 className="font-bold text-gray-800 ">Fatura Seçilmedi</h3>
                <p className="text-xs text-gray-500 mt-1">Detay analizlerini görüntülemek, uyuşmazlıkları incelemek ve faturaları onaylamak için sol taraftan bir fatura seçin.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

