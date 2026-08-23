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

const initialWarehouses: Warehouse[] = [
  { id: "WH-01", name: "Erzurum Merkez Depo", type: "Merkez Depo", address: "Gürcükapı Mah. Sanayi Cad. No: 124, Yakutiye/Erzurum" },
  { id: "WH-02", name: "İstanbul Bayi Depo (Ataşehir)", type: "Şube", address: "Ataşehir, İstanbul" },
  { id: "WH-03", name: "Pekefe Sanal Depo", type: "Sanal" },
];

const initialProducts: Product[] = [
  { 
    id: 1, name: "Pekefe Pro Paslanmaz Arı Körüğü", sku: "PEKEFE-KORUK-01", category: "geleneksel lezzetler", subCategory: "Körük", stock: 150, criticalLimit: 20, price: 850, cost: 300, 
    image: "/uploads/beekeeping_bellows_premium.png",
    desc: "Asırlık Erzurum kalitesi, patentli çift hava kanalı sayesinde hiç sönmeyen 304 paslanmaz arı körüğü.",
    attributes: { 
      "Malzeme": "304 Paslanmaz Çelik", 
      "Hava Kanalı": "Patentli Çift Kanal",
      quickOverview1_title: "304 Paslanmaz Çelik",
      quickOverview1_desc: "Yüksek ısı mukavemeti ve uzun ömürlü paslanmaz gövde yapısı.",
      quickOverview1: "<strong>304 Paslanmaz Çelik:</strong> Yüksek ısı mukavemeti ve uzun ömürlü paslanmaz gövde yapısı.",
      quickOverview2_title: "Deri Isı Kalkanı Körük",
      quickOverview2_desc: "Elinizi ısıdan koruyan yüksek kaliteli ahşap ve hakiki deri körük.",
      quickOverview2: "<strong>Deri Isı Kalkanı Körük:</strong> Elinizi ısıdan koruyan yüksek kaliteli ahşap ve hakiki deri körük.",
      quickOverview3_title: "Yoğun Duman Izgarası",
      quickOverview3_desc: "Optimize edilmiş duman odasıyla arıları strese sokmayan soğuk duman çıkışı.",
      quickOverview3: "<strong>Yoğun Duman Izgarası:</strong> Optimize edilmiş duman odasıyla arıları strese sokmayan soğuk duman çıkışı.",
      specsMaterial: "304 Kalite Paslanmaz Çelik",
      specsWeight: "950 Gram (Ekipmansız boş ağırlık)",
      specsDimensions: "28 cm Yükseklik x 10 cm Silindir Çapı",
      specsBellows: "Hakiki Sığır Derisi & Isıl İşlem Görmüş Ahşap Plaka",
      longDescExtra: "PEKEFE profesyonel körük serisi, arıcılarımızın konforlu ve güvenli bir arılık yönetimi yapabilmesi için tasarlanmıştır. Gövdede yer alan çelik tel ızgara, körükten çıkan havanın duman odasına kesintisiz iletilmesini sağlarken yanmayı hızlandırır. Koruyucu tel örgü kalkanı, çalışma esnasında gövde ısısının doğrudan elinizle temas etmesini engelleyerek iş kazalarının önüne geçer. Ergonomik tasarımı, uzun süreli kullanımlarda bile bilek yorgunluğuna yol açmaz.",
      usageGuide: "Körüğün tabanındaki havalandırma sacının altına kuru ot, talaş veya hafif nemlendirilmiş duman kartonunu yerleştirin.\nKutuyu hafifçe ateşleyin ve dumanın kor halinde alev almasını sağlayın.\nİlk kor oluştuktan sonra duman odasının geri kalanını talaş, çam iğnesi veya kuru otla doldurun.\nKörüğü arkasındaki ahşap tabladan ritmik bir şekilde pompalayarak dumanın yoğunlaşmasını sağlayın.\nDuman çıkışı stabil bir hale geldikten sonra kapağı kilitleyin. İşlem bitiminde körüğü asma halkasından dikey bir şekilde muhafaza edin.",
      warrantyInfo: "Tüm metal parçalar, korozyon ve paslanmaya karşı 2 Yıl Üretici Garantisi altındadır.\nKörük derisinin aşınması veya ahşap parçanın su teması sebebiyle deforme olması garanti kapsamı dışındadır, ancak teknik servisimizden yedek körük temin edilebilir.\nKullanım kılavuzundaki yönergelere uygun olmayan aşırı yakıt doldurma kaynaklı metal eğrilmeleri garanti kapsamında değerlendirilmez."
    },
    variants: [],
    locations: [{ warehouseId: "WH-01", stock: 100, rack: "A-12-01" }, { warehouseId: "WH-02", stock: 50, rack: "B-03-02" }],
    recipe: [
      { productId: 101, quantity: 1.2, unit: "kg" },
      { productId: 102, quantity: 0.05, unit: "kg" },
      { productId: 103, quantity: 1, unit: "mt" }
    ]
  },
  { 
    id: 2, name: "Tam Koruma Arıcı Elbisesi", sku: "PEKEFE-ELBISE-01", category: "geleneksel lezzetler", subCategory: "Elbise", stock: 80, criticalLimit: 10, price: 1200, cost: 500, 
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800",
    desc: "3 katmanlı, nefes alabilir, arı sokmalarına karşı %100 güvenli profesyonel elbise.",
    attributes: { "Beden": "L/XL", "Katman Sayısı": "3 Katmanlı" },
    variants: [],
    locations: [{ warehouseId: "WH-01", stock: 50, rack: "A-12-02" }, { warehouseId: "WH-02", stock: 30, rack: "B-03-03" }],
    recipe: []
  },
  { 
    id: 3, name: "Kovan Bakım Seti", sku: "PEKEFE-SET-01", category: "geleneksel lezzetler", subCategory: "Set", stock: 120, criticalLimit: 15, price: 650, cost: 250, 
    image: "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
    desc: "8 parça paslanmaz çelik aletler ve özel taşıma çantası içeren profesyonel kovan bakım seti.",
    attributes: { "Parça Sayısı": "8 Parça", "Çanta": "Dahil" },
    variants: [],
    locations: [{ warehouseId: "WH-01", stock: 80, rack: "A-12-03" }, { warehouseId: "WH-02", stock: 40, rack: "B-03-04" }],
    recipe: []
  },
  {
    id: 4, name: "Profesyonel Galvaniz Arıcı Körüğü", sku: "KORUK-GALV-01", category: "yöresel ürünler", subCategory: "Körük", stock: 10, criticalLimit: 5, price: 350, oldPrice: 455, isCampaignActive: true, cost: 85,
    image: "https://images.unsplash.com/photo-1587049016823-69ef9d5045ac?q=80&w=800",
    desc: "Korozyona dayanıklı galvaniz kaplama, dayanıklı deri körük ve optimum hava üfleme kapasitesi sunan profesyonel arıcı körüğü.",
    attributes: { unit: "adet" },
    variants: [],
    locations: [{ warehouseId: "WH-01", stock: 10, rack: "A-12-04" }],
    recipe: []
  },
  { id: 101, name: "304 Paslanmaz Çelik Sac (Plaka)", sku: "RAW-SAC-01", category: "Hammadde", stock: 500, criticalLimit: 100, price: 0, cost: 350, image: "https://placehold.co/100?text=Sac", isRawMaterial: true, attributes: {}, variants: [] },
  { id: 102, name: "Körük Derisi ve Körük Körüğü", sku: "RAW-DERI-01", category: "Hammadde", stock: 250, criticalLimit: 50, price: 0, cost: 150, image: "https://placehold.co/100?text=Deri", isRawMaterial: true, attributes: {}, variants: [] },
  { id: 103, name: "Doğal Deri Bağlama İpi", sku: "RAW-IP-01", category: "Hammadde", stock: 1000, criticalLimit: 100, price: 0, cost: 20, image: "https://placehold.co/100?text=Ip", isRawMaterial: true, attributes: {}, variants: [] },
];

const initialCategories = ["geleneksel lezzetler", "Tekstil", "Elektronik", "Hammadde"];

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

const initialCategoryDetails: CategoryDetail[] = [
  { 
    id: "CAT-TEXTILE", 
    name: "Tekstil", 
    attributes: [
      { name: "Marka", type: "text", isRequired: true, isMarketplaceRequired: true },
      { name: "Kumaş Türü", type: "text", isRequired: false },
      { name: "Yerli Üretim", type: "select", options: ["Evet", "Hayır"], isRequired: true }
    ],
    variants: ["Renk", "Beden"]
  },
  { 
    id: "CAT-BEE", 
    name: "geleneksel lezzetler", 
    attributes: [
      { name: "Malzeme", type: "text", isRequired: true },
      { name: "Hava Kanalı", type: "text", isRequired: false }
    ],
    variants: ["Boyut"]
  }
];

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
