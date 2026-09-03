"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Warehouse {
  id: string;
  name: string;
  type: "Merkez Depo" | "Şube" | "Mağaza" | "Sanal";
  address?: string;
}

export interface StockLocation {
  warehouseId: string;
  stock: number;
  rack?: string;
}

export interface AttributeDefinition {
  name: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  isRequired: boolean;
  isMarketplaceRequired?: boolean;
}

export interface CategoryDetail {
  id: string;
  name: string;
  parentId?: string;
  attributes: AttributeDefinition[];
  variants: string[]; // e.g. ["Renk", "Beden"]
}

export interface ProductVariant {
  id: string;
  attributes: { [key: string]: string };
  stock: number;
  price?: number;
  sku: string;
}

export interface RecipeItem {
  productId: number | string;
  quantity: number;
  unit: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: string;
  requester?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}


export interface Product {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  subCategory?: string;
  stock: number; 
  criticalLimit: number;
  price: number;
  oldPrice?: number;
  list_price?: number;
  sale_price?: number;
  discount_start_date?: string | Date | null;
  discount_end_date?: string | Date | null;
  stock_quantity?: number | null;
  isCampaignActive?: boolean;
  active?: boolean;
  isPublished?: boolean;
  isDeleted?: boolean;
  cost: number;
  image: string;
  images?: string[];
  videoUrl?: string;
  desc?: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
  attributes: { [key: string]: any }; // Dynamic attributes based on category
  variants: ProductVariant[];
  locations?: StockLocation[];
  isRawMaterial?: boolean;
  recipe?: RecipeItem[];
  rating?: number;
  reviews?: number;
  barcode?: string | null;
  
  // Calculated properties from backend
  discount_amount?: number;
  discount_percent?: number;
  saving_amount?: number;
  is_discounted?: boolean;
  discount_display_text?: string;
  show_countdown?: boolean;
  server_time_utc?: string;

  retail_list_price?: number;
  b2b_price?: number;
  is_b2b_user?: boolean;
  volume_pricing_tiers?: Array<{ min_qty: number; price: number; label: string }>;
}

export interface ProductionOrder {
  id: string;
  productId: number | string;
  quantity: number;
  status: "Bekliyor" | "Tamamlandı";
  date: string;
}

const initialWarehouses: Warehouse[] = [];

const initialProducts: Product[] = [];

const initialCategories: string[] = [];

