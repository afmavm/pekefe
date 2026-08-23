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

export function saveLocalProduct(product: Partial<LocalProduct>, isEditMode: boolean = false): LocalProduct {
  const current = readLocalProducts();
  const timestamp = Date.now();
  const generatedId = isEditMode ? (product.id || `PKF-${timestamp}`) : `PKF-${timestamp}`;

  const newProduct: LocalProduct = {
    id: generatedId,
    name: product.name || 'Yeni Ürün',
    sku: product.sku || `PKF-${Math.floor(100000 + Math.random() * 900000)}`,
    brand: product.brand || '',
    model: product.model || '',
    category: product.category || 'Pestil - Köme',
    stock: Number(product.stock ?? product.stock_quantity ?? 10),
    stock_quantity: Number(product.stock ?? product.stock_quantity ?? 10),
    price: Number(product.price ?? product.sale_price ?? 100),
    oldPrice: product.oldPrice != null ? Number(product.oldPrice) : Number(product.price ?? product.sale_price ?? 100),
    list_price: product.list_price != null ? Number(product.list_price) : Number(product.price ?? product.sale_price ?? 100),
    sale_price: Number(product.sale_price ?? product.price ?? 100),
    cost: Number(product.cost ?? 50),
    image: product.image || '/logo.png',
    images: product.images || [],
    desc: product.desc || '',
    shortDesc: product.shortDesc || '',
    variants: product.variants || [],
    locations: product.locations || [],
    createdAt: new Date().toISOString(),
    isDeleted: false
  };

  if (isEditMode) {
    const existingIndex = current.findIndex(p => p.id === newProduct.id || p.sku === newProduct.sku);
    if (existingIndex !== -1) {
      current[existingIndex] = { ...current[existingIndex], ...newProduct };
    } else {
      current.unshift(newProduct);
    }
  } else {
    // ALWAYS ADD AS A NEW PRODUCT IN CREATE MODE — NEVER OVERWRITE
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

export function deductLocalProductStock(itemInfo: any, quantity: number = 1) {
  try {
    const products = readLocalProducts();
    const targetIdStr = String(typeof itemInfo === 'object' ? (itemInfo.id || itemInfo.productId || itemInfo.sku || '') : itemInfo).trim();
    const rawProductId = targetIdStr.split('_')[0].trim();
    const rawSku = typeof itemInfo === 'object' ? String(itemInfo.sku || '').trim() : '';

    const cleanItemName = typeof itemInfo === 'object' 
      ? String(itemInfo.name || '').toLowerCase().replace(/\s*\([^)]*\)/g, '').replace(/[^a-z0-9çğıöşü]/gi, '').trim()
      : '';

    let idx = products.findIndex(p => {
      const pId = String(p.id || '').trim();
      const pSku = String(p.sku || '').trim();
      return (
        pId === targetIdStr || 
        pSku === targetIdStr || 
        (rawProductId && pId === rawProductId) || 
        (rawProductId && pSku === rawProductId) ||
        (rawSku && (pId === rawSku || pSku === rawSku))
      );
    });

    // If not found by ID/SKU, try exact or sanitized name match
    if (idx === -1 && cleanItemName) {
      idx = products.findIndex(p => {
        const pCleanName = String(p.name || '').toLowerCase().replace(/[^a-z0-9çğıöşü]/gi, '').trim();
        return pCleanName === cleanItemName || pCleanName.includes(cleanItemName) || cleanItemName.includes(pCleanName);
      });
    }

    if (idx >= 0) {
      const currentStock = Number(products[idx].stock ?? products[idx].stock_quantity ?? 0);
      const deductQty = Number(quantity || 1);
      const newStock = Math.max(0, currentStock - deductQty);
      products[idx].stock = newStock;
      products[idx].stock_quantity = newStock;
      saveLocalProduct(products[idx]);
      console.log(`[JSON DB STOCK SUCCESS] Deducted ${deductQty} from "${products[idx].name}". Old Stock: ${currentStock} -> New Stock: ${newStock}`);
      return true;
    } else {
      console.warn(`[JSON DB STOCK WARNING] Product not resolved for stock deduction:`, itemInfo);
      return false;
    }
  } catch (err) {
    console.error('Error deducting local product stock:', err);
    return false;
  }
}
