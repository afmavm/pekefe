const fs = require('fs');

async function syncProducts() {
  const res = await fetch('http://localhost:3000/api/products');
  const dbProducts = await res.json();

  if (!Array.isArray(dbProducts) || dbProducts.length === 0) {
    console.error("No products fetched from API!");
    return;
  }

  console.log(`Fetched ${dbProducts.length} live products from database.`);

  const mappedProducts = dbProducts.map(p => {
    let images = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
      images = p.images;
    } else if (typeof p.images === 'string') {
      try { images = JSON.parse(p.images); } catch(e) {}
    }
    if (!images || images.length === 0) {
      images = [p.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg"];
    }

    return {
      id: String(p.id),
      slug: p.slug || generateSlug(p.name),
      dbId: p.id,
      name: p.name,
      category: p.category || "pekmez",
      categoryDisplay: p.categoryDisplay || "Geleneksel Ürünler",
      desc: p.desc || p.description || "",
      meta: p.meta || "450g · Cam Kavanoz",
      price: typeof p.price === "number" ? p.price : parseFloat(p.price) || 0,
      image: p.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg",
      images: images,
      sku: p.sku || "PKF-001",
      stock: p.stock ?? 100,
      status: (p.stock ?? 100) > 10 ? "Stokta" : "Kritik",
      altitude: p.altitude || "2200 Metre",
      harvestSeason: p.harvestSeason || "Temmuz - Ağustos",
      description: p.description || p.desc || "",
      details: p.details || p.harvestStory || "",
      ingredients: p.ingredients || "%100 Saf Doğal",
      ritual: p.ritual || "",
      nutrients: p.nutrients || { energy: "293 kcal", carb: "70.2 g", protein: "0.8 g" },
      variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [],
      specifications: Array.isArray(p.specifications) ? p.specifications : [
        { key: "Menşei", value: "Erzurum / İspir" },
        { key: "Şeker İlavesi", value: "0.0% (Sadece Doğal Meyve Şekeri)" }
      ]
    };
  });

  function generateSlug(name = "") {
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

  const code = `"use client";

const STORAGE_KEY = "pekefe_products_state";

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
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-");
}

function stripHtml(htmlStr = "") {
  if (!htmlStr || typeof htmlStr !== "string") return "";
  return htmlStr.replace(/<[^>]*>/g, "").trim();
}

export const DEFAULT_PRODUCTS = ${JSON.stringify(mappedProducts, null, 2)};

export function formatDbProductToStorefront(p) {
  if (!p) return null;
  const mainImage = p.image || "/pekefe-dut-pekmezi-kavanoz-tr.jpg";
  let parsedImages = [];
  if (Array.isArray(p.images)) parsedImages = p.images;
  else if (typeof p.images === "string") {
    try { parsedImages = JSON.parse(p.images); } catch (e) {}
  }
  return {
    ...p,
    id: String(p.id),
    slug: p.slug || generateSlug(p.name),
    dbId: p.id,
    name: p.name,
    price: typeof p.price === "number" ? p.price : parseFloat(p.price) || 0,
    image: mainImage,
    images: parsedImages.length > 0 ? parsedImages : [mainImage],
  };
}

export function getProducts() {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading products from localStorage:", e);
  }
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event("pekefe_products_changed"));
  } catch (e) {
    console.error("Error saving products to localStorage:", e);
  }
}

export function getProductById(id) {
  const products = getProducts();
  return products.find((p) => String(p.id) === String(id) || String(p.sku) === String(id) || p.slug === id || generateSlug(p.name) === id) || null;
}

export function getProductBySlug(slug) {
  const products = getProducts();
  let found = products.find((p) => p.slug && String(p.slug) === String(slug));
  if (!found) found = products.find((p) => String(p.id) === String(slug) || String(p.sku) === String(slug));
  if (!found) found = products.find((p) => generateSlug(p.name) === String(slug));
  return found || null;
}

let _fetchingInProgress = false;

export async function fetchProductsFromApi() {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  if (_fetchingInProgress) return getProducts();
  _fetchingInProgress = true;
  try {
    const res = await fetch("/api/products?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return getProducts();
    const dbProducts = await res.json();
    if (!Array.isArray(dbProducts)) return getProducts();
    const formatted = dbProducts.map(formatDbProductToStorefront);
    saveProducts(formatted);
    return formatted;
  } catch (e) {
    console.error("Error fetching live products:", e);
    return getProducts();
  } finally {
    _fetchingInProgress = false;
  }
}

export async function fetchLiveProducts() {
  const formatted = await fetchProductsFromApi();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pekefe_products_updated", { detail: formatted }));
  }
  return formatted;
}
`;

  fs.writeFileSync('src/utils/productsStorage.js', code, 'utf-8');
  console.log("Successfully updated src/utils/productsStorage.js preserving all helper functions!");
}

syncProducts();