interface ProductContextType {
  products: Product[];
  categories: string[];
  categoryDetails: CategoryDetail[];
  warehouses: Warehouse[];
  productionOrders: ProductionOrder[];
  stockTransfers: StockTransfer[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  bulkUpdateProducts: (updatedProducts: Product[]) => Promise<boolean>;
  deleteProduct: (id: string | number) => void;
  addCategoryDetail: (category: CategoryDetail) => void;
  updateCategoryDetail: (category: CategoryDetail) => void;
  deleteCategoryDetail: (id: string) => void;
  addWarehouse: (warehouse: Warehouse) => void;
  addProductionOrder: (order: { productId: string | number; quantity: number }) => Promise<void>;
  completeProduction: (orderId: string) => void;
  saveProductRecipe: (productId: string | number, items: { ingredientId: string; quantity: number; unit: string }[]) => Promise<boolean>;
  createStockTransfer: (transfer: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; notes?: string }) => Promise<void>;
  approveStockTransfer: (id: string) => Promise<void>;
  rejectStockTransfer: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const initialCategoryDetails: CategoryDetail[] = [];

import { fetchLiveProducts } from "@/utils/productsStorage";

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<CategoryDetail[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses); // Keep initial for now
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) { console.error(err); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`/api/categories?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategoryDetails(data);
        setCategories(data.map((c: any) => c.name));
      }
    } catch (err) { console.error(err); }
  }, []);

  const fetchProductionOrders = async () => {
    try {
      const res = await fetch('/api/production');
      const data = await res.json();
      if (Array.isArray(data)) setProductionOrders(data);
    } catch (err) { console.error(err); }
  };

  const fetchStockTransfers = async () => {
    try {
      const res = await fetch('/api/stock-transfers');
      const data = await res.json();
      if (Array.isArray(data)) setStockTransfers(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchProductionOrders();
    fetchStockTransfers();
  }, [fetchProducts, fetchCategories]);

  const addProduct = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (err) { console.error(err); }
  };

  const updateProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (err) { console.error(err); }
  };

  const bulkUpdateProducts = async (updatedProducts: Product[]) => {
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProducts)
      });
      if (res.ok) {
        await fetchProducts();
        toast.success("Tüm ürünler başarıyla güncellendi.");
        return true;
      } else {
        const err = await res.json();
        toast.error("Hata: " + err.error);
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Toplu güncelleme sırasında bir hata oluştu.");
      return false;
    }
  };

  const deleteProduct = async (id: string | number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProducts();
        window.dispatchEvent(new Event("pekefe_products_changed"));
      }
    } catch (err) { console.error(err); }
  };

  const addCategoryDetail = async (cat: CategoryDetail) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat)
      });
      if (res.ok) fetchCategories();
    } catch (err) { console.error(err); }
  };

  const updateCategoryDetail = async (updated: CategoryDetail) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) fetchCategories();
    } catch (err) { console.error(err); }
  };

  const deleteCategoryDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (err) { console.error(err); }
  };

  const addWarehouse = (warehouse: Warehouse) => setWarehouses([...warehouses, warehouse]);

  const addProductionOrder = async (order: { productId: string | number; quantity: number }) => {
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      const data = await res.json();
      if (res.ok) {
        fetchProductionOrders();
        toast.success("Üretim emri başarıyla oluşturuldu.");
      } else {
        toast.error("Hata: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Üretim emri oluşturulurken bir hata oluştu.");
    }
  };

  const completeProduction = async (orderId: string) => {
    try {
      const res = await fetch('/api/production/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchProducts();
        fetchProductionOrders();
        toast.success("Üretim başarıyla tamamlandı ve stoklar güncellendi.");
      } else {
        toast.error("Hata: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Üretim tamamlanırken bir bağlantı hatası oluştu.");
    }
  };

  const saveProductRecipe = async (
    productId: string | number,
    items: { ingredientId: string; quantity: number; unit: string }[]
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (res.ok) {
        fetchProducts();
        toast.success("Reçete başarıyla kaydedildi.");
        return true;
      } else {
        toast.error("Hata: " + data.error);
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error("Reçete kaydedilirken bir hata oluştu.");
      return false;
    }
  };

  const createStockTransfer = async (transfer: { productId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; notes?: string }) => {
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer)
      });
      const data = await res.json();
      if (res.ok) {
        fetchStockTransfers();
        toast.success("Stok transfer talebi başarıyla oluşturuldu.");
      } else {
        toast.error("Hata: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Transfer talebi oluşturulurken bir hata oluştu.");
    }
  };

  const approveStockTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/stock-transfers/${id}/approve`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        fetchProducts();
        fetchStockTransfers();
        toast.success("Stok transferi başarıyla onaylandı.");
      } else {
        toast.error("Hata: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Transfer onaylanırken bir hata oluştu.");
    }
  };

  const rejectStockTransfer = async (id: string) => {
    try {
      const res = await fetch(`/api/stock-transfers/${id}/reject`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        fetchStockTransfers();
        toast.success("Stok transfer talebi reddedildi.");
      } else {
        toast.error("Hata: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Transfer reddedilirken bir hata oluştu.");
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, categories, categoryDetails, warehouses, productionOrders, stockTransfers,
      addProduct, updateProduct, bulkUpdateProducts, deleteProduct, 
      addCategoryDetail, updateCategoryDetail, deleteCategoryDetail, 
      addWarehouse, addProductionOrder, completeProduction, saveProductRecipe,
      createStockTransfer, approveStockTransfer, rejectStockTransfer,
      refreshProducts: fetchProducts,
      refreshCategories: fetchCategories
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
}
