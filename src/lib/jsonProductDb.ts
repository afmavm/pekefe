import fs from 'fs';
import path from 'path';

// DB is stored OUTSIDE of public/ to prevent browser direct access (security)
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'products_db.json');

// In-memory write mutex to prevent concurrent file corruption
let _writeLock: Promise<void> = Promise.resolve();

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
  active?: boolean;
  isPublished?: boolean;
  image?: string | null;
  images?: string[];
  desc?: string | null;
  shortDesc?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  seoKeywords?: string | null;
  videoUrl?: string | null;
  isCampaignActive?: boolean;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  attributes?: any;
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
    const content = fs.readFileSync(DB_FILE_PATH, 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error reading local JSON products:', e);
    return [];
  }
}

export function saveLocalProduct(product: Partial<LocalProduct> & { [key: string]: any }, isEditMode: boolean = false): LocalProduct {
  const current = readLocalProducts();
  const timestamp = Date.now();
  const generatedId = isEditMode ? (product.id || `PKF-${timestamp}`) : `PKF-${timestamp}`;

  const incomingAttrs = typeof product.attributes === 'object' && product.attributes !== null
    ? { ...product.attributes }
    : {};

  const resolvedActive = product.active !== undefined 
    ? Boolean(product.active) 
    : (incomingAttrs.isActive !== undefined ? Boolean(incomingAttrs.isActive) : (incomingAttrs.active !== undefined ? Boolean(incomingAttrs.active) : true));
  
  const resolvedPublished = product.isPublished !== undefined
    ? Boolean(product.isPublished)
    : resolvedActive;

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
    active: resolvedActive,
    isPublished: resolvedPublished,
    image: product.image || '/logo.png',
    images: product.images || [],
    desc: product.desc || '',
    shortDesc: product.shortDesc || '',
    seoTitle: product.seoTitle || '',
    seoDesc: product.seoDesc || '',
    seoKeywords: product.seoKeywords || '',
    videoUrl: product.videoUrl || '',
    isCampaignActive: Boolean(product.isCampaignActive),
    discount_start_date: product.discount_start_date ? String(product.discount_start_date) : null,
    discount_end_date: product.discount_end_date ? String(product.discount_end_date) : null,
    attributes: {
      ...incomingAttrs,
      isActive: resolvedActive,
      isPublished: resolvedPublished,
      ...(product.harvestStory ? { harvestStory: product.harvestStory } : {}),
      ...(product.ingredients ? { ingredients: product.ingredients } : {}),
      ...(product.ritual ? { ritual: product.ritual } : {}),
      ...(product.nutrients ? { nutrients: product.nutrients } : {}),
      ...(product.hmfLevel ? { hmfLevel: product.hmfLevel } : {}),
      ...(product.specsMaterial ? { specsMaterial: product.specsMaterial } : {}),
      ...(product.specsWeight ? { specsWeight: product.specsWeight } : {}),
      ...(product.specsDimensions ? { specsDimensions: product.specsDimensions } : {}),
      ...(product.specsBellows ? { specsBellows: product.specsBellows } : {}),
      ...(product.usageGuide ? { usageGuide: product.usageGuide } : {}),
      ...(product.warrantyInfo ? { warrantyInfo: product.warrantyInfo } : {}),
      ...(product.unitCoefficients ? { unitCoefficients: product.unitCoefficients } : {}),
      ...(product.branchPrices ? { branchPrices: product.branchPrices } : {}),
      ...(product.marketplaces ? { marketplaces: product.marketplaces } : {}),
    },
    variants: product.variants || [],
    warehouses: product.warehouses || [],
    locations: product.locations || [],
    createdAt: new Date().toISOString(),
    isDeleted: false
  };

  const cleanSku = String(product.sku || '').trim().toLowerCase();
  const cleanId = String(product.id || '').trim().toLowerCase();

  const existingIndex = current.findIndex(p => {
    const pId = String(p.id || '').trim().toLowerCase();
    const pSku = String(p.sku || '').trim().toLowerCase();
    return (cleanId && pId === cleanId) || (cleanSku && pSku === cleanSku);
  });

  if (existingIndex !== -1) {
    // Update existing product cleanly (preserves same ID and avoids duplicate rows)
    current[existingIndex] = {
      ...current[existingIndex],
      ...newProduct,
      active: resolvedActive,
      isPublished: resolvedPublished,
      id: current[existingIndex].id || newProduct.id,
      sku: product.sku || current[existingIndex].sku
    };
  } else {
    // Truly new product with unique SKU & ID
    current.unshift(newProduct);
  }

  // Mutex-guarded write to prevent concurrent file corruption
  _writeLock = _writeLock.then(() => {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(current, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving local JSON product:', e);
    }
  });

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

      // 1. Varyant Stoğunu Düşür
      if (Array.isArray(products[idx].variants) && products[idx].variants.length > 0) {
        const targetVariantSku = typeof itemInfo === 'object' ? (itemInfo.variantSku || itemInfo.sku || '') : '';
        const targetGramaj = typeof itemInfo === 'object' ? (itemInfo.weight || itemInfo.gramaj || itemInfo.variant || '') : '';

        products[idx].variants = products[idx].variants.map((v: any) => {
          const vSku = String(v.sku || v.variantSku || '').trim();
          const vName = String(v.name || v.gramaj || v.title || '').toLowerCase();
          const isMatch = (targetVariantSku && vSku === targetVariantSku) || 
                          (targetGramaj && vName.includes(String(targetGramaj).toLowerCase())) ||
                          (targetIdStr.includes(vSku));
          
          if (isMatch) {
            const vCurrent = Number(v.stock ?? v.stock_quantity ?? 1000);
            const vNew = Math.max(0, vCurrent - deductQty);
            console.log(`[VARIANT STOCK SUCCESS] Deducted ${deductQty} from variant "${v.sku || v.name}". Old: ${vCurrent} -> New: ${vNew}`);
            return { ...v, stock: vNew, stock_quantity: vNew };
          }
          return v;
        });
      }

      saveLocalProduct(products[idx], true);
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

