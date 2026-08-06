export interface Ingredient {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

export interface RecipeItem {
  id: string;
  mainProductId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  cost: number;
  price: number;
  isRawMaterial: boolean;
  category?: string;
  criticalLimit?: number;
  image?: string | null;
  desc?: string | null;
  recipe?: RecipeItem[];
}

export interface ProductionOrder {
  id: string;
  productId: string;
  quantity: number;
  status: string; // 'Bekliyor' | 'Tamamlandı' | 'İptal'
  date: Date;
  product?: Product;
}

export interface StockTransaction {
  id: string;
  productId: string;
  type: string; // "IN" | "OUT" | "PRODUCTION" | "PRODUCTION_CONSUMPTION" | "RETURN" | "SALE"
  quantity: number;
  description?: string | null;
  date: Date;
}
