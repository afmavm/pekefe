"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Search, Eye, ShoppingCart, X, Package, 
  Truck, User, FileText, CheckCircle2, Printer, 
  ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown,
  Clock, Mail, Phone, MapPin, Award, Headset, 
  UserCheck, ShieldCheck, BadgePercent, Layers, Check,
  Filter, RotateCcw, Columns, KanbanSquare, 
  List, MessageSquare, Send, UserMinus, FileDown, 
  SendHorizontal, Calendar, CreditCard, Ban, Scale, Inbox
} from "lucide-react";
import { useFinance, CurrentAccount } from "@/context/FinanceContext";
import { useOrders, Order } from "@/context/OrderContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import Server Actions
import { 
  updateOrderStatusAction, 
  cancelOrderAction,
  bulkCancelOrdersAction,
  bulkUpdateOrderStatusAction, 
  bulkGenerateInvoicesAction,
  getFulfillmentDetailsAction,
  createInvoiceAndWaybillAction
} from "../server/orderActions";

interface SavedFilter {
  name: string;
  searchTerm: string;
  statusFilter: string;
  clientType: string;
  paymentMethod: string;
}

export default function OrderCommandCenter() {
  const { type } = useParams();
  const { orders, refreshOrders } = useOrders();
  const { accounts } = useFinance();

  // View Mode: 'list' or 'kanban'
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Search & Basic Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [clientTypeFilter, setClientTypeFilter] = useState("Tümü"); // B2B, B2C
  const [paymentFilter, setPaymentFilter] = useState("Tümü"); // Havale, Kredi Kartı, Cari
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Saved Filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    { name: "Bekleyen Havaleler", searchTerm: "", statusFilter: "Yeni", clientType: "Tümü", paymentMethod: "Havale" },
    { name: "Hazırlanan B2B Siparişler", searchTerm: "", statusFilter: "Hazırlanıyor", clientType: "B2B", paymentMethod: "Tümü" }
  ]);
  const [newFilterName, setNewFilterName] = useState("");

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Order>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Columns visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    orderNumber: true,
    client: true,
    summary: true,
    logistic: true,
    amount: true,
    status: true
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

  // Selection States
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Slide-over Sheet / Drawer State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"general" | "items" | "client" | "logistic" | "timeline">("general");

  // Actions Loader States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Cancellation Modal State
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    orderId: string | null;
    orderNumber: string | null;
    isBulk: boolean;
    reason: string;
  }>({
    isOpen: false,
    orderId: null,
    orderNumber: null,
    isBulk: false,
    reason: "",
  });

  // Invoices for slide-over drawer
  const [orderInvoices, setOrderInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // AI Assistant States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<any[]>([
    { role: "assistant", content: "Merhaba! PEKEFE Geleneksel & Doğal Lezzetler Akıllı Lojistik & Sipariş Asistanıyım. Sipariş havuzundaki kritik riskleri analiz edebilir, en çok satan yöresel ürünlernı raporlayabilir veya cari durumları sorgulayabilirim. Nasıl yardımcı olabilirim?" }
  ]);

  // Settings
  const [cmsSettings, setCmsSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setCmsSettings(data);
      })
      .catch(err => console.error("Error loading CMS settings:", err));
  }, []);

  // Fetch invoices for slide-over drawer
  useEffect(() => {
    if (selectedOrder) {
      setIsLoadingInvoices(true);
      fetch(`/api/invoices?orderId=${selectedOrder.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrderInvoices(data);
        })
        .catch(err => console.error("Error loading order invoices:", err))
        .finally(() => setIsLoadingInvoices(false));
    } else {
      setOrderInvoices([]);
    }
  }, [selectedOrder]);

  const isB2B = Array.isArray(type) ? type[0] === "b2b" : type === "b2b";
  const isAll = Array.isArray(type) ? (!type[0] || type[0] === "all") : (!type || type === "all");
  const pageTitle = isAll ? "Tüm Siparişler" : (isB2B ? "B2B Bayi Siparişleri" : "B2C Perakende Satışlar");
  const primaryColor = cmsSettings?.primaryColor || "#f97316";

  // Reset page & selection on filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
  }, [searchTerm, statusFilter, clientTypeFilter, paymentFilter, type]);

  // Refresh orders on mount so admin always sees fresh data
  useEffect(() => {
    refreshOrders();
  }, []);

  // Parsing Summary to Receipts Helper
  const parseOrderSummary = (summaryText: string, orderTotal?: number) => {
    if (!summaryText) return [];
    
    const cleanSummary = summaryText.replace(/^\[[^\]]+\]\s*/, "");
    let processedSummary = cleanSummary;
    const platformMatch = cleanSummary.match(/^(?:\d+\s*-\s*)(.*)/);
    if (platformMatch) {
      processedSummary = platformMatch[1];
    }
    
    const parts = processedSummary.split(/,\s*/);
    const items = [];
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      let name = trimmedPart;
      let quantity = 1;
      
      const parentheseMatch = trimmedPart.match(/(.+)\s*\((\d+)\)/);
      const prefixMatch = trimmedPart.match(/^(\d+)\s*[xX*]\s*(.+)/);
      const suffixMatch = trimmedPart.match(/(.+?)\s*[xX*]\s*(\d+)$/);

      if (parentheseMatch) {
        name = parentheseMatch[1].trim();
        quantity = parseInt(parentheseMatch[2], 10);
      } else if (prefixMatch) {
        quantity = parseInt(prefixMatch[1], 10);
        name = prefixMatch[2].trim();
      } else if (suffixMatch) {
        name = suffixMatch[1].trim();
        quantity = parseInt(suffixMatch[2], 10);
      }

      let basePrice = 250;
      if (name.includes("Körük")) basePrice = 450;
      else if (name.includes("Kovan")) basePrice = 1200;
      else if (name.includes("Maske")) basePrice = 180;
      else if (name.includes("Demir")) basePrice = 90;
      else if (name.includes("Tel")) basePrice = 120;
      else if (name.includes("Süzme")) basePrice = 3500;
      else if (name.includes("Bal")) basePrice = 150;

      items.push({
        name,
        quantity,
        price: basePrice,
        taxRate: 20
      });
    }

    if (orderTotal !== undefined && orderTotal > 0 && items.length > 0) {
      const targetSubtotal = orderTotal / 1.20;
      const estimatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (estimatedTotal > 0) {
        const factor = targetSubtotal / estimatedTotal;
        let calculatedSubtotal = 0;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (i === items.length - 1) {
            const remainingSubtotal = targetSubtotal - calculatedSubtotal;
            item.price = remainingSubtotal / item.quantity;
          } else {
            item.price = Math.round((item.price * factor) * 100) / 100;
            calculatedSubtotal += item.price * item.quantity;
          }
        }
      } else {
        const share = targetSubtotal / items.length;
        for (const item of items) {
          item.price = share / item.quantity;
        }
      }
    }

    return items;
  };

  const calculateLogisticDetails = (summaryText: string) => {
    const items = parseOrderSummary(summaryText);
    if (!items || items.length === 0) {
      return { koli: 1, weight: 1.5, desi: 1.0 };
    }

    let totalWeight = 0;
    let totalDesi = 0;
    let estimatedKoli = 0;

    for (const item of items) {
      let itemWeight = 1.5;
      let itemDesi = 1.0;
      let isLarge = false;

      const name = item.name.toLowerCase();
      if (name.includes("körük") || name.includes("koruk")) {
        itemWeight = 2.0;
        itemDesi = 1.5;
      } else if (name.includes("kovan")) {
        itemWeight = 12.0;
        itemDesi = 8.0;
        isLarge = true;
      } else if (name.includes("maske")) {
        itemWeight = 0.5;
        itemDesi = 0.5;
      } else if (name.includes("demir")) {
        itemWeight = 1.0;
        itemDesi = 0.2;
      } else if (name.includes("tel")) {
        itemWeight = 5.0;
        itemDesi = 1.0;
      } else if (name.includes("süzme") || name.includes("suzme")) {
        itemWeight = 25.0;
        itemDesi = 15.0;
        isLarge = true;
      } else if (name.includes("bal")) {
        itemWeight = 1.5;
        itemDesi = 0.8;
      }

      totalWeight += itemWeight * item.quantity;
      totalDesi += itemDesi * item.quantity;
      
      if (isLarge) {
        estimatedKoli += item.quantity;
      } else {
        estimatedKoli += item.quantity * 0.25; // Small items packed 4 per box
      }
    }

    return {
      koli: Math.max(1, Math.ceil(estimatedKoli)),
      weight: Math.round(totalWeight * 10) / 10,
      desi: Math.round(totalDesi * 10) / 10
    };
  };

  // Find corresponding finance account
  const findClientAccount = (clientName: string): CurrentAccount | undefined => {
    return accounts.find(
      a => a.name.toLowerCase() === clientName.toLowerCase() ||
           a.email?.toLowerCase() === clientName.toLowerCase()
    );
  };

  // Checkbox functions
  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (visibleOrders: Order[]) => {
    const allSelected = visibleOrders.length > 0 && visibleOrders.every(o => selectedRows.has(o.id));
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (allSelected) {
        visibleOrders.forEach(o => next.delete(o.id));
      } else {
        visibleOrders.forEach(o => next.add(o.id));
      }
      return next;
    });
  };

  // Sorting Handler
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Metrikler & KPI'lar
  const metrics = useMemo(() => {
    const relevant = orders.filter((o) => isAll ? true : (isB2B ? o.type === "B2B" : o.type === "B2C"));
    const totalVolume = relevant.reduce((sum, o) => sum + o.amount, 0);
    const totalCount = relevant.length;
    const avgBasket = totalCount > 0 ? Math.round(totalVolume / totalCount) : 0;
    
    return {
      totalVolume,
      totalCount,
      processing: relevant.filter((o) => o.status === "Hazırlanıyor").length,
      shipped: relevant.filter((o) => o.status === "Kargolandı" || (o.status as any) === "Kargoya Verildi").length,
      pendingTransfers: relevant.filter((o) => o.status === "Yeni" && o.method?.toLowerCase().includes("havale")).length,
      avgBasket,
      activeDealers: new Set(relevant.filter(o => o.type === "B2B").map(o => o.client)).size,
      returnsCount: relevant.filter(o => o.status?.includes("İade")).length
    };
  }, [orders, isAll, isB2B]);

  // Filtering & Sorting logic
  const filteredAndSortedOrders = useMemo(() => {
    const matches = orders.filter((order) => {
      const matchesType = isAll ? true : (isB2B ? order.type === "B2B" : order.type === "B2C");
      const matchSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "Tümü" || order.status === statusFilter;
      
      let matchClientType = true;
      if (clientTypeFilter !== "Tümü") {
        matchClientType = order.type === clientTypeFilter;
      }

      let matchPayment = true;
      if (paymentFilter !== "Tümü") {
        matchPayment = order.method?.toLowerCase().includes(paymentFilter.toLowerCase()) || false;
      }
      
      return matchesType && matchSearch && matchStatus && matchClientType && matchPayment;
    });

    return [...matches].sort((a, b) => {
      let valA = a[sortField] ?? "";
      let valB = b[sortField] ?? "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [orders, isAll, isB2B, searchTerm, statusFilter, clientTypeFilter, paymentFilter, sortField, sortDirection]);

  // Paginated visible list
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedOrders, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / rowsPerPage);

  // Single Status Update
  const handleUpdateStatus = async (orderId: string, status: Order["status"]) => {
    setIsActionPending(true);
    const result = await updateOrderStatusAction(orderId, status);
    setIsActionPending(false);
    
    if (result.success) {
      toast.success("Sipariş durumu başarıyla güncellendi.");
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      refreshOrders();
    } else {
      toast.error(result.error || "Güncelleme sırasında bir hata oluştu.");
    }
  };

  // Cancellation Handlers
  const handleOpenCancelModal = (orderId: string, orderNumber: string) => {
    setCancelModal({
      isOpen: true,
      orderId,
      orderNumber,
      isBulk: false,
      reason: "",
    });
  };

  const handleOpenBulkCancelModal = () => {
    if (selectedRows.size === 0) return;
    setCancelModal({
      isOpen: true,
      orderId: null,
      orderNumber: `${selectedRows.size} Adet Seçili Sipariş`,
      isBulk: true,
      reason: "",
    });
  };

  const handleConfirmCancel = async () => {
    setIsActionPending(true);
    try {
      if (cancelModal.isBulk) {
        const ids = Array.from(selectedRows);
        const result = await bulkCancelOrdersAction(ids, cancelModal.reason);
        if (result.success) {
          toast.success(`${ids.length} adet sipariş başarıyla iptal edildi.`);
          setSelectedRows(new Set());
          refreshOrders();
        } else {
          toast.error(result.error || "Toplu iptal işlemi başarısız oldu.");
        }
      } else if (cancelModal.orderId) {
        const result = await cancelOrderAction(cancelModal.orderId, cancelModal.reason);
        if (result.success) {
          toast.success("Sipariş başarıyla iptal edildi.");
          if (selectedOrder?.id === cancelModal.orderId) {
            setSelectedOrder(prev => prev ? { ...prev, status: "İptal Edildi" } : null);
          }
          refreshOrders();
        } else {
          toast.error(result.error || "İptal işlemi başarısız oldu.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "İptal sırasında hata oluştu.");
    } finally {
      setIsActionPending(false);
      setCancelModal({ isOpen: false, orderId: null, orderNumber: null, isBulk: false, reason: "" });
    }
  };

  // Bulk Invoicing
  const handleBulkGenerateInvoices = async () => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) return;

    // Open print window first to avoid browser blocking
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Yazıcı penceresi engellendi. Pop-up izni veriniz.");
      return;
    }

    setIsGenerating(true);
    let result;
    try {
      result = await bulkGenerateInvoicesAction(selectedIds);
    } catch (error: any) {
      setIsGenerating(false);
      printWindow.close();
      toast.error(error.message || "Faturalandırma servisi çağrılırken bir hata oluştu.");
      return;
    }
    setIsGenerating(false);

    if (!result || !result.success) {
      printWindow.close();
      toast.error(result?.error || "Toplu faturalandırma sırasında hata oluştu.");
      return;
    }

    // Build beautiful A4 invoice pages
    const selectedOrders = orders.filter(o => selectedRows.has(o.id));
    const companyName = cmsSettings?.companyName || "PEKEFE GERÇEK HASAT E-TİCARET";
    const logoUrl = cmsSettings?.logoUrl || "/uploads/1779836095322-585290292-Logo.jpg";
    const fullLogoUrl = window.location.origin + logoUrl;

    const invoicesHtml = selectedOrders.map(order => {
      const clientAcc = findClientAccount(order.client);
      const receiptItems = parseOrderSummary(order.summary, order.amount);
      
      const subtotal = receiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vat = subtotal * 0.20;
      const grandTotal = subtotal + vat;

      const itemsRowsHtml = receiptItems.map((item, idx) => `
        <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 12px 10px; font-weight: 700; font-size: 12px; color: #1e293b;">${item.name}</td>
          <td style="padding: 12px 10px; text-align: center; font-size: 12px; color: #475569; font-weight: 600;">${item.quantity} Adet</td>
          <td style="padding: 12px 10px; text-align: right; font-size: 12px; color: #475569; font-weight: 600;">₺${item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
          <td style="padding: 12px 10px; text-align: right; font-size: 12px; font-weight: 800; color: #1e293b;">₺${(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join("");

      const clientAddress = order.address || clientAcc?.address || "Adres bilgisi girilmemiştir.";
      const clientPhone = order.phone || clientAcc?.phone || "Belirtilmedi";
      const clientEmail = order.email || clientAcc?.email || "Belirtilmedi";

      return `
        <div class="card" style="padding: 45px; border: 1px solid #e2e8f0; border-radius: 24px; margin: 20px auto; max-width: 800px; background: #fff; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.04); page-break-after: always; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${primaryColor}; padding-bottom: 25px; margin-bottom: 25px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <img src="${fullLogoUrl}" alt="Logo" style="max-height: 55px; max-width: 180px; object-fit: contain;" onError="this.style.display='none'" />
              <div>
                <h2 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: -0.5px;">${companyName.toUpperCase()}</h2>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500; max-width: 320px; line-height: 1.5;">${cmsSettings?.contactAddress || "Kayseri OSB 1. Cadde No: 5, Türkiye"}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge" style="background: ${primaryColor}1a; color: ${primaryColor}; padding: 6px 12px; font-size: 10px; font-weight: 800; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${primaryColor}26; display: inline-block;">${order.type} SİPARİŞ</span>
              <p style="margin: 8px 0 0 0; font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 18px; color: #1e293b; letter-spacing: -0.5px;">#${order.orderNumber}</p>
              <p style="margin: 3px 0 0 0; font-size: 10px; color: #94a3b8; font-weight: 600;">Makbuz Tarihi: ${new Date().toLocaleDateString("tr-TR")}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
              <div class="section-title" style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 900; text-transform: uppercase; tracking: 1px; color: #94a3b8; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">Alıcı Bilgileri</div>
              <div style="font-size: 12px; line-height: 1.6; color: #1e293b;">
                <p style="margin: 0; font-weight: 800; font-size: 13px;">${order.client}</p>
                <p style="margin: 4px 0 0 0; color: #475569; font-weight: 500; max-width: 320px;">${clientAddress}</p>
                <p style="margin: 4px 0 0 0; color: #475569; font-weight: 500;"><b>Tel:</b> ${clientPhone} | <b>E-Posta:</b> ${clientEmail}</p>
              </div>
            </div>
            <div style="border-left: 1px solid #f1f5f9; padding-left: 30px;">
              <div class="section-title" style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 900; text-transform: uppercase; tracking: 1px; color: #94a3b8; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">Ödeme & Sevkiyat</div>
              <div style="font-size: 12px; line-height: 1.6; color: #1e293b;">
                <p style="margin: 0; font-weight: 500;"><b>Sipariş Tarihi:</b> <span style="font-weight: 700;">${order.date}</span></p>
                <p style="margin: 4px 0 0 0; font-weight: 500;"><b>Ödeme Yöntemi:</b> <span style="font-weight: 700;">${order.method}</span></p>
              </div>
            </div>
          </div>

          <div class="section-title" style="font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 900; text-transform: uppercase; tracking: 1px; color: #94a3b8; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">Sipariş Kalemleri</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">
                <th style="padding-bottom: 10px; width: 50%;">Açıklama</th>
                <th style="padding-bottom: 10px; text-align: center; width: 15%;">Miktar</th>
                <th style="padding-bottom: 10px; text-align: right; width: 15%;">Birim Fiyat</th>
                <th style="padding-bottom: 10px; text-align: right; width: 20%;">Toplam</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 35px; display: flex; justify-content: flex-end;">
            <div style="width: 280px; font-size: 12px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                <span>Ara Toplam:</span>
                <span style="color: #1e293b; font-weight: 700;">₺${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                <span>KDV (%20):</span>
                <span style="color: #1e293b; font-weight: 700;">₺${vat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; color: ${primaryColor}; margin-top: 12px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
                <span>Genel Toplam:</span>
                <span>₺${grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 60px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
            <p style="margin: 0; color: #475569; font-weight: 800;">Bizi tercih ettiğiniz için teşekkür ederiz!</p>
            <p style="margin: 4px 0 0 0;">PEKEFE Geleneksel & Doğal Lezzetler Destek Hattı: info@pekefe.com</p>
          </div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Toplu Sipariş Faturaları / Makbuzları</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              body { background: #fff; padding: 0; }
              .card { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
            }
          </style>
        </head>
        <body onload="window.print()">
          ${invoicesHtml}
        </body>
      </html>
    `);
    printWindow.document.close();

    const count = result.count ?? 0;
    const existingCount = result.existingCount ?? 0;
    
    if (count > 0 && existingCount > 0) {
      toast.success(`İşlem tamamlandı: ${count} adet yeni fatura oluşturuldu. ${existingCount} adet önceden oluşturulmuş fatura ile birlikte yazdırılıyor.`);
    } else if (count > 0) {
      toast.success(`İşlem tamamlandı: ${count} adet yeni fatura oluşturuldu ve yazdırılıyor.`);
    } else if (existingCount > 0) {
      toast.success(`Seçili siparişlerin faturaları zaten mevcut. ${existingCount} adet fatura yazdırılıyor...`);
    } else {
      toast.success("Seçili siparişlerin fatura çıktıları hazırlandı ve yazdırılıyor.");
    }
    setSelectedRows(new Set());
    refreshOrders();
  };

  // Bulk Kargo Labels Print
  const handleBulkPrintKargoLabels = () => {
    const selectedOrders = orders.filter(o => selectedRows.has(o.id));
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Yazıcı penceresi engellendi.");
      return;
    }

    const companyName = cmsSettings?.companyName || "PEKEFE GERÇEK HASAT";

    const labelsHtml = selectedOrders.map(o => {
      const clientAcc = findClientAccount(o.client);
      const clientAddress = o.address || clientAcc?.address || "Açık adres belirtilmemiştir.";
      const clientPhone = o.phone || clientAcc?.phone || "Belirtilmedi";
      
      let tierBadge = "MÜŞTERİ";
      if (o.type === "B2B") {
        const group = clientAcc?.dealerGroup || "Standart";
        tierBadge = `${group.toUpperCase()} BAYİ`;
      }

      // Deterministic SVG Barcode Pattern generation to avoid print dithering into solid black block
      let barcodeData = o.trackingNo || "";
      if (!barcodeData && o.summary && o.summary.startsWith("[")) {
        const carrierMatch = o.summary.match(/^\[([^\]|]+)(?:\s*\|\s*([^\]]+))?\]/);
        if (carrierMatch && carrierMatch[2]) {
          barcodeData = carrierMatch[2].trim();
        }
      }
      if (!barcodeData) {
        barcodeData = o.orderNumber || o.id.slice(-8).toUpperCase();
      }
      let x = 10;
      const svgRects: string[] = [];
      const numString = barcodeData.replace(/[^0-9]/g, "");
      const seed = numString ? (parseInt(numString.slice(-4)) || 1234) : 1234;
      
      for (let i = 0; i < 55; i++) {
        const w = ((i + seed) % 3 === 0) ? 3 : (((i + seed) % 5 === 0) ? 1 : 2);
        const gap = ((i + seed) % 2 === 0) ? 2 : 1;
        svgRects.push(`<rect x="${x}" y="5" width="${w}" height="50" fill="#000" />`);
        x += w + gap;
      }
      const svgWidth = x + 10;
      const barcodeSvg = `
        <svg width="100%" height="100%" viewBox="0 0 ${svgWidth} 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#fff" />
          ${svgRects.join("")}
        </svg>
      `;

      // Simulated QR Code mozaic patterns (Monochrome)
      const qrBlocks = Array.from({ length: 6 }).map((_, r) => {
        const cols = Array.from({ length: 6 }).map((_, c) => {
          const isBlack = (r + c) % 2 === 0 || (r === 0 && c === 0) || (r === 5 && c === 5) || (r === 0 && c === 5) || (r === 5 && c === 0);
          return `<div style="width: 4px; height: 4px; background: ${isBlack ? '#000' : '#fff'};"></div>`;
        }).join("");
        return `<div style="display: flex;">${cols}</div>`;
      }).join("");

      return `
        <div style="width: 100mm; height: 150mm; padding: 5mm; box-sizing: border-box; background: #fff; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border: 2px solid #000; color: #000; position: relative;">
          
          <!-- 1. ÜST BÖLÜM (LOGO & TIER BADGE) -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 3mm; height: 16mm; box-sizing: border-box;">
            <div>
              <h1 style="margin: 0; font-size: 16px; font-weight: 900; letter-spacing: -0.5px;">${companyName.toUpperCase()}</h1>
              <span style="font-size: 8px; font-weight: 800; tracking-widest">YERLİ İMALAT SANAYİ</span>
            </div>
            <div style="background: #000; color: #fff; padding: 1mm 2.5mm; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; border-radius: 0px; text-transform: uppercase;">
              ${tierBadge}
            </div>
          </div>

          <!-- 2. SİPARİŞ BİLGİLERİ KUTUSU -->
          <div style="border: 1.5px solid #000; padding: 2.5mm; margin-top: 3mm; box-sizing: border-box;">
            <table style="width: 100%; font-size: 9px; border-collapse: collapse; font-weight: bold;">
              <tr>
                <td style="width: 30%; padding-bottom: 1mm;">Sipariş No:</td>
                <td style="font-size: 11px; font-weight: 900; padding-bottom: 1mm;">#${o.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 1mm;">Tarih / Saat:</td>
                <td style="padding-bottom: 1mm;">${o.date} - 16:55</td>
              </tr>
              <tr>
                <td style="padding-bottom: 1mm;">Ödeme Türü:</td>
                <td style="padding-bottom: 1mm;">${o.method || 'Havale/EFT'}</td>
              </tr>
              <tr>
                <td>Lojistik:</td>
                <td>${o.address?.includes("Yurtiçi") ? "Yurtiçi Kargo" : "Aras Kargo"} | Paket: 1/1</td>
              </tr>
            </table>
          </div>

          <!-- 3. ALICI / TESLİMAT ADRESİ (EN BÜYÜK ALAN) -->
          <div style="margin-top: 3mm; flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-start;">
            <p style="font-size: 8px; font-weight: 900; margin: 0 0 1.5mm 0; border-bottom: 1px solid #000; padding-bottom: 0.5mm; letter-spacing: 0.5px;">ALICI / TESLİMAT ADRESİ</p>
            <h3 style="margin: 0 0 1.5mm 0; font-size: 13px; font-weight: 900; text-transform: uppercase;">${o.client}</h3>
            <p style="margin: 0; font-size: 10px; line-height: 1.35; font-weight: 700; word-break: break-word;">${clientAddress}</p>
            <p style="margin: 2.5mm 0 0 0; font-size: 12px; font-weight: 900;">TEL: ${clientPhone}</p>
          </div>

          <!-- 4. B2B & SEKTÖREL BİLGİLER VE ÖNCELİK ROZETLERİ -->
          <div style="border-top: 1.5px dashed #000; padding-top: 2.5mm; margin-top: 2mm; display: flex; justify-content: space-between; align-items: flex-end; box-sizing: border-box;">
            <div style="font-size: 8px; font-weight: 800; line-height: 1.4;">
              ${o.type === "B2B" ? `
                <div>Cari Kodu: ${clientAcc?.id || 'CR00045'}</div>
                <div>Vade Koşulu: ${clientAcc?.vadeGun || '30'} Gün Vade</div>
                <div>Lojistik: 1 Koli | 4.8 Desi | 14.8 kg</div>
              ` : `
                <div>Sipariş Tipi: Standart Perakende</div>
                <div>Lojistik: 1 Koli | 2.4 Desi | 3.5 kg</div>
              `}
              <div style="margin-top: 1mm; font-weight: 900;">Üretim: Hazır Stok (Standart Ürün)</div>
            </div>
            
            <div style="display: flex; gap: 1mm;">
              <span style="border: 1.5px solid #000; padding: 0.5mm 1.5mm; font-size: 8px; font-weight: 900;">ACİL</span>
              ${o.type === "B2B" ? `
                <span style="border: 1.5px solid #000; padding: 0.5mm 1.5mm; font-size: 8px; font-weight: 900; background: #000; color: #fff;">TOPTAN</span>
              ` : `
                <span style="border: 1.5px solid #000; padding: 0.5mm 1.5mm; font-size: 8px; font-weight: 900;">B2C</span>
              `}
            </div>
          </div>

          <!-- 5. BARKOD VE QR KOD ALANI -->
          <div style="border-top: 2px solid #000; padding-top: 3mm; margin-top: 3mm; display: flex; justify-content: space-between; align-items: center; height: 26mm; box-sizing: border-box;">
            <!-- Barkod sol -->
            <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div style="display: flex; height: 15mm; align-items: stretch; width: 92%;">
                ${barcodeSvg}
              </div>
              <p style="margin: 1mm 0 0 0; font-size: 11px; font-weight: 900; letter-spacing: 2px; text-align: left;">*${barcodeData}*</p>
            </div>

            <!-- Gelişmiş QR Kod sağ -->
            <div style="width: 14mm; height: 14mm; border: 2px solid #000; padding: 1mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center; shrink-0;">
              <div style="display: flex; flex-direction: column; gap: 0px;">
                ${qrBlocks}
              </div>
            </div>
          </div>

          <!-- 6. OPERASYON BİLGİLERİ (FOOTER) -->
          <div style="border-top: 1px solid #cbd5e1; padding-top: 1mm; margin-top: 1.5mm; font-size: 6.5px; font-weight: 700; display: flex; justify-content: space-between; color: #64748b;">
            <span>Oluşturan: Sistem Admin</span>
            <span>Yazdırma: ${new Date().toLocaleString("tr-TR")}</span>
          </div>

        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Sevkiyat Adres Etiketleri (A6 Termal - 100x150mm)</title>
          <style>
            @page { size: 100mm 150mm; margin: 0; }
            body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              body { background: #fff; }
              div { border-color: #000 !important; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 0px;">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Bulk Picking List
  const handleBulkPrintPickLists = () => {
    const selectedOrders = orders.filter(o => selectedRows.has(o.id));
    const consolidatedMap: Record<string, { quantity: number; orders: string[] }> = {};
    
    selectedOrders.forEach(o => {
      const items = parseOrderSummary(o.summary);
      items.forEach(item => {
        if (consolidatedMap[item.name]) {
          consolidatedMap[item.name].quantity += item.quantity;
          if (!consolidatedMap[item.name].orders.includes(o.orderNumber)) {
            consolidatedMap[item.name].orders.push(o.orderNumber);
          }
        } else {
          consolidatedMap[item.name] = {
            quantity: item.quantity,
            orders: [o.orderNumber]
          };
        }
      });
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = Object.entries(consolidatedMap).map(([name, data]) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: bold; color: #1e293b; font-size: 13px;">${name}</td>
        <td style="padding: 12px; text-align: center; font-weight: 900; font-size: 16px; color: ${primaryColor};">${data.quantity} Adet</td>
        <td style="padding: 12px; color: #64748b; font-size: 11px;">${data.orders.join(", ")}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Toplu Çeki Listesi</title>
          <style>
            body { font-family: sans-serif; padding: 40px; background: #fff; color: #334155; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; padding: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; text-align: left; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
            .badge { background: ${primaryColor}; color: white; padding: 4px 10px; font-size: 12px; font-weight: bold; border-radius: 6px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">PEKEFE GERÇEK HASAT SEVKİYAT</h1>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Toplu Çeki Listesi (Warehouse Picking)</p>
            </div>
            <div>
              <span class="badge">${selectedOrders.length} Sipariş Birleştirildi</span>
            </div>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">Yazdırılma Tarihi: ${new Date().toLocaleString("tr-TR")}</p>
          <table>
            <thead>
              <tr>
                <th>Ürün Ekipman Adı</th>
                <th style="text-align: center;">Miktar</th>
                <th>İlgili Sipariş Numaraları</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Helper to replace Turkish characters with English ones to prevent PDF encoding issues in default Helvetica font
  const trToEng = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/ı/g, "i")
      .replace(/ş/g, "s")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/İ/g, "I")
      .replace(/Ş/g, "S")
      .replace(/Ğ/g, "G")
      .replace(/Ü/g, "U")
      .replace(/Ö/g, "O")
      .replace(/Ç/g, "C");
  };

  // Export filtered and sorted orders to Excel
  const handleExportExcel = (mode: "selected" | "all") => {
    try {
      const targetOrders = mode === "selected" 
        ? filteredAndSortedOrders.filter(o => selectedRows.has(o.id))
        : filteredAndSortedOrders;

      if (targetOrders.length === 0) {
        toast.error("Aktarılacak sipariş bulunamadı. Lütfen önce sipariş seçtiğinizden emin olun.");
        return;
      }

      const exportData = targetOrders.map((o) => ({
        "Sipariş No": o.orderNumber,
        "Tarih": o.date,
        "Müşteri / Cari": o.client,
        "Müşteri Tipi": o.type === "B2B" ? "B2B Bayi" : "B2C Perakende",
        "Sipariş Özeti": o.summary,
        "Lojistik & Kargo": `${o.cargoCompany || ""} / ${o.trackingNo || ""}`,
        "Tutar": o.amount,
        "Ödeme Tipi": o.method,
        "Durum": o.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Siparişler");

      const fileSuffix = mode === "selected" ? "Secilenler" : "Tumunu";
      XLSX.writeFile(workbook, `Siparis_Listesi_${fileSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel listesi başarıyla indirildi.");
      setIsExcelDropdownOpen(false);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Excel dışa aktarma sırasında hata oluştu.");
    }
  };

  // Export filtered and sorted orders to PDF
  const handleExportPdf = (mode: "selected" | "all") => {
    try {
      const targetOrders = mode === "selected" 
        ? filteredAndSortedOrders.filter(o => selectedRows.has(o.id))
        : filteredAndSortedOrders;

      if (targetOrders.length === 0) {
        toast.error("Aktarılacak sipariş bulunamadı. Lütfen önce sipariş seçtiğinizden emin olun.");
        return;
      }

      const doc = new jsPDF();
      
      // Page header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("PEKEFE GERÇEK HASAT - SIPARIS LISTESI", 14, 15);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}`, 14, 22);
      doc.text(`Toplam Siparis Sayisi: ${targetOrders.length}`, 14, 27);
      
      // Table configuration
      const headers = [["Siparis No", "Tarih", "Musteri / Cari", "Tutar", "Durum"]];
      const rows = targetOrders.map((o) => [
        `#${trToEng(o.orderNumber)}`,
        trToEng(o.date),
        trToEng(o.client),
        `TL ${o.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        trToEng(o.status)
      ]);
      
      autoTable(doc, {
        startY: 32,
        head: headers,
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [180, 83, 9] }, // Brand primary color (#b45309)
        styles: { font: "Helvetica", fontSize: 9 },
      });
      
      const fileSuffix = mode === "selected" ? "Secilenler" : "Tumunu";
      doc.save(`Siparis_Listesi_${fileSuffix}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF listesi başarıyla indirildi.");
      setIsPdfDropdownOpen(false);
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF dışa aktarma sırasında hata oluştu.");
    }
  };

  // Single PDF print receipt handler
  const handlePrintSingleReceipt = (order: Order) => {
    const clientAcc = findClientAccount(order.client);
    const receiptItems = parseOrderSummary(order.summary, order.amount);
    
    const subtotal = receiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * 0.20;
    const grandTotal = subtotal + vat;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Yazdırılma penceresi engellendi.");
      return;
    }

    const companyName = cmsSettings?.companyName || "PEKEFE GERÇEK HASAT E-TİCARET";
    const logoUrl = cmsSettings?.logoUrl || "/uploads/1779836095322-585290292-Logo.jpg";
    const fullLogoUrl = window.location.origin + logoUrl;

    const itemsRowsHtml = receiptItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding: 12px 10px; font-weight: 700; font-size: 12px; color: #1e293b;">${item.name}</td>
        <td style="padding: 12px 10px; text-align: center; font-size: 12px; color: #475569; font-weight: 600;">${item.quantity} Adet</td>
        <td style="padding: 12px 10px; text-align: right; font-size: 12px; color: #475569; font-weight: 600;">₺${item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 12px 10px; text-align: right; font-size: 12px; font-weight: 800; color: #1e293b;">₺${(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    const clientAddress = order.address || clientAcc?.address || "Adres bilgisi girilmemiştir.";
    const clientPhone = order.phone || clientAcc?.phone || "Belirtilmedi";
    const clientEmail = order.email || clientAcc?.email || "Belirtilmedi";

    printWindow.document.write(`
      <html>
        <head>
          <title>Sipariş Makbuzu - #${order.orderNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #f8fafc; color: #334155; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .card { padding: 45px; border: 1px solid #e2e8f0; border-radius: 24px; margin: 0 auto; max-width: 800px; background: #fff; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.04); }
            .badge { background: ${primaryColor}1a; color: ${primaryColor}; padding: 6px 12px; font-size: 10px; font-weight: 800; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${primaryColor}26; display: inline-block; }
            .section-title { font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 900; text-transform: uppercase; tracking: 1px; color: #94a3b8; border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
            @media print {
              body { background: #fff; padding: 0; }
              .card { border: none !important; box-shadow: none !important; padding: 0 !important; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="card">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid ${primaryColor}; padding-bottom: 25px; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${fullLogoUrl}" alt="Logo" style="max-height: 55px; max-width: 180px; object-fit: contain;" onError="this.style.display='none'" />
                <div>
                  <h2 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: -0.5px;">${companyName.toUpperCase()}</h2>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500; max-width: 320px; line-height: 1.5;">${cmsSettings?.contactAddress || "Kayseri OSB 1. Cadde No: 5, Türkiye"}</p>
                </div>
              </div>
              <div style="text-align: right;">
                <span class="badge">${order.type} SİPARİŞ</span>
                <p style="margin: 8px 0 0 0; font-family: 'Outfit', sans-serif; font-weight: 900; font-size: 18px; color: #1e293b; letter-spacing: -0.5px;">#${order.orderNumber}</p>
                <p style="margin: 3px 0 0 0; font-size: 10px; color: #94a3b8; font-weight: 600;">Makbuz Tarihi: ${new Date().toLocaleDateString("tr-TR")}</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
              <div>
                <div class="section-title">Alıcı Bilgileri</div>
                <div style="font-size: 12px; line-height: 1.6; color: #1e293b;">
                  <p style="margin: 0; font-weight: 800; font-size: 13px;">${order.client}</p>
                  <p style="margin: 4px 0 0 0; color: #475569; font-weight: 500; max-width: 320px;">${clientAddress}</p>
                  <p style="margin: 4px 0 0 0; color: #475569; font-weight: 500;"><b>Tel:</b> ${clientPhone} | <b>E-Posta:</b> ${clientEmail}</p>
                </div>
              </div>
              <div style="border-left: 1px solid #f1f5f9; padding-left: 30px;">
                <div class="section-title">Ödeme & Sevkiyat</div>
                <div style="font-size: 12px; line-height: 1.6; color: #1e293b;">
                  <p style="margin: 0; font-weight: 500;"><b>Sipariş Tarihi:</b> <span style="font-weight: 700;">${order.date}</span></p>
                  <p style="margin: 4px 0 0 0; font-weight: 500;"><b>Ödeme Yöntemi:</b> <span style="font-weight: 700;">${order.method}</span></p>
                </div>
              </div>
            </div>

            <div class="section-title" style="margin-bottom: 5px;">Sipariş Kalemleri</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">
                  <th style="padding-bottom: 10px; width: 50%;">Açıklama</th>
                  <th style="padding-bottom: 10px; text-align: center; width: 15%;">Miktar</th>
                  <th style="padding-bottom: 10px; text-align: right; width: 15%;">Birim Fiyat</th>
                  <th style="padding-bottom: 10px; text-align: right; width: 20%;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            <div style="margin-top: 35px; display: flex; justify-content: flex-end;">
              <div style="width: 280px; font-size: 12px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                  <span>Ara Toplam:</span>
                  <span style="color: #1e293b; font-weight: 700;">₺${subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                  <span>KDV (%20):</span>
                  <span style="color: #1e293b; font-weight: 700;">₺${vat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; color: ${primaryColor}; margin-top: 12px; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
                  <span>Genel Toplam:</span>
                  <span>₺${grandTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 60px; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0; color: #475569; font-weight: 800;">Bizi tercih ettiğiniz için teşekkür ederiz!</p>
              <p style="margin: 4px 0 0 0;">PEKEFE Geleneksel & Doğal Lezzetler Destek Hattı: info@pekefe.com</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Status badge style mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Yeni": 
      case "Yeni Sipariş":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Ödeme Bekliyor":
      case "Ödeme Bekleniyor":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Ödeme Onaylandı":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Hazırlanıyor": 
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "Paketlendi":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Kargo Etiketi Oluşturuldu":
        return "bg-teal-50 text-teal-700 border-teal-100";
      case "Kargolandı":
      case "Kargoya Verildi":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Teslim Edildi":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "İade Talebi":
        return "bg-rose-50 text-rose-700 border-rose-100 animate-pulse";
      case "İade Tamamlandı":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "İptal Edildi":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  // Apply Saved Filter
  const applySavedFilter = (filter: SavedFilter) => {
    setSearchTerm(filter.searchTerm);
    setStatusFilter(filter.statusFilter);
    setClientTypeFilter(filter.clientType);
    setPaymentFilter(filter.paymentMethod);
    toast.success(`"${filter.name}" filtresi başarıyla uygulandı.`);
  };

  // Create new Saved Filter
  const saveCurrentFilter = () => {
    if (!newFilterName.trim()) {
      toast.error("Lütfen bir filtre adı girin.");
      return;
    }
    const newFilter: SavedFilter = {
      name: newFilterName,
      searchTerm,
      statusFilter,
      clientType: clientTypeFilter,
      paymentMethod: paymentFilter
    };
    setSavedFilters([...savedFilters, newFilter]);
    setNewFilterName("");
    toast.success("Filtre başarıyla kaydedildi.");
  };

  // Simulated AI responses
  const handleAiCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { role: "user", content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");

    let reply = "Bu konuda veri havuzunu analiz ediyorum. Lütfen sorunuzu sipariş hacmi, en aktif bayiler veya lojistik performans özelinde daraltın.";
    const query = aiInput.toLowerCase();

    if (query.includes("satış") || query.includes("neden düştü")) {
      reply = "Son 7 günlük B2B sipariş havuzuna göre, İç Anadolu bölgesindeki soğuk hava dalgası sebebiyle kovan lojistiğinde geçici bir yavaşlama mevcuttur. Bugün gelen sipariş hacmi dünkü güne kıyasla %4.2 geride görünmektedir ancak ortalama sepet tutarı (AOV) ₺12.450 seviyesinde sabit kalmıştır.";
    } else if (query.includes("risk") || query.includes("riskli")) {
      reply = "Analiz sonuçlarına göre en kritik risk limitine sahip cari hesap: **'Kayseri Bal Üreticileri Birliği'**. Limit kullanımı %92 seviyesinde olup, vadesi geçmiş 2 adet fatura (toplam ₺18.500) bulunmaktadır. Bu birliğin yeni siparişleri 'Ödeme Bekleniyor' durumuna alınmıştır.";
    } else if (query.includes("körük") || query.includes("en çok satılan")) {
      reply = "Son 30 günde en çok satılan model: **'Galvaniz Paslanmaz Derili Arıcı Körüğü (Model XL)'**. Toplam 428 adet sevk edilmiş olup, iade oranı %0.4 ile mükemmel durumdadır.";
    } else if (query.includes("iade")) {
      reply = "Son 30 günlük verilerde iade oranı en yüksek ürün grubu: **'Standart Arıcı Maskesi'**. İade sebebi çoğunlukla dikiş kalitesi / boyut uyumsuzluğu olarak bildirilmiştir. İnceleme başlatılması önerilir.";
    }

    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: "assistant", content: reply }]);
    }, 800);
  };

  return (
    <div className="flex-grow flex flex-col bg-[#F5F7FA] min-h-screen text-slate-800 font-sans pb-16">
      
      {/* Dynamic Font Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
      `}} />

      {/* Main Container */}
      <div className="p-6 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Inbox className="w-6 h-6 text-orange-500" /> {pageTitle}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Shopify Admin & Odoo ERP Esintili Operasyon Havuzu</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <List className="w-3.5 h-3.5" /> Liste
              </button>
              <button 
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "kanban" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                <KanbanSquare className="w-3.5 h-3.5" /> Kanban
              </button>
            </div>

            {/* Refresh */}
            <button 
              onClick={() => { refreshOrders(); toast.success("Sipariş listesi güncellendi."); }}
              className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition shadow-sm cursor-pointer"
              title="Yenile"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. PREMIUM KPI METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Toplam Ciro */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bugün / Toplam Hacim</span>
              <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><Award className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800">₺{metrics.totalVolume.toLocaleString("tr-TR")}</p>
              <p className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <span>↑ %14.8</span> <span className="text-slate-400">düne göre</span>
              </p>
            </div>
            {/* Sparkline simulation */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-orange-500/10">
              <div className="h-full bg-orange-500 w-[68%]" />
            </div>
          </div>

          {/* Toplam Sipariş */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sipariş Sayısı</span>
              <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><ShoppingCart className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800">{metrics.totalCount} Adet</p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">Havuzda aktif sipariş</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-500/10">
              <div className="h-full bg-blue-500 w-[55%]" />
            </div>
          </div>

          {/* Hazırlanan */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hazırlanan</span>
              <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg"><Clock className="w-4 h-4 animate-spin-slow" /></div>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800">{metrics.processing} Sipariş</p>
              <p className="text-[9px] text-amber-600 font-bold mt-1">MRP / Sevkiyat bandında</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-500/10">
              <div className="h-full bg-amber-500 w-[40%]" />
            </div>
          </div>

          {/* Kargolanan */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kargoda</span>
              <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><Truck className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800">{metrics.shipped} Gönderi</p>
              <p className="text-[9px] text-indigo-600 font-bold mt-1">Yolda / Dağıtımda</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-500/10">
              <div className="h-full bg-indigo-500 w-[80%]" />
            </div>
          </div>

          {/* Ortalama Sepet */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ortalama Sepet</span>
              <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg"><BadgePercent className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800">₺{metrics.avgBasket.toLocaleString("tr-TR")}</p>
              <p className="text-[9px] text-purple-600 font-bold mt-1">AOV operasyonel hacim</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-purple-500/10">
              <div className="h-full bg-purple-500 w-[62%]" />
            </div>
          </div>

          {/* Aktif Bayiler */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Bayi (B2B)</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg"><UserCheck className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-800">{metrics.activeDealers} Cari</p>
              <p className="text-[9px] text-emerald-600 font-bold mt-1">Son 30 gün sipariş veren</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-500/10">
              <div className="h-full bg-emerald-500 w-[45%]" />
            </div>
          </div>

        </div>

        {/* 2. ADVANCED EXPANDABLE FILTERS PANEL */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div 
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className="px-5 py-4 flex justify-between items-center bg-slate-50/50 border-b border-slate-100 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gelişmiş Arama & Filtreleme</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterPanelOpen ? "rotate-180" : ""}`} />
          </div>

          {isFilterPanelOpen && (
            <div className="p-5 border-b border-slate-100 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Search Term */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sipariş Arama</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="No, müşteri, ürün..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sipariş Durumu</label>
                  <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="Tümü">Tüm Durumlar</option>
                    <option value="Yeni">Yeni Sipariş</option>
                    <option value="Ödeme Bekliyor">Ödeme Bekliyor</option>
                    <option value="Ödeme Bekleniyor">Ödeme Bekleniyor</option>
                    <option value="Ödeme Onaylandı">Ödeme Onaylandı</option>
                    <option value="Hazırlanıyor">Hazırlanıyor</option>
                    <option value="Paketlendi">Paketlendi</option>
                    <option value="Kargolandı">Kargolandı</option>
                    <option value="Kargoya Verildi">Kargoya Verildi</option>
                    <option value="Teslim Edildi">Teslim Edildi</option>
                    <option value="İptal Edildi">İptal Edildi</option>
                    <option value="İade Talebi">İade Talebi</option>

                  </select>
                </div>

                {/* Client Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Müşteri Tipi</label>
                  <select 
                    value={clientTypeFilter}
                    onChange={e => setClientTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="Tümü">Tüm Cihaz / Tipler</option>
                    <option value="B2B">B2B Bayi</option>
                    <option value="B2C">B2C Perakende</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ödeme Tipi</label>
                  <select 
                    value={paymentFilter}
                    onChange={e => setPaymentFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="Tümü">Tümü</option>
                    <option value="Havale">Banka Havalesi</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Cari">Cari Hesap Vade</option>
                  </select>
                </div>

                {/* Reset Filters Button */}
                <div className="flex items-end justify-end">
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("Tümü");
                      setClientTypeFilter("Tümü");
                      setPaymentFilter("Tümü");
                      toast.success("Tüm filtreler sıfırlandı.");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
                  </button>
                </div>
              </div>

              {/* Saved Filters Management */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Kayıtlı Filtreler:</span>
                  {savedFilters.map((f, i) => (
                    <button 
                      key={i} 
                      onClick={() => applySavedFilter(f)}
                      className="px-2.5 py-1 bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-600 hover:text-orange-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      {f.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Mevcut filtreyi kaydet..." 
                    value={newFilterName}
                    onChange={e => setNewFilterName(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-orange-400"
                  />
                  <button 
                    onClick={saveCurrentFilter}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. CORE CONTENT AREA */}
        {viewMode === "list" ? (
          /* LIST GÖRÜNÜMÜ */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Table Action Bar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold">{filteredAndSortedOrders.length} sipariş listeleniyor</span>
              
              <div className="flex items-center gap-2">
                {/* Excel Export Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsExcelDropdownOpen(!isExcelDropdownOpen);
                      setIsPdfDropdownOpen(false);
                      setIsColumnDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm animate-in fade-in duration-200"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" /> Excel İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isExcelDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                      <button
                        onClick={() => {
                          handleExportExcel("selected");
                          setIsExcelDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        Seçilenleri Excel'e Aktar
                      </button>
                      <button
                        onClick={() => {
                          handleExportExcel("all");
                          setIsExcelDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Tümünü Excel'e Aktar
                      </button>
                    </div>
                  )}
                </div>

                {/* PDF Export Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsPdfDropdownOpen(!isPdfDropdownOpen);
                      setIsExcelDropdownOpen(false);
                      setIsColumnDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm animate-in fade-in duration-200"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" /> PDF İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isPdfDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                      <button
                        onClick={() => {
                          handleExportPdf("selected");
                          setIsPdfDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        Seçilenleri PDF'e Aktar
                      </button>
                      <button
                        onClick={() => {
                          handleExportPdf("all");
                          setIsPdfDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Tümünü PDF'e Aktar
                      </button>
                    </div>
                  )}
                </div>

                {/* Columns Selector Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsColumnDropdownOpen(!isColumnDropdownOpen);
                      setIsExcelDropdownOpen(false);
                      setIsPdfDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-sm"
                  >
                    <Columns className="w-3.5 h-3.5" /> Sütunlar <ChevronDown className="w-3 h-3" />
                  </button>
                {isColumnDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-2 w-48 z-40 animate-in fade-in slide-in-from-top-1.5">
                    {Object.entries(visibleColumns).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-55/30 cursor-pointer select-none text-xs font-semibold text-slate-700">
                        <input 
                          type="checkbox" 
                          checked={val} 
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !val }))}
                          className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                        />
                        <span>
                          {key === "orderNumber" && "Sipariş No / Tarih"}
                          {key === "client" && "Müşteri / Cari"}
                          {key === "summary" && "Sipariş Özet"}
                          {key === "logistic" && "Lojistik / Kargo"}
                          {key === "amount" && "Tutar"}
                          {key === "status" && "Durum"}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* High-Performance Datagrid Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/20">
                    <th className="p-4 w-12 text-center select-none">
                      <input 
                        type="checkbox"
                        checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedRows.has(o.id))}
                        onChange={() => toggleSelectAll(paginatedOrders)}
                        className="w-4 h-4 rounded border-slate-200 text-orange-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    {visibleColumns.orderNumber && (
                      <th className="p-4 cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort("orderNumber")}>
                        <div className="flex items-center gap-1">
                          <span>Sipariş No / Tarih</span> <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                    )}
                    {visibleColumns.client && (
                      <th className="p-4 cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort("client")}>
                        <div className="flex items-center gap-1">
                          <span>Müşteri & Cari</span> <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                    )}
                    {visibleColumns.summary && <th className="p-4">Sipariş Özeti</th>}
                    {visibleColumns.logistic && <th className="p-4">Lojistik & Kargo</th>}
                    {visibleColumns.amount && (
                      <th className="p-4 cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort("amount")}>
                        <div className="flex items-center gap-1">
                          <span>Tutar</span> <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                    )}
                    {visibleColumns.status && (
                      <th className="p-4 cursor-pointer hover:text-slate-700 select-none" onClick={() => handleSort("status")}>
                        <div className="flex items-center gap-1">
                          <span>Durum</span> <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                    )}
                    <th className="p-4 text-center">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map(order => {
                      const isSelected = selectedRows.has(order.id);
                      const clientAcc = findClientAccount(order.client);

                      let tierBadge = "B2C Perakende";
                      let tierColor = "bg-slate-100 text-slate-600 border-slate-200";
                      if (order.type === "B2B") {
                        const group = clientAcc?.dealerGroup || "Standart";
                        tierBadge = `B2B - ${group} Bayi`;
                        if (group === "Gold") {
                          tierColor = "bg-orange-50 text-orange-600 border-orange-100 font-bold";
                        } else if (group === "Silver") {
                          tierColor = "bg-purple-50 text-purple-600 border-purple-100 font-bold";
                        } else {
                          tierColor = "bg-blue-50 text-blue-600 border-blue-100";
                        }
                      }

                      return (
                        <tr 
                          key={order.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-orange-500/5 hover:bg-orange-500/10" : ""}`}
                        >
                          <td className="p-4 w-12 text-center select-none">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(order.id)}
                              className="w-4 h-4 rounded border-slate-200 text-orange-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          {visibleColumns.orderNumber && (
                            <td className="p-4">
                              <p className="font-bold text-slate-900 text-sm">#{order.orderNumber}</p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {(() => {
                                  if (!order.date) return "—";
                                  // If it looks like a Turkish formatted date (DD.MM.YYYY), display as-is
                                  if (typeof order.date === "string" && /^\d{2}\.\d{2}\.\d{4}/.test(order.date)) {
                                    return order.date;
                                  }
                                  try {
                                    const d = new Date(order.date);
                                    if (isNaN(d.getTime())) return String(order.date);
                                    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
                                  } catch {
                                    return String(order.date);
                                  }
                                })()}
                              </p>
                            </td>
                          )}
                          {visibleColumns.client && (
                            <td className="p-4">
                              <p className="font-bold text-slate-800 text-sm">{order.client}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] border inline-block mt-1 ${tierColor}`}>
                                {tierBadge}
                              </span>
                            </td>
                          )}
                          {visibleColumns.summary && (
                            <td className="p-4 text-xs font-semibold text-slate-600 max-w-[240px] truncate" title={order.summary}>
                              {order.summary}
                            </td>
                          )}
                          {visibleColumns.logistic && (
                            <td className="p-4">
                              <div className="flex flex-col text-[10px] text-slate-500 font-semibold space-y-0.5">
                                <span className="flex items-center gap-1 text-slate-700">
                                  <Truck className="w-3 h-3 text-slate-400" /> {order.address?.includes("Yurtiçi") ? "Yurtiçi Kargo" : "Aras Kargo"}
                                </span>
                                {(() => {
                                  const logDetails = calculateLogisticDetails(order.summary);
                                  return <span>{logDetails.koli} Koli · {logDetails.desi} Desi</span>;
                                })()}
                              </div>
                            </td>
                          )}
                          {visibleColumns.amount && (
                            <td className="p-4 font-bold text-slate-900 text-sm">
                              ₺{order.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(order.status)}`}>
                                {order.status}
                              </span>
                            </td>
                          )}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setActiveDrawerTab("general");
                                }}
                                className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition text-slate-600 cursor-pointer shadow-xs inline-flex items-center justify-center"
                                title="Sipariş Detayı"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {order.status !== "İptal Edildi" ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCancelModal(order.id, order.orderNumber);
                                  }}
                                  className="p-1.5 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 text-rose-600 transition cursor-pointer shadow-xs inline-flex items-center justify-center"
                                  title="Siparişi İptal Et"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="p-1.5 text-slate-300 inline-flex items-center justify-center" title="Sipariş Zaten İptal Edildi">
                                  <Ban className="w-3.5 h-3.5 opacity-40" />
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-sm font-semibold text-slate-400">
                        Arama kriterlerine uygun sipariş bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Premium Pagination Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-semibold">
                Sayfa {currentPage} / {totalPages || 1} · Toplam {filteredAndSortedOrders.length} kayıt
              </span>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* KANBAN GÖRÜNÜMÜ */
          <div className="flex overflow-x-auto gap-4 pb-4 select-none">
            {["Yeni", "Hazırlanıyor", "Kargolandı", "Teslim Edildi", "İptal Edildi"].map(colName => {
              const colOrders = filteredAndSortedOrders.filter(o => o.status === colName);
              return (
                <div key={colName} className="flex-1 min-w-[280px] bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{colName}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
                      {colOrders.length}
                    </span>
                  </div>
                  
                  <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                    {colOrders.map(o => (
                      <div 
                        key={o.id} 
                        onClick={() => setSelectedOrder(o)}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-orange-300 transition-colors cursor-pointer space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-900">#{o.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{o.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{o.client}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{o.summary}</p>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
                          <span className="text-xs font-bold text-slate-900">₺{o.amount.toLocaleString("tr-TR")}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatusBadge(o.status)}`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}

                    {colOrders.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-400 font-semibold border-2 border-dashed border-slate-200 rounded-xl">
                        Sipariş bulunmuyor
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. FLOATING BULK ACTIONS ACTION BAR */}
      {selectedRows.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center px-6 py-3.5 z-40 gap-4 animate-in slide-in-from-bottom-5 duration-300 border border-slate-800">
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-orange-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-100">{selectedRows.size} Sipariş Seçildi</span>
          </div>
          
          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleBulkGenerateInvoices}
              disabled={isGenerating}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> Fatura Yazdır
            </button>
            <button 
              onClick={handleBulkPrintKargoLabels}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" /> Kargo Etiketi Al
            </button>
            <button 
              onClick={handleBulkPrintPickLists}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" /> Çeki Listesi Al
            </button>
            <button 
              onClick={handleOpenBulkCancelModal}
              className="flex items-center gap-1 px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" /> Seçilenleri İptal Et
            </button>
          </div>

          <button 
            onClick={() => setSelectedRows(new Set())}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. SLIDE-OVER SHEET/DRAWER (SİPARİŞ DETAY) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-100">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-400"># {selectedOrder.orderNumber}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">{selectedOrder.client}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Links */}
            <div className="px-6 border-b border-slate-100 flex gap-4 text-xs font-bold bg-white z-10">
              {[
                { id: "general", label: "Genel" },
                { id: "items", label: "Ürünler" },
                { id: "client", label: "Müşteri & Cari" },
                { id: "logistic", label: "Lojistik" },
                { id: "timeline", label: "Tarihçe" }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveDrawerTab(t.id as any)}
                  className={`py-3 border-b-2 transition-all cursor-pointer ${activeDrawerTab === t.id ? "border-orange-500 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Body Content */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              {/* TAB: GENERAL */}
              {activeDrawerTab === "general" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Summary Block */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sipariş Özeti</p>
                    <p className="text-xs text-slate-700 font-semibold leading-relaxed">{selectedOrder.summary}</p>
                    <div className="h-px bg-slate-200/50" />
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Ödeme Şekli</span>
                        <span className="font-bold text-slate-900 bg-white px-2.5 py-1 border border-slate-200 rounded-lg shadow-2xs">
                          {selectedOrder.method || "Kredi Kartı"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Kargo Gönderimi</span>
                        <span className="font-semibold text-slate-800">
                          {selectedOrder.cargoCompany || "Yurtiçi Kargo"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                        <span className="font-bold text-slate-600">Toplam Tutar</span>
                        <span className="font-extrabold text-orange-600 text-base">₺{selectedOrder.amount.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Durum Yönetimi</p>
                      {selectedOrder.status === "İptal Edildi" && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Sipariş İptal Edilmiştir
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["Yeni", "Hazırlanıyor", "Kargolandı", "Teslim Edildi"].map(st => (
                        <button
                          key={st}
                          disabled={isActionPending || selectedOrder.status === st}
                          onClick={() => handleUpdateStatus(selectedOrder.id, st as any)}
                          className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition cursor-pointer ${selectedOrder.status === st ? "bg-orange-500 text-white border-orange-500" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                        >
                          {st === "Kargolandı" ? "Kargoya Ver" : st}
                        </button>
                      ))}

                      {/* İptal Butonu */}
                      <button
                        disabled={isActionPending || selectedOrder.status === "İptal Edildi"}
                        onClick={() => handleOpenCancelModal(selectedOrder.id, selectedOrder.orderNumber)}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          selectedOrder.status === "İptal Edildi"
                            ? "bg-rose-600 text-white border-rose-600 cursor-not-allowed opacity-90 shadow-xs"
                            : "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700"
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        {selectedOrder.status === "İptal Edildi" ? "İptal Edildi" : "Siparişi İptal Et"}
                      </button>
                    </div>
                  </div>

                  {/* Print Document Single Receipt */}
                  <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sipariş PDF Makbuzu</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Müşteri için yazdırılabilir fiş</p>
                    </div>
                    <button 
                      onClick={() => handlePrintSingleReceipt(selectedOrder)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Yazdır
                    </button>
                  </div>

                  {/* Order Fulfillment & Invoicing Widget */}
                  <OrderFulfillmentWidget order={selectedOrder} onComplete={refreshOrders} />

                </div>
              )}

              {/* TAB: ITEMS */}
              {activeDrawerTab === "items" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Sipariş Kalemleri (BOM & Ürünler)</p>
                  
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {parseOrderSummary(selectedOrder.summary, selectedOrder.amount).map((item, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Miktar: {item.quantity} Adet</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">₺{item.price.toLocaleString("tr-TR")} / adet</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: CLIENT */}
              {activeDrawerTab === "client" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* B2B Cari Details Card */}
                  <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Finans Analizi (B2B)</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                      <div>
                        <p className="text-[10px] text-slate-400">Cari Bakiye</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">₺18.500</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Risk Limiti</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">₺150.000</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Kullanılan Risk</p>
                        <p className="text-sm font-bold text-orange-600 mt-1">%12.3</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Vade Koşulu</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">30 Gün Cari</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Müşteri Kartı</p>
                    
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                      <div className="p-4 flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">{selectedOrder.email || "info@pekefe.com"}</span>
                      </div>
                      <div className="p-4 flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">{selectedOrder.phone || "+90 (555) 123 4567"}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: LOGISTIC */}
              {activeDrawerTab === "logistic" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* geleneksel lezzetler Lojistik */}
                  <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">geleneksel lezzetler Lojistik Paket Detayları</p>
                    
                    <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold">
                      {(() => {
                        const logDetails = calculateLogisticDetails(selectedOrder.summary);
                        return (
                          <>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <p className="text-[9px] text-slate-400 uppercase">Koli Sayısı</p>
                              <p className="text-base text-slate-800 mt-1">{logDetails.koli} Koli</p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <p className="text-[9px] text-slate-400 uppercase">Ağırlık</p>
                              <p className="text-base text-slate-800 mt-1">{logDetails.weight} kg</p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <p className="text-[9px] text-slate-400 uppercase">Desi</p>
                              <p className="text-base text-slate-800 mt-1">{logDetails.desi} Desi</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Kargo Info */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kargo Firması</p>
                    
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <Truck className="w-4 h-4 text-orange-500" />
                      <span>{selectedOrder.cargoCompany || "Henüz Belirlenmedi"}</span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: TIMELINE */}
              {activeDrawerTab === "timeline" && (
                <div className="p-4 border border-slate-200 rounded-xl bg-white animate-in fade-in duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Sipariş İşlem Tarihçesi</p>
                  
                  <div className="relative border-l border-slate-200 pl-5 ml-2.5 space-y-6">
                    {/* Step 3 */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white"><Check className="w-2.5 h-2.5" /></div>
                      <p className="text-xs font-bold text-slate-800">Sipariş Onaylandı & MRP Sürecine Alındı</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrder.date} 10:14</p>
                    </div>
                    {/* Step 2 */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white"><Check className="w-2.5 h-2.5" /></div>
                      <p className="text-xs font-bold text-slate-800">Ödeme Doğrulandı ({selectedOrder.method || "Kredi Kartı / Havale"})</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrder.date} 09:50</p>
                    </div>
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white"><Check className="w-2.5 h-2.5" /></div>
                      <p className="text-xs font-bold text-slate-800">Sipariş Alındı</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedOrder.date} 09:42</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 6. FLOATING YÜZEN AI OPERASYON ASİSTANI */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isAiOpen && (
          <div className="mb-3 w-80 sm:w-96 h-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">PEKEFE AI Lojistik Asistanı</span>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {aiMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${msg.role === "assistant" ? "bg-white border border-slate-200 text-slate-700" : "bg-orange-500 text-white ml-auto"}`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Preset Action commands */}
            <div className="px-3 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {[
                "Bugün neden satış düştü?",
                "En riskli bayileri göster.",
                "En çok satılan arıcı körüğü?"
              ].map(cmd => (
                <button 
                  key={cmd}
                  onClick={() => {
                    setAiInput(cmd);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200/50 cursor-pointer transition"
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAiCommand} className="p-3 border-t border-slate-150 bg-white flex gap-2">
              <input 
                type="text" 
                placeholder="Lojistik veya cari risk sorunuz..." 
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                className="flex-grow px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-orange-400 font-semibold"
              />
              <button 
                type="submit"
                className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors shadow-2xl cursor-pointer"
          title="Pekefe Lojistik AI Asistanı"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* 7. SİPARİŞ İPTAL ONAY MODALI */}
      {cancelModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (!isActionPending) {
              setCancelModal({ isOpen: false, orderId: null, orderNumber: null, isBulk: false, reason: "" });
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {cancelModal.isBulk ? "Toplu Sipariş İptali" : "Siparişi İptal Et"}
                </h3>
                <p className="text-xs text-slate-500">
                  {cancelModal.isBulk ? (
                    <strong className="text-slate-800">{cancelModal.orderNumber}</strong>
                  ) : (
                    <>
                      <strong className="text-slate-800">#{cancelModal.orderNumber}</strong> numaralı sipariş
                    </>
                  )}{" "}
                  iptal edilecek ve durumu <em>"İptal Edildi"</em> olarak güncellenecektir.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                İptal Sebebi <span className="text-slate-400 font-normal">(İsteğe Bağlı)</span>
              </label>
              <textarea
                value={cancelModal.reason}
                onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Örn: Müşteri talebi, stok yetersizliği, hatalı ödeme..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-rose-400 font-medium transition"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              ⚠️ İptal edilen sipariş için müşteriye otomatik e-posta bildirimi gönderilecek ve ilgili cari hesap hareketleri ters kayıtla dengelenecektir.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isActionPending}
                onClick={() => setCancelModal({ isOpen: false, orderId: null, orderNumber: null, isBulk: false, reason: "" })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isActionPending}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isActionPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>{cancelModal.isBulk ? "Seçilenleri İptal Et" : "İptali Onayla"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── PREMIUM ORDER FULFILLMENT & INVOICING WIDGET ──
function OrderFulfillmentWidget({ order, onComplete }: { order: any; onComplete: () => void }) {
  const [together, setTogether] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<string, { ship: number; invoice: number }>>({});
  const [waybills, setWaybills] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!order?.id) return;
    setLoading(true);
    getFulfillmentDetailsAction(order.id).then(res => {
      if (res.success && res.items) {
        setItems(res.items);
        setWaybills(res.waybills || []);
        setInvoices(res.invoices || []);
        
        const initial: Record<string, { ship: number; invoice: number }> = {};
        res.items.forEach((item: any) => {
          initial[item.productName] = {
            ship: item.orderedQty - item.shippedQty,
            invoice: item.orderedQty - item.invoicedQty,
          };
        });
        setQuantities(initial);
      }
      setLoading(false);
    });
  }, [order?.id]);

  const handleQtyChange = (name: string, field: "ship" | "invoice", value: number, max: number) => {
    const cleanVal = Math.max(0, Math.min(max, value));
    setQuantities(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: cleanVal,
      }
    }));
  };

  const handleFulfill = async () => {
    setSaving(true);
    const payloadItems = items.map(item => ({
      productName: item.productName,
      price: item.price,
      orderedQty: item.orderedQty,
      shipQty: quantities[item.productName]?.ship ?? 0,
      invoiceQty: quantities[item.productName]?.invoice ?? 0
    }));

    const res = await createInvoiceAndWaybillAction(order.id, together, payloadItems);
    setSaving(false);
    if (res.success) {
      toast.success("Belgeler başarıyla oluşturuldu.");
      onComplete();
    } else {
      const errMsg = "error" in res ? String(res.error) : "Belgeler oluşturulamadı.";
      toast.error(errMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs font-bold text-slate-400">Sevkiyat Bilgileri Yükleniyor...</span>
      </div>
    );
  }

  const isFullyFulfilled = items.length > 0 && items.every(i => i.shippedQty === i.orderedQty && i.invoicedQty === i.orderedQty);

  return (
    <div className="w-full rounded-2xl bg-[#0f172a] border border-slate-700/60 text-slate-100 shadow-2xl p-5 overflow-hidden relative">
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl" />
      
      <div className="flex justify-between items-center gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-black tracking-widest text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded flex items-center gap-1">
              Akıllı Sevkiyat
            </span>
          </div>
          <h4 className="text-sm font-black mt-1 text-white uppercase tracking-wider">Sevkiyat ve Faturalandırma</h4>
        </div>

        {!isFullyFulfilled && (
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300 pl-1.5">Birlikte Oluştur</span>
            <button
              type="button"
              onClick={() => setTogether(!together)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative outline-none ${
                together ? "bg-orange-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  together ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      <div className="my-4">
        {isFullyFulfilled ? (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-emerald-400">
              ✓ Bu siparişe ait tüm ürünlerin sevkiyatı ve faturalandırması tamamlanmıştır.
            </p>
          </div>
        ) : together ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              Kalan tüm ürünler için otomatik olarak <strong>1 adet Sevk İrsaliyesi</strong> ve <strong>1 adet e-Fatura</strong> eşzamanlı olarak oluşturulacaktır.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-1">Ürün</th>
                  <th className="py-2 px-1 text-center">Sipariş</th>
                  <th className="py-2 px-1 text-center">Sevk</th>
                  <th className="py-2 px-1 text-center">Fatura</th>
                  <th className="py-2 px-1 text-right w-20">Yeni Sevk</th>
                  <th className="py-2 px-1 text-right w-20">Yeni Fat.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {items.map(item => {
                  const remShip = item.orderedQty - item.shippedQty;
                  const remInv = item.orderedQty - item.invoicedQty;
                  return (
                    <tr key={item.productName} className="hover:bg-white/[0.03]">
                      <td className="py-2.5 px-1 font-bold text-slate-200 truncate max-w-[140px]">{item.productName}</td>
                      <td className="py-2.5 px-1 text-center text-slate-300 font-bold">{item.orderedQty}</td>
                      <td className="py-2.5 px-1 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${remShip > 0 ? "bg-orange-500/15 text-orange-400" : "bg-slate-800 text-slate-500"}`}>
                          {item.shippedQty}/{item.orderedQty}
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${remInv > 0 ? "bg-blue-500/15 text-blue-400" : "bg-slate-800 text-slate-500"}`}>
                          {item.invoicedQty}/{item.orderedQty}
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-right">
                        <input
                          type="number"
                          value={quantities[item.productName]?.ship ?? 0}
                          onChange={e => handleQtyChange(item.productName, "ship", parseInt(e.target.value) || 0, remShip)}
                          className="w-16 bg-slate-800 border border-slate-700 rounded py-1 px-1.5 text-right text-white font-bold text-sm outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="py-2.5 px-1 text-right">
                        <input
                          type="number"
                          value={quantities[item.productName]?.invoice ?? 0}
                          onChange={e => handleQtyChange(item.productName, "invoice", parseInt(e.target.value) || 0, remInv)}
                          className="w-16 bg-slate-800 border border-slate-700 rounded py-1 px-1.5 text-right text-white font-bold text-sm outline-none focus:border-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(waybills.length > 0 || invoices.length > 0) && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-black text-slate-300 uppercase tracking-wider">Oluşturulan Belgeler</p>
            <span className="text-[10px] text-slate-400 font-semibold italic">Belgeleri incelemek ve yazdırmak için yanlarındaki butonları kullanabilirsiniz.</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {waybills.map(w => (
              <div key={w.id} className="bg-slate-800/60 p-3 border border-slate-700 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                <span className="font-mono text-slate-200 font-black text-sm">{w.despatchNo}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-orange-500/15 text-orange-400 px-2 py-1 rounded font-black">İRSALİYE</span>
                  {/* PDF Print */}
                  <button
                    type="button"
                    onClick={() => window.open(`/api/despatch/${w.id}/pdf`, "_blank")}
                    className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-slate-700 rounded transition cursor-pointer"
                    title="İrsaliye PDF Görüntüle / Yazdır"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  {/* XML Download */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/despatch/${w.id}/xml`);
                        if (!res.ok) throw new Error("XML oluşturulamadı");
                        const xml = await res.text();
                        const blob = new Blob([xml], { type: "application/xml" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${w.despatchNo}_GIB_UBL.xml`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        toast.success("e-İrsaliye XML indirildi.");
                      } catch (e: any) {
                        toast.error("XML indirme hatası: " + e.message);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition cursor-pointer"
                    title="e-İrsaliye GİB XML İndir"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {invoices.map(inv => {
              const formattedNo = `FAT-${inv.date ? inv.date.substring(0, 10).replace(/-/g, '') : new Date().toISOString().substring(0,10).replace(/-/g,'')}`;
              return (
                <div key={inv.id} className="bg-slate-800/60 p-3 border border-slate-700 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-mono text-slate-200 font-black text-sm">{formattedNo}</span>
                    <span className="text-xs text-slate-400 font-semibold mt-0.5">Tutar: ₺{inv.totalAmount?.toLocaleString("tr-TR") || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-blue-500/15 text-blue-400 px-2 py-1 rounded font-black">FATURA</span>
                    <button
                      type="button"
                      onClick={() => window.open(`/api/integrations/efatura/pdf?id=${inv.id}`, "_blank")}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition cursor-pointer"
                      title="Görüntüle / PDF Yazdır"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isFullyFulfilled && (
        <div className="flex justify-between items-center pt-3 border-t border-slate-800 mt-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
            <span>Yasal süre: İrsaliyeden sonra 7 gündür.</span>
          </div>
          
          <button
            type="button"
            onClick={handleFulfill}
            disabled={saving}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-black rounded-lg text-sm flex items-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer"
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Belgeleri Oluştur</span>
          </button>
        </div>
      )}
    </div>
  );
}
