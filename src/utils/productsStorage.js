"use client";

/**
 * Generates a SEO-friendly URL slug from a Turkish product name.
 * Example: "Sade Dut Pestili" → "sade-dut-pestili"
 */
export function generateSlug(name = "") {
  const trMap = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
    ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  return name
    .split("")
    .map((ch) => trMap[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const STORAGE_KEY = "pekefe_products_v7";
export const DEFAULT_PRODUCTS = [
  {
    id: "PKF-1787504925641",
    name: "Deneme Pestil",
    sku: "PKF-812100",
    category: "Pestil - Köme",
    stock: 6,
    price: 1,
    oldPrice: 1,
    sale_price: 1,
    cost: 1,
    image: "/logo.png",
    images: ["/logo.png"],
    meta: "Pestil · İspir",
    desc: "",
    shortDesc: "",
    variants: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "PKF-1787481146376",
    name: "Test Ürün Adli Tıp",
    sku: "PKF-TEST-999",
    category: "Pestil - Köme",
    stock: 10,
    price: 100,
    oldPrice: 100,
    sale_price: 100,
    cost: 50,
    image: "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
    images: ["/pekefe-dut-pekmezi-kavanoz-tr.jpg"],
    meta: "Pestil · İspir",
    desc: "Doğal İspir Pestil ve Köme lezzetleri.",
    shortDesc: "Doğal yöresel lezzet.",
    variants: [],
    createdAt: new Date().toISOString()
  }
];

export function getProducts() {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PRODUCTS;
    }
    // Sanitize stale "X Adet Stokta" meta values from localStorage
    const sanitized = parsed.map(p => {
      if (p.meta && /^\d+ adet stokta$/i.test(String(p.meta).trim())) {
        return {
          ...p,
          meta: `${p.category || 'Doğal Mahsul'} · İspir`
        };
      }
      return p;
    });
    return sanitized;
  } catch (err) {
    return DEFAULT_PRODUCTS;
  }
}

export function parseNumericPrice(val) {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (!val) return 0;
  
  let str = String(val).trim();
  
  // Handle Turkish thousand separators (e.g. "1.000,00" or "1.000")
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (str.includes(".")) {
    const parts = str.split(".");
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, "");
    }
  } else if (str.includes(",")) {
    str = str.replace(",", ".");
  }
  
  const cleaned = str.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function resolveProductPrice(p) {
  if (!p) return 0;
  
  const webP = parseNumericPrice(p.webPrice);
  if (webP > 0) return webP;

  const saleP = parseNumericPrice(p.sale_price);
  if (saleP > 0) return saleP;

  const pr = parseNumericPrice(p.price);
  if (pr > 0) return pr;

  const listP = parseNumericPrice(p.list_price);
  if (listP > 0) return listP;

  const retailP = parseNumericPrice(p.retail_list_price);
  if (retailP > 0) return retailP;
  
  // Check attributes object
  let attrs = p.attributes;
  if (typeof attrs === "string") {
    try { attrs = JSON.parse(attrs); } catch {}
  }
  if (attrs && typeof attrs === "object") {
    const aWebP = parseNumericPrice(attrs.webPrice);
    if (aWebP > 0) return aWebP;
    
    const aSaleP = parseNumericPrice(attrs.salePrice);
    if (aSaleP > 0) return aSaleP;
    
    const aPr = parseNumericPrice(attrs.price);
    if (aPr > 0) return aPr;
  }

  // Fallback to first variant with a positive price
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const validVar = p.variants.find(v => parseNumericPrice(v.price) > 0);
    if (validVar) return parseNumericPrice(validVar.price);
  }

  return 0;
}

