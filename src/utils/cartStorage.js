import { useCartStore } from "@/modules/catalog/store";

const CART_KEY = "pekefe_cart";

/**
 * Safely extracts an array from any stored cart format:
 * - Zustand persist format: { state: { items: [...] } }
 * - Plain array: [...]
 * - Object with items key: { items: [...] }
 */
function parseStoredCart(stored) {
  try {
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    // Zustand persist format: { state: { items: [...] } }
    if (parsed?.state?.items && Array.isArray(parsed.state.items)) return parsed.state.items;
    // Simple object with items key
    if (parsed?.items && Array.isArray(parsed.items)) return parsed.items;
    return [];
  } catch {
    return [];
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    ...item,
    id: String(item.id),
    quantity: item.quantity || item.qty || 1,
    desc: item.desc || `${item.name} · Premium Kavanoz`,
    badge: item.badge || "Geleneksel",
    img: item.img || item.image || "/premium-pekefe-kavanoz.png",
    image: item.image || item.img || "/premium-pekefe-kavanoz.png",
  }));
}

export function getCart() {
  if (typeof window === "undefined") return [];

  try {
    const state = useCartStore.getState();
    if (state?.items && Array.isArray(state.items) && state.items.length > 0) {
      return normalizeItems(state.items);
    }
  } catch {}

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(CART_KEY);
    const items = parseStoredCart(stored);
    return normalizeItems(items);
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  if (typeof window === "undefined") return;
  try {
    const safeCart = Array.isArray(cart) ? cart : [];
    localStorage.setItem(CART_KEY, JSON.stringify(safeCart));
    window.dispatchEvent(new Event("pekefe_cart_changed"));
  } catch (e) {
    console.error("Error saving cart", e);
  }
}

export function addToCart(product, quantity = 1) {
  try {
    const store = useCartStore.getState();
    const image = product.images && product.images[0]
      ? product.images[0]
      : (product.image || product.img || "/premium-pekefe-kavanoz.png");

    store.addItem({
      id: String(product.id),
      name: product.name,
      price: Number(product.price) || 0,
      quantity,
      image,
      img: image,
      desc: product.detail || product.meta || product.desc || "Premium Kavanoz",
      badge: product.tag || product.badge || "Doğal"
    });

    saveCart(getCart());
  } catch (e) {
    console.error("Error adding to cart", e);
  }
}

export function updateCartQty(id, delta) {
  try {
    const store = useCartStore.getState();
    const targetId = String(id);
    const items = Array.isArray(store.items) ? store.items : [];
    const existing = items.find(item => String(item.id) === targetId);
    if (existing) {
      const nextQty = (existing.quantity || 1) + delta;
      if (nextQty <= 0) {
        store.removeItem(targetId);
      } else {
        store.updateQuantity(targetId, nextQty);
      }
    } else {
      store.removeItem(targetId);
    }
    saveCart(getCart());
  } catch (e) {
    console.error("Error updating cart qty", e);
  }
}

export function removeFromCart(id) {
  try {
    const store = useCartStore.getState();
    store.removeItem(String(id));
    saveCart(getCart());
  } catch (e) {
    console.error("Error removing from cart", e);
  }
}

export function clearCart() {
  try {
    const store = useCartStore.getState();
    store.clearCart();
    saveCart([]);
  } catch (e) {
    console.error("Error clearing cart", e);
  }
}
