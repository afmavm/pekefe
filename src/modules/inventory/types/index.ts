export interface Warehouse {
  id: string;
  name: string;
  type: string;
  address?: string | null;
  branchId?: string | null;
  code?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  criticalLimit: number;
  price: number;
  cost: number;
  isRawMaterial: boolean;
  category: string;
  desc?: string | null;
  image?: string | null;
}

export interface StockLocation {
  id: string;
  productId: string;
  warehouseId: string;
  stock: number;
  rack?: string | null;
  warehouse?: Warehouse;
  product?: Product;
}

export interface StockTransfer {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: string; // 'Bekliyor' | 'Onaylandı' | 'Reddedildi'
  requester?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
}

export interface StockTransaction {
  id: string;
  productId: string;
  type: string; // "IN" | "OUT" | "PRODUCTION" | "PRODUCTION_CONSUMPTION" | "RETURN" | "SALE"
  quantity: number;
  description?: string | null;
  date: Date;
  product?: Product;
}