export function formatDbProductToStorefront(p) {
  if (!p) return null;
  let attrs = p.attributes || {};
  if (typeof attrs === 'string') {
    try { attrs = JSON.parse(attrs); } catch (e) { attrs = {}; }
  }
  let images = p.images || [];
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch (e) { images = []; }
  }
  if (!Array.isArray(images) && p.image) {
    images = [p.image];
  }
  let formattedVariants = Array.isArray(p.variants) ? p.variants.map((v) => {
    let vAttrs = v.attributes || {};
    if (typeof vAttrs === 'string') {
      try { vAttrs = JSON.parse(vAttrs); } catch (e) { vAttrs = {}; }
    }
    return {
      ...v,
      size: v.size || vAttrs.size || "",
      color: v.color || vAttrs.color || "",
      name: v.name || vAttrs.name || "",
      price: v.price != null ? Number(v.price) : 0,
      stock: v.stock != null ? Number(v.stock) : 0,
      attributes: vAttrs
    };
  }) : [];

  const autoSlug = p.slug || generateSlug(p.name || "");
  const resolvedShortDesc = p.shortDesc || attrs.shortDesc || "";
  const resolvedDesc = p.desc || resolvedShortDesc || attrs.desc || "";
  const finalPrice = resolveProductPrice(p);

  const isCampaignActive = !!(
    p.isCampaignActive || 
    p.is_campaign_active || 
    p.is_discounted || 
    attrs.isCampaignActive || 
    attrs.is_discounted
  );

  const rawOldPrice = p.oldPrice || p.marketPrice || p.list_price || p.retail_list_price || attrs.marketPrice || attrs.list_price || 0;
  const finalOldPrice = (Number(rawOldPrice) > finalPrice) ? Number(rawOldPrice) : 0;

  const badgeText1 = p.badgeText1 || attrs.badgeText1 || "";
  const badgeText2 = p.badgeText2 || attrs.badgeText2 || "";
  const discount_end_date = p.discount_end_date || attrs.discount_end_date || null;
  const discount_start_date = p.discount_start_date || attrs.discount_start_date || null;

  return {
    ...p,
    id: p.id || p.sku,
    slug: autoSlug,
    name: p.name || "",
    sku: p.sku || "",
    desc: resolvedDesc,
    shortDesc: resolvedShortDesc,
    price: finalPrice,
    oldPrice: finalOldPrice,
    list_price: finalOldPrice || p.list_price || attrs.list_price || 0,
    isCampaignActive: isCampaignActive,
    discount_end_date: discount_end_date,
    discount_start_date: discount_start_date,
    badgeText1: badgeText1,
    badgeText2: badgeText2,
    stock: p.stock != null ? Number(p.stock) : (p.stock_quantity != null ? Number(p.stock_quantity) : 0),
    image: p.image || (Array.isArray(images) && images[0] ? images[0] : ""),
    images: Array.isArray(images) ? images : [],
    attributes: attrs,
    variants: formattedVariants
  };
}

let _fetchingInProgress = false;

/** Fetch live products from DB API and update localStorage cache.
 *  Does NOT dispatch pekefe_products_changed – caller controls that.
 */
export async function fetchProductsFromApi() {
  if (typeof window === "undefined") return [];
  if (_fetchingInProgress) return getProducts();
  _fetchingInProgress = true;
  try {
    const res = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return getProducts();
    const dbProducts = await res.json();
    if (!Array.isArray(dbProducts)) return getProducts();
    const formatted = dbProducts.map(formatDbProductToStorefront);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
    return formatted;
  } catch (err) {
    console.error("fetchProductsFromApi error:", err);
    return getProducts();
  } finally {
    _fetchingInProgress = false;
  }
}

/** Legacy wrapper – kept for backward compatibility. */
export async function fetchLiveProducts() {
  const formatted = await fetchProductsFromApi();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pekefe_products_updated", { detail: formatted }));
  }
  return formatted;
}

export function saveProducts(newProducts) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
    window.dispatchEvent(new Event("pekefe_products_changed"));
    window.dispatchEvent(new CustomEvent("pekefe_products_updated", { detail: newProducts }));
    import("@/lib/liveSync").then(({ notifyLiveSync }) => notifyLiveSync("products")).catch(() => {});
  } catch (err) {
    console.error("Error saving products to localStorage", err);
  }
}

export function getProductById(id) {
  const products = getProducts();
  const found = products.find(p => String(p.id) === String(id) || String(p.sku) === String(id) || String(p.slug) === String(id));
  return found || null;
}

/**
 * Look up a product by its SEO-friendly slug.
 * Falls back to ID lookup so old links continue to work during transition.
 */
export function getProductBySlug(slug) {
  const products = getProducts();
  // 1. Exact slug match
  let found = products.find(p => p.slug && String(p.slug) === String(slug));
  // 2. Fallback: treat slug as DB id or sku
  if (!found) found = products.find(p => String(p.id) === String(slug) || String(p.sku) === String(slug));
  // 3. Last resort: generate slug on the fly from name and compare
  if (!found) found = products.find(p => generateSlug(p.name) === String(slug));
  return found || null;
}

export function updateProductInStorage(updatedProduct) {
  if (typeof window === "undefined" || !updatedProduct) return;
  try {
    const products = getProducts();
    const targetId = updatedProduct.id || updatedProduct.sku;
    const idx = products.findIndex(p => 
      String(p.id) === String(targetId) || 
      String(p.sku) === String(targetId) ||
      (p.slug && updatedProduct.slug && String(p.slug) === String(updatedProduct.slug))
    );
    
    let newList = [];
    if (idx !== -1) {
      newList = [...products];
      newList[idx] = formatDbProductToStorefront({
        ...newList[idx],
        ...updatedProduct,
        attributes: {
          ...(typeof newList[idx].attributes === 'object' ? newList[idx].attributes : {}),
          ...(typeof updatedProduct.attributes === 'object' ? updatedProduct.attributes : {})
        }
      });
    } else {
      newList = [formatDbProductToStorefront(updatedProduct), ...products];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    window.dispatchEvent(new Event("pekefe_products_changed"));
    window.dispatchEvent(new CustomEvent("pekefe_products_updated", { detail: newList }));
    import("@/lib/liveSync").then(({ notifyLiveSync }) => notifyLiveSync("products")).catch(() => {});
  } catch (err) {
    console.error("updateProductInStorage error:", err);
  }
}
