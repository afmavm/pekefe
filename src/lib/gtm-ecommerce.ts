"use client";

export interface GtmProductInput {
  id?: string | number;
  sku?: string;
  name?: string;
  title?: string;
  category?: string;
  categoryDisplay?: string;
  variantLabel?: string;
  price?: number | string;
  sale_price?: number | string;
  list_price?: number | string;
  quantity?: number | string;
  qty?: number | string;
}

export interface GtmItem {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
}

function toSafeNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : fallback;
}

export function normalizeGtmItem(p: GtmProductInput, overrideQty?: number): GtmItem {
  const price = toSafeNumber(p.price ?? p.sale_price ?? p.list_price ?? 0);
  const quantity = Math.max(1, Math.round(toSafeNumber(overrideQty ?? p.quantity ?? p.qty ?? 1, 1)));
  return {
    item_id: String(p.sku || p.id || "unknown"),
    item_name: String(p.name || p.title || "PEKEFE Ürün").replace(/<[^>]+>/g, "").trim(),
    item_brand: "PEKEFE",
    ...(p.categoryDisplay || p.category ? { item_category: String(p.categoryDisplay || p.category) } : {}),
    ...(p.variantLabel ? { item_variant: String(p.variantLabel) } : {}),
    price,
    quantity,
  };
}

function pushDataLayer(eventName: string, ecommerce: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    // Official GA4/GTM spec: clear previous ecommerce object before pushing
    w.dataLayer.push({ ecommerce: null });
    w.dataLayer.push({
      event: eventName,
      ecommerce,
    });
  } catch (err) {
    console.warn(`[GTM] ${eventName} push error:`, err);
  }
}

export function trackViewItem(product: GtmProductInput) {
  if (!product || (!product.id && !product.name)) return;
  const item = normalizeGtmItem(product, 1);
  pushDataLayer("view_item", {
    currency: "TRY",
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(product: GtmProductInput, quantity = 1) {
  if (!product) return;
  const item = normalizeGtmItem(product, quantity);
  pushDataLayer("add_to_cart", {
    currency: "TRY",
    value: toSafeNumber(item.price * item.quantity),
    items: [item],
  });
}

export function trackRemoveFromCart(product: GtmProductInput) {
  if (!product) return;
  const item = normalizeGtmItem(product);
  pushDataLayer("remove_from_cart", {
    currency: "TRY",
    value: toSafeNumber(item.price * item.quantity),
    items: [item],
  });
}

export function trackBeginCheckout(
  items: GtmProductInput[],
  subtotal?: number,
  coupon?: string | null
) {
  if (!Array.isArray(items) || items.length === 0) return;
  const normalized = items.map((i) => normalizeGtmItem(i));
  const value =
    subtotal != null && subtotal > 0
      ? toSafeNumber(subtotal)
      : toSafeNumber(normalized.reduce((acc, i) => acc + i.price * i.quantity, 0));

  pushDataLayer("begin_checkout", {
    currency: "TRY",
    value,
    ...(coupon ? { coupon } : {}),
    items: normalized,
  });
}

export function trackPurchase(order: {
  orderId?: string;
  total?: number | string;
  subtotal?: number | string;
  shippingCost?: number | string;
  coupon?: string | null;
  items?: GtmProductInput[];
}) {
  if (typeof window === "undefined" || !order) return;
  const transactionId = String(order.orderId || "").trim();
  if (!transactionId) return;

  // Idempotency guard so page refresh on /sepet/onay never double-counts conversion
  const guardKey = `pekefe_gtm_purchase_${transactionId}`;
  try {
    if (sessionStorage.getItem(guardKey) === "1") return;
    sessionStorage.setItem(guardKey, "1");
  } catch {}

  const items = Array.isArray(order.items) ? order.items.map((i) => normalizeGtmItem(i)) : [];
  const shipping = toSafeNumber(order.shippingCost ?? 0);
  const value = toSafeNumber(
    order.total ??
      order.subtotal ??
      items.reduce((acc, i) => acc + i.price * i.quantity, 0) + shipping
  );

  pushDataLayer("purchase", {
    transaction_id: transactionId,
    currency: "TRY",
    value,
    shipping,
    ...(order.coupon ? { coupon: order.coupon } : {}),
    items,
  });
}
