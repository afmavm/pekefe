"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { 
  PackageSearch, Settings2, Hammer, Search, AlertTriangle, 
  CheckCircle2, Box, ArrowRight, Loader2, PlaySquare, Layers, Clock,
  Package, Plus, Edit, Trash2, Save, X, ChevronRight, ChevronDown, Copy, Check, Info,
  UploadCloud, Sparkles, Coins, FileText, Database, RefreshCw, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { useProduct } from "@/context/ProductContext";
import { getProducts, resolveProductPrice, STORAGE_KEY, saveProducts } from "@/utils/productsStorage";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  cost: number;
  price: number;
  sale_price?: number | null;
  list_price?: number | null;
  isRawMaterial: boolean;
  category?: string;
  criticalLimit?: number;
  image?: string;
  desc?: string;
  seoTitle?: string;
  seoDesc?: string;
  recipe?: RecipeItem[];
  attributes?: any;
}



export default function StockProductionPage() {
  const router = useRouter();
  const { refreshProducts, refreshCategories } = useProduct();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"URUNLER" | "KATEGORILER">("URUNLER");
  const [searchTerm, setSearchTerm] = useState("");

  // Selection and Export States
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [isExcelDropdownOpen, setIsExcelDropdownOpen] = useState(false);
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);

  // Category Tree Toggle State
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Product CRUD Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalTab, setModalTab] = useState<"genel" | "stok" | "seo">("genel");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    stock: 0,
    criticalLimit: 0,
    price: 0,
    cost: 0,
    image: "",
    isRawMaterial: false,
    desc: "",
    seoTitle: "",
    seoDesc: "",
    unit: "Adet"
  });

  // Category CRUD Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    parentId: ""
  });

  // Quick Stock Update Modal States
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockQty, setQuickStockQty] = useState<number>(0);
  const [isSavingQuickStock, setIsSavingQuickStock] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const dbProducts = Array.isArray(data) ? data : [];
        const localProds = getProducts() || [];

        // Strict Deduplication: Match by both ID and SKU case-insensitively
        const seenIds = new Set<string>();
        const seenSkus = new Set<string>();
        const finalProducts: Product[] = [];

        // DB products have highest priority
        for (const p of dbProducts) {
          if (!p) continue;
          const cleanId = String(p.id || "").trim().toLowerCase();
          const cleanSku = String(p.sku || "").trim().toLowerCase();
          if (cleanId) seenIds.add(cleanId);
          if (cleanSku) seenSkus.add(cleanSku);
          finalProducts.push(p);
        }

        // Add unsynced local products only if completely unique
        for (const p of localProds) {
          if (!p) continue;
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
        // Silent localStorage update WITHOUT dispatching events to prevent infinite loop
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalProducts));
          } catch (e) {}
        }
      } else {
        setProducts(getProducts() || []);
      }

      const catRes = await fetch(`/api/categories?t=${Date.now()}`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData || []);
        
        // Auto expand parent categories initially
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
    } catch (err) {
      setProducts(getProducts() || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let debounceTimer: any = null;
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
        const foundProduct = products.find(p => p.sku === searchSku);
        if (foundProduct) {
          openQuickStockModal(foundProduct);
        }
        // Remove search param from URL history to prevent reopening modal on list refresh
        const url = new URL(window.location.href);
        url.searchParams.delete("search");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [products]);

  const openQuickStockModal = (product: Product) => {
    setQuickStockProduct(product);
    setQuickStockQty(product.stock);
  };

  const handleSaveQuickStock = async () => {
    if (!quickStockProduct) return;

    const targetId = encodeURIComponent(String(quickStockProduct.id || quickStockProduct.sku || ""));
    const newQty = Number(quickStockQty) || 0;

    setIsSavingQuickStock(true);

    // 1. Instant local storage, UI state update (0ms Latency)
    const updatedLocalProduct = {
      ...quickStockProduct,
      stock: newQty,
      stock_quantity: newQty
    };
    try { updateProductInStorage(updatedLocalProduct); } catch (e) {}
    setProducts(prev => prev.map(p => (p && (p.id === quickStockProduct.id || p.sku === quickStockProduct.sku)) ? { ...p, stock: newQty, stock_quantity: newQty } : p));

    // 2. Database & JSON sync
    try {
      const res = await fetch(`/api/products/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quickStockProduct, stock: newQty, stock_quantity: newQty })
      });
      if (res.ok) {
        toast.success("Stok miktarı başarıyla güncellendi.");
      }
      await loadData();
    } catch (err) {
      console.warn("Background DB stock sync notice:", err);
      toast.success("Stok miktarı güncellendi.");
    } finally {
      setIsSavingQuickStock(false);
      setQuickStockProduct(null);
    }
  };

  const filteredAllProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

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
      const targetProducts = mode === "selected" 
        ? filteredAllProducts.filter(p => selectedRows.has(p.id))
        : filteredAllProducts;

      if (targetProducts.length === 0) {
        toast.error("Aktarılacak ürün bulunamadı. Lütfen önce ürün seçtiğinizden emin olun.");
        return;
      }

      const exportData = targetProducts.map((p) => ({
        "Ürün Adı": p.name,
        "Stok Kodu (SKU)": p.sku,
        "Kategori": p.category || "Genel",
        "Maliyet": p.cost,
        "Fiyat": p.isRawMaterial ? "—" : (p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : p.price),
        "Mevcut Stok": p.stock,
        "Tip": p.isRawMaterial ? "Hammadde" : "Mamul",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");

      const fileSuffix = mode === "selected" ? "Secilenler" : "Tumunu";
      XLSX.writeFile(workbook, `Urun_Listesi_${fileSuffix}_${new Date().toISOString().split("T")[0]}.xlsx`);
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
      const targetProducts = mode === "selected" 
        ? filteredAllProducts.filter(p => selectedRows.has(p.id))
        : filteredAllProducts;

      if (targetProducts.length === 0) {
        toast.error("Aktarılacak ürün bulunamadı. Lütfen önce ürün seçtiğinizden emin olun.");
        return;
      }

      const doc = new jsPDF();
      
      // Page header
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Pekefe Geleneksel - URUN KATALOGU", 14, 15);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Rapor Tarihi: ${new Date().toLocaleString("tr-TR")}`, 14, 22);
      doc.text(`Toplam Urun Sayisi: ${targetProducts.length}`, 14, 27);
      
      // Table configuration
      const headers = [["Urun Adi", "SKU", "Kategori", "Maliyet", "Fiyat", "Stok", "Tip"]];
      const rows = targetProducts.map((p) => [
        trToEng(p.name),
        trToEng(p.sku),
        trToEng(p.category || "Genel"),
        `TL ${p.cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        p.isRawMaterial ? "—" : `TL ${(p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : p.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        p.stock.toLocaleString("tr-TR"),
        p.isRawMaterial ? "Hammadde" : "Mamul"
      ]);
      
      autoTable(doc, {
        startY: 32,
        head: headers,
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] }, // Brand orange color (#f97316)
        styles: { font: "Helvetica", fontSize: 9 },
      });
      
      const fileSuffix = mode === "selected" ? "Secilenler" : "Tumunu";
      doc.save(`Urun_Listesi_${fileSuffix}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF listesi başarıyla indirildi.");
      setIsPdfDropdownOpen(false);
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("PDF dışa aktarma sırasında hata oluştu.");
    }
  };

  // Product CRUD
  const openAddProductModal = () => {
    router.push("/admin/stock/form");
  };

  const openEditProductModal = (product: Product) => {
    const targetParam = product.id ? `id=${product.id}&sku=${encodeURIComponent(product.sku)}` : `sku=${encodeURIComponent(product.sku)}`;
    router.push(`/admin/stock/form?${targetParam}`);
  };


  // Drag & Drop Image Upload Helpers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto SKU Generator
  const generateAutoSku = () => {
    const prefix = productForm.isRawMaterial ? "HM" : "MM";
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setProductForm(prev => ({ ...prev, sku: `${prefix}-${randomNum}` }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.category) {
      toast.error("Lütfen gerekli alanları doldurun.");
      return;
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      
      const payload = {
        ...productForm,
        images: [],
        attributes: {}
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingProduct ? "Ürün başarıyla güncellendi." : "Ürün başarıyla oluşturuldu.");
        setIsProductModalOpen(false);
        await refreshProducts();
        await refreshCategories();
        router.refresh();
        await loadData();
      } else {
        toast.error(data.error || "Ürün kaydedilirken hata oluştu.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Ürün başarıyla silindi.");
        
        // Instant 0ms Client State Purge + Sync all listeners
        setProducts(prev => {
          const updated = prev.filter(p => String(p.id) !== String(id) && String(p.sku) !== String(id));
          saveProducts(updated); // dispatches pekefe_products_changed + pekefe_products_updated
          return updated;
        });

        await refreshProducts();
        await refreshCategories();
        await loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Ürün silinemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
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
    if (!categoryForm.name) {
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
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingCategory ? "Kategori başarıyla güncellendi." : "Kategori başarıyla oluşturuldu.");
        setIsCategoryModalOpen(false);
        await refreshCategories();
        router.refresh();
        await loadData();
      } else {
        toast.error(data.error || "Kategori kaydedilemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Kategori başarıyla silindi.");
        await refreshCategories();
        router.refresh();
        await loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Kategori silinemedi.");
      }
    } catch (err) {
      toast.error("Bağlantı hatası.");
    }
  };

  // Category Hierarchy recursive renderer
  const renderCategoryTree = (parentId: string | null = null, depth = 0) => {
    const isRoot = parentId === null || parentId === "" || parentId === undefined;
    const list = categories.filter(c => {
      if (isRoot) {
        return !c.parentId || c.parentId === "" || c.parentId === null;
      }
      return String(c.parentId) === String(parentId);
    });

    if (list.length === 0) {
      if (isRoot && categories.length > 0) {
        return (
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{cat.name}</span>
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
            ))}
          </div>
        );
      }
      return null;
    }

    return (
      <div className={`space-y-1.5 ${depth > 0 ? "pl-6 border-l border-slate-200 mt-1.5" : ""}`}>
        {list.map(cat => {
          const hasChildren = categories.some(c => c.parentId && String(c.parentId) === String(cat.id));
          const isExpanded = !!expandedCategories[cat.id];

          return (
            <div key={cat.id} className="space-y-1">
              <div className="flex justify-between items-center bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-sm hover:shadow transition-all">
                <div className="flex items-center gap-2.5">
                  {hasChildren ? (
                    <button 
                      type="button"
                      onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-5.5 h-5.5 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    </div>
                  )}
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{cat.name}</span>
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
            <PackageSearch className="w-6 h-6 text-[#b45309]" /> Ürün Kataloğu & Kategori Yönetimi
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Tüm imalat mamullerini ve hammadde envanterlerini tanımlayın, ürün hiyerarşisini ve kategorileri yönetin.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "URUNLER", label: "ÜRÜN KARTLARI", icon: Package, count: products.length },
              { id: "KATEGORILER", label: "KATEGORİLER", icon: Settings2, count: categories.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  activeTab === tab.id 
                    ? "bg-[#b45309] text-white border-[#b45309] shadow-md shadow-[#b45309]/10" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
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
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-55 transition cursor-pointer shadow-sm animate-in fade-in duration-200"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" /> Excel İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isExcelDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportExcel("selected");
                          setIsExcelDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        Seçilenleri Excel'e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                      </button>
                      <button
                        type="button"
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
                    type="button"
                    onClick={() => {
                      setIsPdfDropdownOpen(!isPdfDropdownOpen);
                      setIsExcelDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-55 transition cursor-pointer shadow-sm animate-in fade-in duration-200"
                  >
                    <FileDown className="w-3.5 h-3.5 text-rose-600" /> PDF İndir <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {isPdfDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 w-52 z-40 animate-in fade-in slide-in-from-top-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportPdf("selected");
                          setIsPdfDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left text-xs font-semibold text-slate-700 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        Seçilenleri PDF'e Aktar {selectedRows.size > 0 && `(${selectedRows.size})`}
                      </button>
                      <button
                        type="button"
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
              </>
            )}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[240px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#b45309]" />
            <p className="text-sm text-slate-400 font-semibold">Katalog Verileri Yükleniyor...</p>
          </div>
        ) : (
          <div className="p-6">

            {/* URUNLER TAB (SİSTEM ÜRÜN KATALOĞU) */}
            {activeTab === "URUNLER" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Sistem Ürün Kataloğu</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Stoktaki ham maddeler ve hazır satış mamullerinin tamamı</p>
                  </div>
                  <button
                    onClick={openAddProductModal}
                    className="px-4 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow shadow-[#b45309]/10"
                  >
                    <Plus className="w-4 h-4" /> YENİ ÜRÜN EKLE
                  </button>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wider uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-5 w-12 text-center">
                          <input 
                            type="checkbox"
                            checked={filteredAllProducts.length > 0 && filteredAllProducts.every(p => selectedRows.has(p.id))}
                            onChange={() => {
                              const allSelected = filteredAllProducts.length > 0 && filteredAllProducts.every(p => selectedRows.has(p.id));
                              setSelectedRows(prev => {
                                const next = new Set(prev);
                                if (allSelected) {
                                  filteredAllProducts.forEach(p => next.delete(p.id));
                                } else {
                                  filteredAllProducts.forEach(p => next.add(p.id));
                                }
                                return next;
                              });
                            }}
                            className="rounded border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-5">#</th>
                        <th className="px-6 py-5">Görsel</th>
                        <th className="px-6 py-5">Ürün Detayı</th>
                        <th className="px-6 py-5">Kategori</th>
                        <th className="px-6 py-5">Maliyet / Fiyat</th>
                        <th className="px-6 py-5">Mevcut Stok</th>
                        <th className="px-6 py-5">Tip</th>
                        <th className="px-6 py-5 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {filteredAllProducts.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-xs font-semibold text-slate-400">
                            Ürün bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredAllProducts.map((p, index) => {
                          const isLowStock = p.stock < (p.criticalLimit || 10);
                          
                          return (
                            <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${selectedRows.has(p.id) ? "bg-orange-50/20" : ""}`}>
                              <td className="px-6 py-4 text-center">
                                <input 
                                  type="checkbox"
                                  checked={selectedRows.has(p.id)}
                                  onChange={() => {
                                    setSelectedRows(prev => {
                                      const next = new Set(prev);
                                      if (next.has(p.id)) next.delete(p.id);
                                      else next.add(p.id);
                                      return next;
                                    });
                                  }}
                                  className="rounded border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                                />
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-500">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                {p.image ? (
                                  <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
                                    <Image src={p.image} alt={p.name} fill sizes="48px" className="object-contain p-1" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400/10 to-amber-400/15 border border-orange-200/40 flex items-center justify-center font-bold text-orange-500 text-sm select-none">
                                    {p.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <Link
                                  href={`/admin/stock/form?slug=${generateSlug(p.name)}&id=${p.id}&sku=${p.sku}`}
                                  className="font-bold text-slate-900 text-sm hover:text-orange-600 transition-colors block"
                                  title="Gelişmiş Stok Kartını Düzenle (SEO Uyumlu)"
                                >
                                  {p.name}
                                </Link>
                                <p className="text-[10px] font-semibold text-slate-400">SKU: {p.sku}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                                  {p.category || "Genel"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs font-semibold text-slate-600 flex flex-col gap-0.5">
                                  <p><b>Maliyet:</b> {(p.cost || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</p>
                                  <p className="text-slate-900 font-extrabold">
                                    <b>Satış:</b> {p.isRawMaterial ? (
                                      <span className="text-slate-400 font-normal">—</span>
                                    ) : (
                                      `${resolveProductPrice(p).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                                    )}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-black px-2 py-0.5 w-max rounded-md border ${
                                      isLowStock 
                                        ? "text-red-600 bg-red-50 border-red-200 animate-pulse font-bold" 
                                        : "text-slate-800 bg-slate-50 border-slate-200"
                                    }`}>
                                      {p.stock.toLocaleString("tr-TR")}
                                    </span>
                                    <button
                                      onClick={() => openQuickStockModal(p)}
                                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-orange-500 rounded transition border border-slate-200 bg-slate-50 cursor-pointer flex items-center justify-center shrink-0"
                                      title="Stok Miktarını Hızlı Güncelle"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-semibold">Limit: {p.criticalLimit || 0}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {p.isRawMaterial ? (
                                  <span className="px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                    Hammadde
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                    Mamul
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right space-x-1.5">
                                <Link
                                  href={`/admin/stock/form?slug=${generateSlug(p.name)}&id=${p.id}&sku=${p.sku}`}
                                  className="p-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-orange-600 hover:text-orange-900 transition-all inline-flex items-center justify-center cursor-pointer shadow-xs"
                                  title="Gelişmiş Stok Kartını Aç"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg text-slate-400 hover:text-red-600 transition-all inline-flex items-center justify-center cursor-pointer shadow-sm"
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
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Kategori Hiyerarşisi</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Alt kategorileri daraltıp genişletebileceğiniz etkileşimli ağaç yapısı</p>
                  </div>
                  <button
                    onClick={openAddCategoryModal}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow shadow-orange-500/10"
                  >
                    <Plus className="w-4 h-4" /> YENİ KATEGORİ EKLE
                  </button>
                </div>
                
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
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



      {/* Product CRUD Modal Overlay */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-[680px] h-[90vh] max-h-[750px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSaveProduct} className="flex flex-col h-full overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-extrabold uppercase tracking-wider text-left">
                    {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shopify / Odoo Styled Tab Navigation Bar */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalTab('genel')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      modalTab === 'genel'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Genel Bilgiler
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('stok')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      modalTab === 'stok'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Stok &amp; Maliyet
                  </button>
                  
                  {/* Dynamic SEO Tab visibility */}
                  {!productForm.isRawMaterial && (
                    <button
                      type="button"
                      onClick={() => setModalTab('seo')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        modalTab === 'seo'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      SEO Ayarları
                    </button>
                  )}
                </div>

                <span className="text-[10px] bg-slate-200/70 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                  {productForm.isRawMaterial ? "Dahili Hammadde" : "Satışa Hazır Mamul"}
                </span>
              </div>

              {/* Scrollable Form Fields */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
                
                {/* ==================== TAB: GENEL BİLGİLER ==================== */}
                {modalTab === 'genel' && (
                  <div className="space-y-5">
                    
                    {/* Raw Material Toggle Switch */}
                    <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Bu Ürün Bir Hammadde mi?</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Hammadde işaretlenirse e-ticaret satış fiyatı ve SEO ayarları gizlenir.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.isRawMaterial}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setProductForm({ ...productForm, isRawMaterial: checked });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    {/* Product Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Adı *</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: 0.8mm Galvaniz Sac Levha"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    {/* SKU & Auto Generate Generator */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Örn: HM-SAC-08"
                            value={productForm.sku}
                            onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={generateAutoSku}
                            className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer group"
                            title="Otomatik SKU Üret"
                          >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-all duration-300" />
                          </button>
                        </div>
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori *</label>
                        <select
                          value={productForm.category}
                          onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 outline-none transition-all cursor-pointer"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Drag & Drop Image Area */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Görseli</label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                          isDragging 
                            ? 'border-orange-500 bg-orange-50/20' 
                            : productForm.image ? 'border-slate-200 bg-slate-50/30' : 'border-slate-300 hover:border-orange-400 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        {productForm.image ? (
                          <div className="relative w-28 h-28 rounded-lg border border-slate-200 overflow-hidden group">
                            <Image src={productForm.image} alt="Preview" fill sizes="112px" className="object-cover" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductForm({ ...productForm, image: "" });
                              }}
                              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all rounded-lg"
                            >
                              Görseli Kaldır
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-8 h-8 text-slate-400" />
                            <p className="text-xs font-bold text-slate-700">Görseli buraya sürükleyin veya tıklayarak seçin</p>
                            <p className="text-[10px] text-slate-400 font-semibold">PNG, JPG veya WEBP (Max 2MB)</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ürün Açıklaması</label>
                      <textarea
                        rows={3}
                        placeholder="Üretim reçetesi girdileri veya satış özellikleri hakkında detaylı açıklama..."
                        value={productForm.desc}
                        onChange={e => setProductForm({ ...productForm, desc: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 resize-none"
                      />
                    </div>

                  </div>
                )}

                {/* ==================== TAB: STOK & MALİYET ==================== */}
                {modalTab === 'stok' && (
                  <div className="space-y-5">
                    
                    {/* Cost and Price (Dynamic Field Masking) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Birim Maliyeti (₺) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="any"
                          value={productForm.cost || ""}
                          onChange={e => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        />
                      </div>

                      {!productForm.isRawMaterial ? (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Satış Fiyatı (₺) *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={productForm.price || ""}
                            onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5 opacity-55 select-none">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Satış Fiyatı (₺)</label>
                          <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 flex items-center">
                            Hammadde - Satış Yapılamaz
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Integrated Unit Selector + Stock Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mevcut Stok Miktarı *</label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all bg-slate-50">
                          <input
                            type="number"
                            required
                            min="0"
                            value={productForm.stock}
                            onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-4 py-2.5 bg-transparent text-sm font-semibold outline-none border-none"
                          />
                          <select
                            value={productForm.unit}
                            onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                            className="px-3 bg-white border-l border-slate-200 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                          >
                            <option value="Adet">Adet</option>
                            <option value="Kg">Kg</option>
                            <option value="Metre">Metre</option>
                            <option value="Plaka">Plaka</option>
                            <option value="Rulo">Rulo</option>
                          </select>
                        </div>
                      </div>

                      {/* Critical Stock Limit */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kritik Stok Sınırı</label>
                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all bg-slate-50">
                          <input
                            type="number"
                            min="0"
                            value={productForm.criticalLimit}
                            onChange={e => setProductForm({ ...productForm, criticalLimit: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-4 py-2.5 bg-transparent text-sm font-semibold outline-none border-none"
                          />
                          <div className="px-3 bg-slate-100 border-l border-slate-200 text-[10px] font-black text-slate-500 flex items-center justify-center">
                            {productForm.unit.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ==================== TAB: SEO AYARLARI ==================== */}
                {modalTab === 'seo' && !productForm.isRawMaterial && (
                  <div className="space-y-5">
                    
                    {/* SEO Title */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">SEO Başlığı</label>
                      <input
                        type="text"
                        placeholder="Arama motorlarında görünecek başlık..."
                        value={productForm.seoTitle}
                        onChange={e => setProductForm({ ...productForm, seoTitle: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                      />
                    </div>

                    {/* SEO Description */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">SEO Açıklaması</label>
                      <textarea
                        rows={3}
                        placeholder="Müşterileri çekecek arama motoru açıklaması..."
                        value={productForm.seoDesc}
                        onChange={e => setProductForm({ ...productForm, seoDesc: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
                      />
                    </div>

                  </div>
                )}

              </div>

              {/* 📥 STICKY ACTIONS BAR (Sabit Buton Footer'ı) */}
              <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  <Save className="w-4 h-4" /> KAYDET VE YAYINLA
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Category Modal Overlay */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSaveCategory}>
              <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                    <Settings2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-extrabold uppercase tracking-wider text-left">
                    {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Adı *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Üst Kategori (Opsiyonel)</label>
                  <select
                    value={categoryForm.parentId}
                    onChange={e => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:bg-white focus:border-orange-400 outline-none cursor-pointer"
                  >
                    <option value="">(Yok)</option>
                    {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all flex justify-center items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" /> KAYDET
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Update Modal Overlay */}
      {quickStockProduct && (
        <div key={`quick-stock-modal-${quickStockProduct.id || quickStockProduct.sku}-${Date.now()}`} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-5 text-center bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                  <RefreshCw className="w-5 h-5 text-orange-500 animate-spin-slow" />
                </div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-left">Hızlı Stok Güncelle</h3>
              </div>
              <button
                onClick={() => setQuickStockProduct(null)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700">
                <p className="font-bold text-slate-800">{quickStockProduct.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {quickStockProduct.sku}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mevcut Stok Miktarı</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:border-orange-400 focus-within:bg-white transition-all overflow-hidden shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQuickStockQty(prev => Math.max(0, prev - 1))}
                    className="px-4 py-3 text-slate-500 hover:text-orange-500 hover:bg-slate-100 border-r border-slate-200 transition font-black text-lg select-none shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={quickStockQty}
                    onChange={(e) => setQuickStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-transparent py-3 text-lg font-bold text-slate-900 outline-none border-none text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickStockQty(prev => prev + 1)}
                    className="px-4 py-3 text-slate-500 hover:text-orange-500 hover:bg-slate-100 border-l border-slate-200 transition font-black text-lg select-none shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickStockProduct(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickStock}
                  disabled={isSavingQuickStock}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex justify-center items-center gap-2 shadow-lg shadow-orange-500/10 cursor-pointer border-none disabled:opacity-50"
                >
                  {isSavingQuickStock ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> GÜNCELLE
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

