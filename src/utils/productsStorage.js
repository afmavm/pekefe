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
  return {
    ...p,
    id: p.id || p.sku,
    slug: autoSlug,
    name: p.name || "",
    sku: p.sku || "",
    desc: resolvedDesc,
    shortDesc: resolvedShortDesc,
    price: p.sale_price ? Number(p.sale_price) : (p.price ? Number(p.price) : 0),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : (p.list_price ? Number(p.list_price) : 0),
    stock: p.stock !== undefined ? p.stock : (p.stock_quantity !== undefined ? p.stock_quantity : 0),
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
