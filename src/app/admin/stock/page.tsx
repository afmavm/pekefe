"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PackageSearch,
  Settings2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Layers,
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  RefreshCw,
  FileDown,
  ExternalLink,
  TrendingUp,
  ArrowUpDown,
  Activity,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useProduct } from "@/context/ProductContext";
import { getProducts, STORAGE_KEY, saveProducts } from "@/utils/productsStorage";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import BulkProductImportModal from "./components/BulkProductImportModal";

function generateSlug(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTr(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

interface Ingredient {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

interface RecipeItem {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface StockLocationItem {
  id?: string;
  stock: number;
  warehouseId?: string;
  warehouse?: { name?: string; code?: string };
}

interface Product {
  id: string;
  name: string;
  slug?: string;
  sku: string;
  barcode?: string;
  stock: number;
  cost: number;
  price: number;
  sale_price?: number | null;
  list_price?: number | null;
  oldPrice?: number | null;
  b2b_base_price?: number | null;
  b2b_active?: boolean;
  active?: boolean;
  isPublished?: boolean;
  isDeleted?: boolean;
  isRawMaterial: boolean;
  category?: string;
  criticalLimit?: number;
  image?: string;
  images?: string[];
  desc?: string;
  seoTitle?: string;
  seoDesc?: string;
  recipe?: RecipeItem[];
  locations?: StockLocationItem[];
  variants?: any[];
  attributes?: any;
}

function parseAttributes(attrs: any): Record<string, any> {
  if (!attrs) return {};
  if (typeof attrs === "string") {
    try {
      return JSON.parse(attrs) || {};
    } catch {
      return {};
    }
  }
  return typeof attrs === "object" ? attrs : {};
}

function getEffectiveStock(p: Product): number {
  if (Array.isArray(p.locations) && p.locations.length > 0) {
    const locSum = p.locations.reduce((acc, loc) => acc + (Number(loc?.stock) || 0), 0);
    if (locSum > 0 || Number(p.stock || 0) === 0) {
      return locSum;
    }
  }
  return Number(p.stock) || 0;
}

function getWebPrice(p: Product): number {
  const attrs = parseAttributes(p.attributes);
  if (p.sale_price !== null && p.sale_price !== undefined) {
    return Number(p.sale_price) || 0;
  }
  return Number(p.price || attrs.webPrice || attrs.salePrice || 0) || 0;
}

function getPrimaryImage(p: Product): string {
  if (p.image && typeof p.image === "string" && p.image.trim() !== "") return p.image.trim();
  if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === "string") {
    return p.images[0].trim();
  }
  return "";
}

export default function StockProductionPage() {
  const router = useRouter();
  const { refreshProducts, refreshCategories } = useProduct();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"URUNLER" | "KATEGORILER">("URUNLER");
  const [searchTerm, setSearchTerm] = useState("");
  const [priceDisplayMode, setPriceDisplayMode] = useState<"all" | "web" | "b2b" | "retail">("all");

  // Advanced Filters & Sorting
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "CRITICAL" | "OUT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "DRAFT">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PRODUCT" | "RAW">("ALL");
  const [sortBy, setSortBy] = useState<"DEFAULT" | "NAME_ASC" | "STOCK_ASC" | "STOCK_DESC" | "PRICE_DESC" | "PRICE_ASC">("DEFAULT");

  // Selection, Export & UI States
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  // Category Tree Toggle State
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Category CRUD Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parentId: "",
  });

  // Quick Stock & Price Update Modal States
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockQty, setQuickStockQty] = useState<string | number>(0);
  const [quickCriticalLimit, setQuickCriticalLimit] = useState<string | number>(5);
  const [quickCost, setQuickCost] = useState<string | number>(0);
  const [quickPrice, setQuickPrice] = useState<string | number>(0);
  const [isSavingQuickStock, setIsSavingQuickStock] = useState(false);

  // Bulk Product Import Modal State
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  // Close export dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target as Node)) {
        setIsExcelDropdownOpen(false);
        setIsPdfDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const dbProducts = Array.isArray(data) ? data : [];
        const localProds = getProducts() || [];

        // Strict Deduplication + Exclude soft-deleted products
        const seenIds = new Set<string>();
        const seenSkus = new Set<string>();
        const finalProducts: Product[] = [];

        for (const p of dbProducts) {
          if (!p || p.isDeleted === true) continue;
          const cleanId = String(p.id || "").trim().toLowerCase();
          const cleanSku = String(p.sku || "").trim().toLowerCase();
          if (cleanId) seenIds.add(cleanId);
          if (cleanSku) seenSkus.add(cleanSku);
          finalProducts.push(p);
        }

        for (const p of localProds) {
          if (!p || p.isDeleted === true) continue;
          const cleanId = String(p.id || "").trim().toLowerCase();
          const cleanSku = String(p.sku || "").trim().toLowerCase();
          const isDuplicate = (cleanId && seenIds.has(cleanId)) || (cleanSku && seenSkus.has(cleanSku));
          if (!isDuplicate) {
            if (cleanId) seenIds.add(cleanId);
            if (cleanSku) seenSkus.add(cleanSku);
            finalProducts.push(p);
          }
        }

        setProducts(finalProducts);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));
          } catch {}
        }
      } else {
        setProducts((getProducts() || []).filter((p: any) => p && p.isDeleted !== true));
      }

      const catRes = await fetch(`/api/categories?t=${Date.now()}`, { cache: "no-store" });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);

        const initialExpanded: Record<string, boolean> = {};
        if (Array.isArray(catData)) {
          catData.forEach((c: any) => {
            if (!c.parentId) {
              initialExpanded[c.id] = true;
            }
          });
        }
        setExpandedCategories(initialExpanded);
      }
    } catch {
      setProducts((getProducts() || []).filter((p: any) => p && p.isDeleted !== true));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleProductChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadData();
      }, 500);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pekefe_products_changed", handleProductChange);
      window.addEventListener("pekefe_products_updated", handleProductChange);
      window.addEventListener("pekefe_search_index_updated", handleProductChange);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("pekefe_products_changed", handleProductChange);
        window.removeEventListener("pekefe_products_updated", handleProductChange);
        window.removeEventListener("pekefe_search_index_updated", handleProductChange);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && products.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const searchSku = params.get("search");
      if (searchSku) {
        setSearchTerm(searchSku);
        const foundProduct = products.find((p) => p.sku === searchSku);
        if (foundProduct) {
          openQuickStockModal(foundProduct);
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("search");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [products]);

  const openQuickStockModal = (product: Product) => {
    setQuickStockProduct(product);
    setQuickStockQty(getEffectiveStock(product));
    setQuickCriticalLimit(Number(product.criticalLimit ?? 5));
    setQuickCost(Number(product.cost ?? 0));
    setQuickPrice(getWebPrice(product));
  };

  const handleSaveQuickStock = async () => {
    if (!quickStockProduct) return;

    const targetId = encodeURIComponent(String(quickStockProduct.id || quickStockProduct.sku || ""));
    const newQty = Math.max(0, Math.round(Number(quickStockQty) || 0));
    const newCritical = Math.max(0, Math.round(Number(quickCriticalLimit) || 0));
    const newCost = Math.max(0, Number(quickCost) || 0);
    const newPrice = Math.max(0, Number(quickPrice) || 0);

    setIsSavingQuickStock(true);

    // 1. Optimistic local state & localStorage update
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p && (p.id === quickStockProduct.id || p.sku === quickStockProduct.sku)
          ? {
              ...p,
              stock: newQty,
              criticalLimit: newCritical,
              cost: newCost,
              ...(p.isRawMaterial ? {} : { price: newPrice, sale_price: newPrice }),
            }
          : p
      );
      try {
        saveProducts(updated);
      } catch {}
      return updated;
    });

    // 2. Database & JSON sync via PATCH (records StockTransaction ADJUSTMENT & updates StockLocation)
    try {
      const payload: Record<string, any> = {
        stock: newQty,
        stock_quantity: newQty,
        criticalLimit: newCritical,
        cost: newCost,
      };
      if (!quickStockProduct.isRawMaterial) {
        payload.price = newPrice;
        payload.sale_price = newPrice;
      }

      const res = await fetch(`/api/products/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Stok ve fiyat bilgileri başarıyla güncellendi.");
        await refreshProducts();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Güncelleme sırasında sunucu hatası oluştu.");
      }
      await loadData();
    } catch (err) {
      console.warn("Background DB stock sync notice:", err);
      toast.error("Sunucuya bağlanılamadı.");
      await loadData();
    } finally {
      setIsSavingQuickStock(false);
      setQuickStockProduct(null);
    }
  };

  // KPI Metrics (aligned with /admin dashboard valuation logic)
  const kpiStats = useMemo(() => {
    let totalUnits = 0;
    let totalValue = 0;
    let liveCount = 0;
    let draftCount = 0;
    let criticalCount = 0;
    let outOfStockCount = 0;
    let rawCount = 0;

    for (const p of products) {
      const qty = getEffectiveStock(p);
      const limit = Number(p.criticalLimit ?? 10) || 10;
      const unitVal = Number(p.cost || 0) > 0 ? Number(p.cost) : getWebPrice(p);
      totalUnits += qty;
      totalValue += qty * unitVal;

      if (p.isRawMaterial) rawCount++;
      const isLive = p.active !== false && p.isDeleted !== true;
      if (isLive) liveCount++;
      else draftCount++;

      if (qty <= 0) outOfStockCount++;
      else if (qty <= limit) criticalCount++;
    }

    return {
      totalProducts: products.length,
      totalUnits,
      totalValue,
      liveCount,
      draftCount,
      criticalCount,
      outOfStockCount,
      alertTotal: criticalCount + outOfStockCount,
      rawCount,
      finishedCount: products.length - rawCount,
    };
  }, [products]);

  // Unique category options for filter dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    categories.forEach((c) => {
      if (c?.name && String(c.name).trim()) set.add(String(c.name).trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [products, categories]);

  // Product count per category name (normalized)
  const categoryProductCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const key = normalizeTr(p.category || "Genel");
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [products]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    categoryFilter !== "ALL" ||
    stockFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    sortBy !== "DEFAULT";

  const resetAllFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setStockFilter("ALL");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSortBy("DEFAULT");
  };

  // Filtered & Sorted Products
  const filteredAllProducts = useMemo(() => {
    const q = normalizeTr(searchTerm);

    const list = products.filter((p) => {
      if (q) {
        const matchName = normalizeTr(p.name || "").includes(q);
        const matchSku = normalizeTr(p.sku || "").includes(q);
        const matchCat = normalizeTr(p.category || "").includes(q);
        const matchBarcode = normalizeTr(p.barcode || "").includes(q);
        if (!matchName && !matchSku && !matchCat && !matchBarcode) return false;
      }

      if (categoryFilter !== "ALL") {
        if (normalizeTr(p.category || "") !== normalizeTr(categoryFilter)) return false;
      }

      const qty = getEffectiveStock(p);
      const limit = Number(p.criticalLimit ?? 10) || 10;
      if (stockFilter === "OUT" && qty > 0) return false;
      if (stockFilter === "CRITICAL" && !(qty > 0 && qty <= limit)) return false;
      if (stockFilter === "IN_STOCK" && qty <= 0) return false;

      const isLive = p.active !== false && p.isDeleted !== true;
      if (statusFilter === "LIVE" && !isLive) return false;
      if (statusFilter === "DRAFT" && isLive) return false;

      if (typeFilter === "PRODUCT" && p.isRawMaterial) return false;
      if (typeFilter === "RAW" && !p.isRawMaterial) return false;

      return true;
    });

    if (sortBy === "DEFAULT") return list;

    return [...list].sort((a, b) => {
      if (sortBy === "NAME_ASC") return (a.name || "").localeCompare(b.name || "", "tr");
      if (sortBy === "STOCK_ASC") return getEffectiveStock(a) - getEffectiveStock(b);
      if (sortBy === "STOCK_DESC") return getEffectiveStock(b) - getEffectiveStock(a);
      if (sortBy === "PRICE_ASC") return getWebPrice(a) - getWebPrice(b);
      if (sortBy === "PRICE_DESC") return getWebPrice(b) - getWebPrice(a);
      return 0;
    });
  }, [products, searchTerm, categoryFilter, stockFilter, statusFilter, typeFilter, sortBy]);

  // Filtered Categories when on KATEGORILER tab
  const filteredCategories = useMemo(() => {
    const q = normalizeTr(searchTerm);
    if (!q) return categories;
    return categories.filter(
      (c) => normalizeTr(c.name || "").includes(q) || normalizeTr(String(c.id || "")).includes(q)
    );
  }, [categories, searchTerm]);

  // Turkish character mapping helper for PDF encoding
  const trToEng = (text: string): string => {
    if (!text) return "";
    return text
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

  // Export products list to Excel file
  const handleExportExcel = (mode: "selected" | "all") => {
    try {
      const targetProducts =
        mode === "selected"
          ? filteredAllProducts.filter((p) => selectedRows.has(p.id))
          : filteredAllProducts;

      if (targetProducts.length === 0) {
        toast.error("Aktarılacak ürün bulunamadı. Lütfen önce ürün seçtiğinizden emin olun.");
        return;
      }

      const exportData = targetProducts.map((p) => ({
        "Ürün Adı": p.name || "",
        "Stok Kodu (SKU)": p.sku || "",
        "Kategori": p.category || "Genel",
        "Maliyet (TL)": Number(p.cost || 0),
        "Web Satış Fiyatı (TL)": p.isRawMaterial ? "—" : getWebPrice(p),
        "Mevcut Stok": getEffectiveStock(p),
        "Kritik Limit": Number(p.criticalLimit || 0),
        "Tip": p.isRawMaterial ? "Hammadde" : "Mamul",
        "Durum": p.active !== false ? "Yayında" : "Taslak",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");

      const fileSuffix = mode === "selected" ? "Secilenler" : "Tumunu";
      XLSX.writeFile(workbook, `PEKEFE_Urun_Listesi_${fileSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel listesi başarıyla indirildi.");
      setIsExcelDropdownOpen(false);
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Excel dışa aktarma sırasında hata oluştu.");
    }
  };

  // Export products list to PDF file
  const handleExportPdf = (mode: "selected" | "all") => {
    try {
      const targetProducts =
        mode === "selected"
          ? filteredAllProducts.filter((p) => selectedRows.has(p.id))
          : filteredAllProducts;

      if (targetProducts.length === 0) {
        toast.error("Aktarılacak ürün bulunamadı. Lütfen önce ürün seçtiğinizden emin olun.");
        return;
      }

      const doc = new jsPDF();

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.text("PEKEFE Ispir Yoresel Urunler - URUN KATALOGU", 14, 15);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}`, 14, 22);
      doc.text(`Toplam Urun Sayisi: ${targetProducts.length}`, 14, 27);

      const headers = [["Urun Adi", "SKU", "Kategori", "Maliyet", "Fiyat", "Stok", "Tip"]];
      const rows = targetProducts.map((p) => [
        trToEng(p.name || ""),
        trToEng(p.sku || ""),
        trToEng(p.category || "Genel"),
        `TL ${(Number(p.cost) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        p.isRawMaterial
          ? "-"
          : `TL ${getWebPrice(p).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        getEffectiveStock(p).toLocaleString("tr-TR"),
        p.isRawMaterial ? "Hammadde" : "Mamul",
      ]);

      autoTable(doc, {
        startY: 32,
        head: headers,
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [107, 29, 47] }, // PEKEFE Burgundy (#6b1d2f)
        styles: { font: "Helvetica", fontSize: 9 },
      });

      const fileSuffix = mode === "selected" ? "Secilenler" : "Tumunu";
      doc.save(`PEKEFE_Urun_Listesi_${fileSuffix}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF listesi başarıyla indirildi.");
      setIsPdfDropdownOpen(false);
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF dışa aktarma sırasında hata oluştu.");
    }
  };

  // Product Navigation
  const openAddProductModal = () => {
    router.push("/admin/stock/form");
  };

  const handleDeleteProduct = async (id: string, name?: string) => {
    if (!confirm(`"${name || id}" ürününü silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Ürün başarıyla silindi.");
        setProducts((prev) => {
          const updated = prev.filter((p) => String(p.id) !== String(id) && String(p.sku) !== String(id));
          saveProducts(updated);
          return updated;
        });
        setSelectedRows((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        await refreshProducts();
        await refreshCategories();
        await loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Ürün silinemedi.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) return;
    if (!confirm(`Seçili ${selectedIds.length} adet ürünü kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    setIsBulkDeleting(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const prod = products.find((p) => p.id === id);
        if (!prod) continue;
        const res = await fetch(`/api/products/${encodeURIComponent(prod.id || prod.sku)}`, {
          method: "DELETE",
        });
        if (res.ok) successCount++;
      } catch {}
    }

    setProducts((prev) => {
      const updated = prev.filter((p) => !selectedRows.has(p.id));
      saveProducts(updated);
      return updated;
    });

    toast.success(`${successCount} adet ürün silindi.`);
    setSelectedRows(new Set());
    await refreshProducts();
    await refreshCategories();
    await loadData();
    setIsBulkDeleting(false);
  };

  // Fast 1-click Toggle Publish Status
  const handleToggleProductStatus = async (product: Product) => {
    const currentActive = product.active !== false && product.isDeleted !== true;
    const newActive = !currentActive;

    setTogglingProductId(product.id);

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === product.id || p.sku === product.sku) {
          return { ...p, active: newActive, isPublished: newActive };
        }
        return p;
      });
      saveProducts(updated);
      return updated;
    });

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.id || product.sku)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive, isPublished: newActive }),
      });

      if (res.ok) {
        toast.success(newActive ? `"${product.name}" yayına alındı.` : `"${product.name}" yayından kaldırıldı (Taslak).`);
        await refreshProducts();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Durum güncellenirken hata oluştu.");
        await loadData();
      }
    } catch (err) {
      console.error("Toggle error:", err);
      toast.error("Bağlantı hatası.");
      await loadData();
    } finally {
      setTogglingProductId(null);
    }
  };

  // Bulk Publish / Unpublish
  const handleBulkToggleStatus = async (publish: boolean) => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length === 0) return;

    setLoading(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const prod = products.find((p) => p.id === id);
        if (!prod) continue;
        const res = await fetch(`/api/products/${encodeURIComponent(prod.id || prod.sku)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: publish, isPublished: publish }),
        });
        if (res.ok) successCount++;
      } catch {}
    }

    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (selectedRows.has(p.id)) {
          return { ...p, active: publish, isPublished: publish };
        }
        return p;
      });
      saveProducts(updated);
      return updated;
    });

    toast.success(`${successCount} adet ürün ${publish ? "yayına alındı" : "yayından kaldırıldı"}.`);
    setSelectedRows(new Set());
    await refreshProducts();
    await loadData();
    setLoading(false);
  };

  // Category CRUD
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", parentId: "" });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, parentId: cat.parentId || "" });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Kategori adı gerekli.");
      return;
    }

    try {
      const url = "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      const payload = editingCategory
        ? { id: editingCategory.id, ...categoryForm }
        : categoryForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingCategory ? "Kategori başarıyla güncellendi." : "Kategori başarıyla oluşturuldu.");
        setIsCategoryModalOpen(false);
        if (typeof refreshCategories === "function") {
          await refreshCategories();
        }
        router.refresh();
        await loadData();
      } else {
        toast.error(data.error || "Kategori kaydedilemedi.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Kategori başarıyla silindi.");
        setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
        if (typeof refreshCategories === "function") {
          await refreshCategories();
        }
        router.refresh();
        await loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Kategori silinemedi.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    }
  };

  const toggleAllCategoriesExpand = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    categories.forEach((c) => {
      next[c.id] = expand;
    });
    setExpandedCategories(next);
  };

  // Category Hierarchy recursive renderer
  const renderCategoryTree = (parentId: string | null = null, depth = 0) => {
    const isSearching = searchTerm.trim() !== "";
    const sourceList = isSearching ? filteredCategories : categories;

    if (isSearching && depth === 0) {
      if (sourceList.length === 0) {
        return (
          <div className="py-8 text-center text-xs font-semibold text-slate-400">
            &ldquo;{searchTerm}&rdquo; aramasına uygun kategori bulunamadı.
          </div>
        );
      }
      return (
        <div className="space-y-2">
          {sourceList.map((cat) => {
            const prodCount = categoryProductCounts[normalizeTr(cat.name || "")] || 0;
            return (
              <div
                key={cat.id}
                className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-2 h-2 bg-[#6b1d2f] rounded-full" />
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{cat.name}</span>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/70">
                    {prodCount} ürün
                  </span>
                  <span className="text-[9px] font-mono bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                    ID: {cat.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const isRoot = parentId === null || parentId === "" || parentId === undefined;
    const list = sourceList.filter((c) => {
      if (isRoot) {
        return !c.parentId || c.parentId === "" || c.parentId === null;
      }
      return String(c.parentId) === String(parentId);
    });

    if (list.length === 0) {
      if (isRoot && sourceList.length > 0) {
        return (
          <div className="space-y-2">
            {sourceList.map((cat) => {
              const prodCount = categoryProductCounts[normalizeTr(cat.name || "")] || 0;
              return (
                <div
                  key={cat.id}
                  className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow transition-all"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#6b1d2f] rounded-full" />
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">{cat.name}</span>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/70">
                      {prodCount} ürün
                    </span>
                    <span className="text-[9px] font-mono bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded border border-slate-100">
                      ID: {cat.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditCategoryModal(cat)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      return null;
    }

    return (
      <div className={`space-y-1.5 ${depth > 0 ? "pl-6 border-l border-slate-200 mt-1.5" : ""}`}>
        {list.map((cat) => {
          const hasChildren = sourceList.some((c) => c.parentId && String(c.parentId) === String(cat.id));
          const isExpanded = !!expandedCategories[cat.id];
          const prodCount = categoryProductCounts[normalizeTr(cat.name || "")] || 0;

          return (
            <div key={cat.id} className="space-y-1">
              <div className="flex justify-between items-center bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-sm hover:shadow transition-all">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setExpandedCategories((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-5.5 h-5.5 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-[#6b1d2f] rounded-full" />
                    </div>
                  )}
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{cat.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat.name);
                      setActiveTab("URUNLER");
                    }}
                    className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/70 transition cursor-pointer"
                    title="Bu kategorideki ürünleri listele"
                  >
                    {prodCount} ürün
                  </button>
                  <span className="text-[9px] font-mono bg-[#6b1d2f]/10 text-[#6b1d2f] px-1.5 py-0.5 rounded border border-[#6b1d2f]/20 font-semibold">
                    ID: {cat.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {hasChildren && isExpanded && renderCategoryTree(cat.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <PackageSearch className="w-6 h-6 text-[#6b1d2f]" /> Ürün Kataloğu &amp; Kategori Yönetimi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            PEKEFE İspir doğal ürün kataloğunu, depo stoklarını, fiyatlandırmayı ve kategori hiyerarşisini tek panelden yönetin.
          </p>
        </div>

        {/* Quick Inventory Sub-Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/inventory/stock-status"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#6b1d2f]" /> Depo Stok Durumu
          </Link>
          <Link
            href="/admin/inventory/movements"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-[#b45309]" /> Stok Hareketleri
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("URUNLER");
            setStockFilter("ALL");
            setStatusFilter("ALL");
          }}
          className="text-left bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-[#6b1d2f]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Toplam Ürün</span>
            <div className="w-8 h-8 rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{kpiStats.totalProducts}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="text-emerald-600 font-bold">{kpiStats.liveCount} Yayında</span> · {kpiStats.draftCount} Taslak
          </p>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Toplam Stok Değeri</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#b45309] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {kpiStats.totalValue.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Toplam <span className="font-bold text-slate-700">{kpiStats.totalUnits.toLocaleString("tr-TR")}</span> adet stok
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab("URUNLER");
            setStockFilter(stockFilter === "CRITICAL" ? "OUT" : "CRITICAL");
          }}
          className={`text-left rounded-2xl border p-4 shadow-2xs transition cursor-pointer ${
            kpiStats.alertTotal > 0
              ? "bg-rose-50/40 border-rose-200 hover:border-rose-300"
              : "bg-white border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kritik / Tükenen</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              kpiStats.alertTotal > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${kpiStats.alertTotal > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {kpiStats.alertTotal}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="text-rose-600 font-bold">{kpiStats.outOfStockCount} Tükenen</span> · {kpiStats.criticalCount} Kritik
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("KATEGORILER")}
          className="text-left bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-[#6b1d2f]/40 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategoriler</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{categories.length}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {kpiStats.finishedCount} Mamul · {kpiStats.rawCount} Hammadde
          </p>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Bar: Tabs + Export + Bulk + Search */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between gap-3.5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "URUNLER", label: "Ürün Kartları", icon: Package, count: products.length },
              { id: "KATEGORILER", label: "Kategoriler", icon: Settings2, count: categories.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "URUNLER" | "KATEGORILER")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#6b1d2f] text-white border-[#6b1d2f] shadow-xs"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                    activeTab === tab.id ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2" ref={dropdownContainerRef}>
            {activeTab === "URUNLER" && (
              <>
                {/* Excel Export Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExcelDropdownOpen(!isExcelDropdownOpen);
                      setIsPdfDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" /> Excel İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isExcelDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-56 z-40">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportExcel("selected");
                          setIsExcelDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        Seçilenleri Excel&apos;e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportExcel("all");
                          setIsExcelDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Filtrelenenleri Aktar ({filteredAllProducts.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* PDF Export Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPdfDropdownOpen(!isPdfDropdownOpen);
                      setIsExcelDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" /> PDF İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isPdfDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-56 z-40">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportPdf("selected");
                          setIsPdfDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        Seçilenleri PDF&apos;e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleExportPdf("all");
                          setIsPdfDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Filtrelenenleri Aktar ({filteredAllProducts.length})
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === "URUNLER" ? "Ürün adı, SKU, barkod, kategori..." : "Kategori ara..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px] pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#6b1d2f]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Aramayı temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {activeTab === "URUNLER" && selectedRows.size > 0 && (
          <div className="px-5 py-3 bg-[#6b1d2f]/5 border-b border-[#6b1d2f]/15 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#6b1d2f]">
              <CheckCircle2 className="w-4 h-4" />
              <span>{selectedRows.size} ürün seçildi</span>
              <button
                type="button"
                onClick={() => setSelectedRows(new Set())}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                Seçimi Temizle
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkToggleStatus(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Toplu Yayına Al
              </button>
              <button
                type="button"
                onClick={() => handleBulkToggleStatus(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Yayından Kaldır
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Toplu Sil
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#6b1d2f]" />
            <p className="text-sm text-slate-400 font-semibold">Katalog Verileri Yükleniyor...</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            {/* URUNLER TAB */}
            {activeTab === "URUNLER" && (
              <div className="space-y-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3.5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Sistem Ürün Kataloğu</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {filteredAllProducts.length} / {products.length} ürün gösteriliyor
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Fiyat Gösterim Modu Seçici */}
                    <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                      {[
                        { id: "all", label: "Tüm Fiyatlar", activeClass: "bg-white text-[#6b1d2f] shadow-2xs" },
                        { id: "web", label: "Web", activeClass: "bg-emerald-600 text-white shadow-2xs" },
                        { id: "b2b", label: "B2B", activeClass: "bg-blue-600 text-white shadow-2xs" },
                        { id: "retail", label: "Perakende", activeClass: "bg-purple-600 text-white shadow-2xs" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPriceDisplayMode(mode.id as any)}
                          className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            priceDisplayMode === mode.id
                              ? mode.activeClass
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsBulkImportModalOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#b45309] border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Excel veya CSV ile toplu ürün yükleyin"
                    >
                      <UploadCloud className="w-4 h-4 text-[#b45309]" /> TOPLU ÜRÜN EKLE
                    </button>

                    <button
                      onClick={openAddProductModal}
                      className="px-4 py-2.5 rounded-xl bg-[#6b1d2f] hover:bg-[#541624] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> YENİ ÜRÜN EKLE
                    </button>
                  </div>
                </div>

                {/* Filter & Sort Toolbar */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#6b1d2f] cursor-pointer"
                  >
                    <option value="ALL">Tüm Kategoriler</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#6b1d2f] cursor-pointer"
                  >
                    <option value="ALL">Tüm Stoklar</option>
                    <option value="IN_STOCK">Stokta Olanlar</option>
                    <option value="CRITICAL">Kritik Stok</option>
                    <option value="OUT">Tükenen (0)</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#6b1d2f] cursor-pointer"
                  >
                    <option value="ALL">Tüm Durumlar</option>
                    <option value="LIVE">Yayında</option>
                    <option value="DRAFT">Taslak</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#6b1d2f] cursor-pointer"
                  >
                    <option value="ALL">Tüm Tipler</option>
                    <option value="PRODUCT">Mamul</option>
                    <option value="RAW">Hammadde</option>
                  </select>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#6b1d2f] cursor-pointer"
                    >
                      <option value="DEFAULT">Sıralama: Varsayılan</option>
                      <option value="NAME_ASC">Ada Göre (A-Z)</option>
                      <option value="STOCK_ASC">Stok (Azdan Çoğa)</option>
                      <option value="STOCK_DESC">Stok (Çoktan Aza)</option>
                      <option value="PRICE_DESC">Fiyat (Yüksekten Düşüğe)</option>
                      <option value="PRICE_ASC">Fiyat (Düşükten Yükseğe)</option>
                    </select>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
                        title="Tüm filtreleri sıfırla"
                      >
                        <RotateCcw className="w-3 h-3" /> Sıfırla
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Table */}
                <div className="overflow-x-auto border border-slate-200/90 rounded-2xl shadow-2xs bg-white">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-bold tracking-wider uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredAllProducts.length > 0 &&
                              filteredAllProducts.every((p) => selectedRows.has(p.id))
                            }
                            onChange={() => {
                              const allSelected =
                                filteredAllProducts.length > 0 &&
                                filteredAllProducts.every((p) => selectedRows.has(p.id));
                              setSelectedRows((prev) => {
                                const next = new Set(prev);
                                if (allSelected) {
                                  filteredAllProducts.forEach((p) => next.delete(p.id));
                                } else {
                                  filteredAllProducts.forEach((p) => next.add(p.id));
                                }
                                return next;
                              });
                            }}
                            className="rounded border-slate-300 text-[#6b1d2f] focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-3.5 w-10 text-center text-slate-400">#</th>
                        <th className="px-3 py-3.5 w-16 text-center">Görsel</th>
                        <th className="px-4 py-3.5 min-w-[230px]">Ürün Bilgisi</th>
                        <th className="px-4 py-3.5 w-36 text-center">Kategori</th>
                        <th className="px-4 py-3.5 min-w-[220px]">Maliyet / Fiyat &amp; Kar</th>
                        <th className="px-4 py-3.5 w-32 text-center">Mevcut Stok</th>
                        <th className="px-4 py-3.5 w-24 text-center">Tip</th>
                        <th className="px-4 py-3.5 w-44 text-center">Yayın Durumu</th>
                        <th className="px-4 py-3.5 w-32 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAllProducts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-12 text-center">
                            <p className="text-xs font-semibold text-slate-400">
                              Arama ve filtre kriterlerine uygun ürün bulunamadı.
                            </p>
                            {hasActiveFilters && (
                              <button
                                type="button"
                                onClick={resetAllFilters}
                                className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                              >
                                Filtreleri Temizle
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredAllProducts.map((p, index) => {
                          const effectiveStock = getEffectiveStock(p);
                          const criticalLimit = Number(p.criticalLimit ?? 10) || 10;
                          const isOutOfStock = effectiveStock <= 0;
                          const isLowStock = !isOutOfStock && effectiveStock <= criticalLimit;
                          const isLive = p.active !== false && p.isDeleted !== true;
                          const isSelected = selectedRows.has(p.id);
                          const imgSrc = getPrimaryImage(p);
                          const showImg = !!imgSrc && !failedImageIds.has(p.id);
                          const productSlug = p.slug || generateSlug(p.name || "");

                          return (
                            <tr
                              key={p.id}
                              className={`transition-colors duration-150 ${
                                isSelected
                                  ? "bg-[#6b1d2f]/5"
                                  : isLive
                                    ? "hover:bg-slate-50/80"
                                    : "bg-slate-50/40 hover:bg-slate-100/50"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="px-4 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedRows((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(p.id)) next.delete(p.id);
                                      else next.add(p.id);
                                      return next;
                                    });
                                  }}
                                  className="rounded border-slate-300 text-[#6b1d2f] focus:ring-0 cursor-pointer"
                                />
                              </td>

                              {/* Index */}
                              <td className="px-3 py-3.5 text-center text-xs font-semibold text-slate-400">
                                {index + 1}
                              </td>

                              {/* Image (resilient img with graceful fallback) */}
                              <td className="px-3 py-3.5 text-center">
                                {showImg ? (
                                  <div className="w-11 h-11 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shadow-2xs">
                                    <img
                                      src={imgSrc}
                                      alt={p.name || "Ürün"}
                                      loading="lazy"
                                      onError={() =>
                                        setFailedImageIds((prev) => {
                                          const next = new Set(prev);
                                          next.add(p.id);
                                          return next;
                                        })
                                      }
                                      className="w-full h-full object-contain p-0.5"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-[#6b1d2f]/10 to-amber-400/20 border border-amber-200/60 flex items-center justify-center font-black text-[#6b1d2f] text-sm select-none shadow-2xs">
                                    {(p.name || "P").charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </td>

                              {/* Product Name & SKU */}
                              <td className="px-4 py-3.5">
                                <Link
                                  href={`/admin/stock/form?slug=${productSlug}&id=${encodeURIComponent(p.id)}&sku=${encodeURIComponent(p.sku || "")}`}
                                  prefetch={false}
                                  className="font-bold text-slate-900 text-sm hover:text-[#6b1d2f] transition-colors block max-w-[280px] truncate"
                                  title={p.name}
                                >
                                  {p.name}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                                    SKU: {p.sku}
                                  </span>
                                  {Array.isArray(p.variants) && p.variants.length > 0 && (
                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/70">
                                      {p.variants.length} Varyant
                                    </span>
                                  )}
                                  {!isLive && (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      Taslak
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="px-4 py-3.5 text-center">
                                <span className="inline-block px-2.5 py-1 bg-slate-100/80 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200/70 max-w-[140px] truncate">
                                  {p.category || "Genel"}
                                </span>
                              </td>

                              {/* Pricing + Margin */}
                              <td className="px-4 py-3.5">
                                {p.isRawMaterial ? (
                                  <div className="text-xs font-semibold text-slate-500">
                                    <p>
                                      <span className="text-slate-400">Maliyet:</span>{" "}
                                      {(Number(p.cost) || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                    </p>
                                    <span className="text-[10px] text-slate-400 font-normal italic">Dahili Hammadde</span>
                                  </div>
                                ) : (() => {
                                  const cost = Number(p.cost || 0);
                                  const attrs = parseAttributes(p.attributes);
                                  const webPrice = getWebPrice(p);

                                  const rawB2b =
                                    p.b2b_base_price ?? attrs.b2bPrice ?? (p.variants && p.variants[0]?.b2bPrice);
                                  const b2bPrice =
                                    rawB2b !== null && rawB2b !== undefined && rawB2b !== ""
                                      ? Number(rawB2b)
                                      : null;

                                  const retailPrice = Number(
                                    attrs.retailPrice !== undefined &&
                                      attrs.retailPrice !== null &&
                                      attrs.retailPrice !== ""
                                      ? attrs.retailPrice
                                      : p.price || webPrice
                                  );

                                  const marginPct =
                                    webPrice > 0 && cost > 0 ? Math.round(((webPrice - cost) / webPrice) * 100) : null;

                                  return (
                                    <div className="text-xs space-y-1">
                                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                        <span>
                                          Maliyet:{" "}
                                          <span className="font-semibold text-slate-600">
                                            {cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                          </span>
                                        </span>
                                        {marginPct !== null && (
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border ${
                                              marginPct >= 30
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : marginPct >= 10
                                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                                  : "bg-rose-50 text-rose-700 border-rose-200"
                                            }`}
                                          >
                                            %{marginPct} Kâr
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {(priceDisplayMode === "web" || priceDisplayMode === "all") && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                                            <span className="text-[8px] font-bold uppercase opacity-70">Web:</span>
                                            {webPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                          </span>
                                        )}

                                        {(priceDisplayMode === "b2b" || priceDisplayMode === "all") && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
                                            <span className="text-[8px] font-bold uppercase opacity-70">B2B:</span>
                                            {(b2bPrice !== null ? b2bPrice : webPrice).toLocaleString("tr-TR", {
                                              minimumFractionDigits: 2,
                                            })}{" "}
                                            ₺
                                          </span>
                                        )}

                                        {(priceDisplayMode === "retail" || priceDisplayMode === "all") && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/70">
                                            <span className="text-[8px] font-bold uppercase opacity-70">Perakende:</span>
                                            {retailPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Stok */}
                              <td className="px-4 py-3.5 text-center">
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <div className="inline-flex items-center gap-1">
                                    <span
                                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                                        isOutOfStock
                                          ? "text-rose-700 bg-rose-50 border-rose-300"
                                          : isLowStock
                                            ? "text-amber-700 bg-amber-50 border-amber-300"
                                            : "text-slate-800 bg-slate-50 border-slate-200"
                                      }`}
                                    >
                                      {effectiveStock.toLocaleString("tr-TR")}
                                    </span>
                                    <button
                                      onClick={() => openQuickStockModal(p)}
                                      className="p-1 hover:bg-slate-200/70 text-slate-400 hover:text-[#6b1d2f] rounded-md transition border border-slate-200 bg-slate-50 cursor-pointer"
                                      title="Stok ve Fiyatı Hızlı Güncelle"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {isOutOfStock ? "Tükendi" : `Limit: ${p.criticalLimit || 0}`}
                                  </span>
                                </div>
                              </td>

                              {/* Tip */}
                              <td className="px-4 py-3.5 text-center">
                                {p.isRawMaterial ? (
                                  <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                                    Hammadde
                                  </span>
                                ) : (
                                  <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                                    Mamul
                                  </span>
                                )}
                              </td>

                              {/* Yayın Durumu */}
                              <td className="px-4 py-3.5 text-center">
                                {p.isRawMaterial ? (
                                  <span className="text-[10px] text-slate-400 italic">Dahili Hammadde</span>
                                ) : (
                                  <div className="inline-flex items-center justify-center gap-2.5">
                                    <button
                                      type="button"
                                      disabled={togglingProductId === p.id}
                                      onClick={() => handleToggleProductStatus(p)}
                                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-2xs ${
                                        isLive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-300 hover:bg-slate-400"
                                      } ${togglingProductId === p.id ? "opacity-50 cursor-wait" : ""}`}
                                      title={isLive ? "Yayından kaldır (Taslağa al)" : "Web ve mağazada yayına al"}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isLive ? "translate-x-4" : "translate-x-0"
                                        }`}
                                      />
                                    </button>

                                    <span
                                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                                        isLive
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs"
                                          : "bg-slate-100 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isLive ? "bg-emerald-500" : "bg-slate-400"
                                        }`}
                                      />
                                      {isLive ? "Yayında" : "Taslak"}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-right space-x-1">
                                {!p.isRawMaterial && isLive && productSlug && (
                                  <Link
                                    href={`/urun/${productSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-slate-500 hover:text-emerald-700 transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                                    title="Mağazada Görüntüle"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                <Link
                                  href={`/admin/stock/form?slug=${productSlug}&id=${encodeURIComponent(p.id)}&sku=${encodeURIComponent(p.sku || "")}`}
                                  prefetch={false}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg text-[#b45309] hover:text-[#92400e] transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                                  title="Gelişmiş Ürün Kartını Düzenle"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg text-slate-400 hover:text-red-600 transition-all inline-flex items-center justify-center cursor-pointer shadow-2xs"
                                  title="Ürünü Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KATEGORILER TAB (HIYERARŞİK TREE-VIEW) */}
            {activeTab === "KATEGORILER" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Kategori Hiyerarşisi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Alt kategorileri daraltıp genişletebilir, ürün sayısına tıklayarak o kategorideki ürünleri filtreleyebilirsiniz.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAllCategoriesExpand(true)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Tümünü Aç
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllCategoriesExpand(false)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Daralt
                    </button>
                    <Link
                      href="/admin/categories"
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#b45309] border border-amber-200 text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Gelişmiş SEO &amp; Görsel
                    </Link>
                    <button
                      onClick={openAddCategoryModal}
                      className="px-4 py-2 rounded-xl bg-[#6b1d2f] hover:bg-[#541624] active:scale-[0.99] text-white text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Yeni Kategori Ekle
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  {categories.length === 0 ? (
                    <div className="py-8 text-center text-xs font-semibold text-slate-400">
                      Sistemde kayıtlı kategori bulunmamaktadır.
                    </div>
                  ) : (
                    renderCategoryTree(null)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Modal Overlay */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-xl border border-stone-200/90 overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSaveCategory}>
              <div className="px-6 py-4.5 bg-[#faf8f5] border-b border-stone-200/80 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#6b1d2f]/10 rounded-xl flex items-center justify-center border border-[#6b1d2f]/15 text-[#6b1d2f]">
                    <Settings2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-stone-900 tracking-tight leading-tight">
                      {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-normal mt-0.5">
                      Katalog hiyerarşisi ve ürün sınıflandırması
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4.5 bg-white">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Kategori Adı <span className="text-[#6b1d2f] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: İspir Dut Gün Pekmezi"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-stone-800 text-sm font-medium focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 outline-none transition-all placeholder:text-stone-400"
                  />
                  <p className="text-[11px] text-stone-400 font-normal">
                    Ürünlerin vitrin ve katalogda görüntüleneceği başlık.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">
                    Üst Kategori <span className="text-stone-400 font-normal">(Opsiyonel)</span>
                  </label>
                  <select
                    value={categoryForm.parentId}
                    onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-stone-800 text-sm font-medium focus:bg-white focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="">(Yok - Ana Kategori)</option>
                    {categories
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-stone-400 font-normal">
                    Bu kategori bir alt dal ise bağlı olduğu ana kategoriyi seçiniz.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#faf8f5] border-t border-stone-200/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6b1d2f] hover:bg-[#541624] active:scale-[0.99] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock & Price Update Modal Overlay */}
      {quickStockProduct && (
        <div
          key={`quick-stock-modal-${quickStockProduct.id || quickStockProduct.sku}`}
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-stone-200/90 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 bg-[#faf8f5] border-b border-stone-200/80 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#6b1d2f]/10 rounded-xl flex items-center justify-center border border-[#6b1d2f]/15 text-[#6b1d2f]">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-stone-900 tracking-tight leading-tight">
                    Hızlı Stok &amp; Fiyat Güncelle
                  </h3>
                  <p className="text-[11px] text-stone-500 font-normal mt-0.5">
                    Değişiklik stok hareketlerine otomatik işlenir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickStockProduct(null)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-3.5 text-xs text-stone-700">
                <p className="font-semibold text-stone-900">{quickStockProduct.name}</p>
                <p className="text-[10px] text-stone-500 font-mono mt-0.5">SKU: {quickStockProduct.sku}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-medium text-stone-700">Mevcut Stok Miktarı</label>
                  <div className="flex items-center bg-stone-50/50 border border-stone-200 rounded-xl focus-within:border-[#6b1d2f] focus-within:ring-2 focus-within:ring-[#6b1d2f]/10 focus-within:bg-white transition-all overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickStockQty((prev) => Math.max(0, (Number(prev) || 0) - 1))}
                      className="px-4 py-2.5 text-stone-500 hover:text-[#6b1d2f] hover:bg-stone-100 border-r border-stone-200 transition font-bold text-base select-none shrink-0 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      value={quickStockQty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") setQuickStockQty("");
                        else {
                          const parsed = parseInt(val, 10);
                          setQuickStockQty(isNaN(parsed) ? 0 : Math.max(0, parsed));
                        }
                      }}
                      className="flex-1 bg-transparent py-2.5 text-base font-bold text-stone-900 outline-none border-none text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickStockQty((prev) => (Number(prev) || 0) + 1)}
                      className="px-4 py-2.5 text-stone-500 hover:text-[#6b1d2f] hover:bg-stone-100 border-l border-stone-200 transition font-bold text-base select-none shrink-0 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Kritik Stok Limiti</label>
                  <input
                    type="number"
                    min="0"
                    value={quickCriticalLimit}
                    onChange={(e) => setQuickCriticalLimit(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2 bg-stone-50/60 border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:bg-white focus:border-[#6b1d2f] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-stone-700">Birim Maliyet (₺)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quickCost}
                    onChange={(e) => setQuickCost(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 bg-stone-50/60 border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:bg-white focus:border-[#6b1d2f] outline-none"
                  />
                </div>

                {!quickStockProduct.isRawMaterial && (
                  <div className="space-y-1.5 col-span-2">
                    <label className="block text-xs font-medium text-stone-700">Web Satış Fiyatı (₺)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={quickPrice}
                      onChange={(e) => setQuickPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 bg-stone-50/60 border border-stone-200 rounded-xl text-sm font-bold text-emerald-700 focus:bg-white focus:border-[#6b1d2f] outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickStockProduct(null)}
                  className="flex-1 py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickStock}
                  disabled={isSavingQuickStock}
                  className="flex-1 py-2.5 bg-[#6b1d2f] hover:bg-[#541624] text-white rounded-xl text-xs font-semibold transition-all flex justify-center items-center gap-2 shadow-xs cursor-pointer border-none disabled:opacity-50"
                >
                  {isSavingQuickStock ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Product Import Modal */}
      <BulkProductImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onSuccess={() => {
          loadData();
          refreshProducts();
        }}
        existingSkus={new Set(products.map((p) => String(p.sku || "").trim().toLowerCase()))}
      />
    </div>
  );
}