export function deleteLocalProduct(targetId: string): boolean {
  try {
    const products = readLocalProducts();
    const cleanTarget = String(targetId || "").trim().toLowerCase();
    const filtered = products.filter(p => {
      const pId = String(p.id || "").trim().toLowerCase();
      const pSku = String(p.sku || "").trim().toLowerCase();
      return pId !== cleanTarget && pSku !== cleanTarget;
    });

    _writeLock = _writeLock.then(() => {
      try {
        const dir = path.dirname(DB_FILE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf8');
      } catch (e) {
        console.error('Error deleting local JSON product:', e);
      }
    });
    return true;
  } catch (e) {
    console.error('Error deleting local JSON product:', e);
    return false;
  }
}

export function saveLocalProductsBulk(
  incomingProducts: any[],
  updateExisting: boolean = true
): { added: number; updated: number; total: number; products: LocalProduct[] } {
  const current = readLocalProducts();
  let added = 0;
  let updated = 0;
  const processedResults: LocalProduct[] = [];

  for (let i = 0; i < incomingProducts.length; i++) {
    const p = incomingProducts[i];
    if (!p || !p.name) continue;

    const timestamp = Date.now() + i;
    const cleanSku = String(p.sku || '').trim();
    const cleanSkuLower = cleanSku.toLowerCase();
    const cleanId = String(p.id || '').trim().toLowerCase();

    const existingIndex = current.findIndex(existing => {
      const eId = String(existing.id || '').trim().toLowerCase();
      const eSku = String(existing.sku || '').trim().toLowerCase();
      return (cleanId && eId === cleanId) || (cleanSkuLower && eSku === cleanSkuLower);
    });

    const incomingAttrs = typeof p.attributes === 'object' && p.attributes !== null
      ? { ...p.attributes }
      : {};

    const resolvedActive = p.active !== undefined 
      ? Boolean(p.active) 
      : (incomingAttrs.isActive !== undefined ? Boolean(incomingAttrs.isActive) : (incomingAttrs.active !== undefined ? Boolean(incomingAttrs.active) : true));
    
    const resolvedPublished = p.isPublished !== undefined
      ? Boolean(p.isPublished)
      : resolvedActive;

    const basePrice = Number(p.price ?? p.sale_price ?? 0);
    const salePrice = Number(p.sale_price ?? p.price ?? basePrice);
    const listPrice = Number(p.list_price ?? p.oldPrice ?? salePrice);
    const cost = Number(p.cost ?? Math.round(salePrice * 0.45));
    const stockQty = Number(p.stock ?? p.stock_quantity ?? 0);
    const criticalLimit = Number(p.criticalLimit ?? 5);

    if (existingIndex !== -1) {
      if (updateExisting) {
        const existing = current[existingIndex];
        const updatedItem: LocalProduct = {
          ...existing,
          name: p.name || existing.name,
          sku: cleanSku || existing.sku,
          brand: p.brand !== undefined ? p.brand : existing.brand,
          model: p.model !== undefined ? p.model : existing.model,
          category: p.category || existing.category,
          stock: stockQty,
          stock_quantity: stockQty,
          price: salePrice,
          sale_price: salePrice,
          oldPrice: listPrice,
          list_price: listPrice,
          cost: cost,
          active: resolvedActive,
          isPublished: resolvedPublished,
          image: p.image || existing.image || '/logo.png',
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : existing.images,
          desc: p.desc || existing.desc || '',
          shortDesc: p.shortDesc || existing.shortDesc || '',
          attributes: {
            ...(existing.attributes || {}),
            ...incomingAttrs,
            isActive: resolvedActive,
            isPublished: resolvedPublished,
            unit: p.unit || (existing.attributes as any)?.unit || 'Adet',
            barcode: p.barcode || (existing.attributes as any)?.barcode || '',
          }
        };
        current[existingIndex] = updatedItem;
        updated++;
        processedResults.push(updatedItem);
      }
    } else {
      const generatedSku = cleanSku || `PKF-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedId = p.id || `PKF-${timestamp}`;
      const newItem: LocalProduct = {
        id: generatedId,
        name: String(p.name).trim(),
        sku: generatedSku,
        brand: p.brand || '',
        model: p.model || '',
        category: p.category || 'Pestil - Köme',
        stock: stockQty,
        stock_quantity: stockQty,
        price: salePrice,
        oldPrice: listPrice,
        list_price: listPrice,
        sale_price: salePrice,
        cost: cost,
        active: resolvedActive,
        isPublished: resolvedPublished,
        image: p.image || '/logo.png',
        images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
        desc: p.desc || p.shortDesc || '',
        shortDesc: p.shortDesc || '',
        seoTitle: p.seoTitle || p.name,
        seoDesc: p.seoDesc || p.shortDesc || p.name,
        seoKeywords: p.seoKeywords || '',
        videoUrl: p.videoUrl || '',
        isCampaignActive: Boolean(p.isCampaignActive),
        discount_start_date: null,
        discount_end_date: null,
        attributes: {
          ...incomingAttrs,
          isActive: resolvedActive,
          isPublished: resolvedPublished,
          unit: p.unit || 'Adet',
          barcode: p.barcode || '',
          criticalLimit: criticalLimit
        },
        variants: Array.isArray(p.variants) ? p.variants : [],
        warehouses: [],
        locations: [{ warehouseId: 'wh-1', stock: stockQty }],
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      current.unshift(newItem);
      added++;
      processedResults.push(newItem);
    }
  }

  _writeLock = _writeLock.then(() => {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(current, null, 2), 'utf8');
    } catch (e) {
      console.error('Error batch saving local JSON products:', e);
    }
  });

  return { added, updated, total: added + updated, products: processedResults };
}
