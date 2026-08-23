import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'products_db.json');

export interface LocalProduct {
  id: string;
  name: string;
  sku: string;
  brand?: string | null;
  model?: string | null;
  category: string;
  stock: number;
  stock_quantity?: number;
  price: number;
  oldPrice?: number | null;
  list_price?: number | null;
  sale_price?: number | null;
  cost: number;
  image?: string | null;
  images?: string[];
  desc?: string | null;
  shortDesc?: string | null;
  variants?: any[];
  warehouses?: any[];
  locations?: any[];
  createdAt: string;
  isDeleted?: boolean;
}

export function readLocalProducts(): LocalProduct[] {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error reading local JSON products:', e);
    return [];
  }
}

export function saveLocalProduct(product: Partial<LocalProduct>): LocalProduct {
  const current = readLocalProducts();
  const newProduct: LocalProduct = {
    id: product.id || `PKF-${Date.now()}`,
    name: product.name || 'Yeni Ürün',
    sku: product.sku || `SKU-${Date.now()}`,
    brand: product.brand || '',
    model: product.model || '',
    category: product.category || 'Genel',
    stock: Number(product.stock || product.stock_quantity || 0),
    stock_quantity: Number(product.stock || product.stock_quantity || 0),
    price: Number(product.price || product.sale_price || 0),
    oldPrice: product.oldPrice != null ? Number(product.oldPrice) : Number(product.price || product.sale_price || 0),
    list_price: product.list_price != null ? Number(product.list_price) : Number(product.price || product.sale_price || 0),
    sale_price: Number(product.sale_price || product.price || 0),
    cost: Number(product.cost || 0),
    image: product.image || '',
    images: product.images || [],
    desc: product.desc || '',
    shortDesc: product.shortDesc || '',
    variants: product.variants || [],
    locations: product.locations || [],
    createdAt: new Date().toISOString(),
    isDeleted: false
  };

  const existingIndex = current.findIndex(p => p.id === newProduct.id || p.sku === newProduct.sku);
  if (existingIndex !== -1) {
    current[existingIndex] = { ...current[existingIndex], ...newProduct };
  } else {
    current.unshift(newProduct);
  }

  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(current, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local JSON product:', e);
  }

  return newProduct;
}

export function deductLocalProductStock(productId: string | number, quantity: number) {
  try {
    const products = readLocalProducts();
    const targetIdStr = String(productId);
    const rawProductId = targetIdStr.split('_')[0]; // Handle variant IDs like 'PKF-123_var'

    const idx = products.findIndex(p => String(p.id) === targetIdStr || String(p.id) === rawProductId || p.sku === targetIdStr);
    if (idx >= 0) {
      const currentStock = Number(products[idx].stock ?? products[idx].stock_quantity ?? 0);
      const newStock = Math.max(0, currentStock - Number(quantity || 1));
      products[idx].stock = newStock;
      products[idx].stock_quantity = newStock;
      saveLocalProduct(products[idx]);
      console.log(`[JSON DB STOCK] Deducted ${quantity} from product ${products[idx].name}. New Stock: ${newStock}`);
    }
  } catch (err) {
    console.error('Error deducting local product stock:', err);
  }
}
