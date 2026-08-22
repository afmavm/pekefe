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

export const STORAGE_KEY = "pekefe_products";
export const DEFAULT_PRODUCTS = [];

export function getProducts() {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      return [];
    }
    const parsed = JSON.parse(data);
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
    return [];
  }
}

export function resolveProductPrice(p) {
  if (!p) return 0;
  // 1. Check explicit webPrice / sale_price if positive
  if (p.webPrice && Number(p.webPrice) > 0) return Number(p.webPrice);
  if (p.sale_price && Number(p.sale_price) > 0) return Number(p.sale_price);
  if (p.price && Number(p.price) > 0) return Number(p.price);
  if (p.list_price && Number(p.list_price) > 0) return Number(p.list_price);
  if (p.retail_list_price && Number(p.retail_list_price) > 0) return Number(p.retail_list_price);
  
  // 2. Check attributes object
  let attrs = p.attributes;
  if (typeof attrs === "string") {
    try { attrs = JSON.parse(attrs); } catch {}
  }
  if (attrs && typeof attrs === "object") {
    if (attrs.webPrice && Number(attrs.webPrice) > 0) return Number(attrs.webPrice);
    if (attrs.salePrice && Number(attrs.salePrice) > 0) return Number(attrs.salePrice);
    if (attrs.price && Number(attrs.price) > 0) return Number(attrs.price);
  }

  // 3. Fallback to first variant with a positive price
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const validVar = p.variants.find(v => v.price && Number(v.price) > 0);
    if (validVar) return Number(validVar.price);
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

  const rawOldPrice = isCampaignActive 
    ? (p.oldPrice || p.marketPrice || p.list_price || p.retail_list_price || attrs.marketPrice || attrs.list_price || 0)
    : 0;
    
  const finalOldPrice = (isCampaignActive && Number(rawOldPrice) > finalPrice) ? Number(rawOldPrice) : 0;

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
    isCampaignActive: isCampaignActive,
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
