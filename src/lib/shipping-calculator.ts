export interface ShippingTier {
  minDesi: number;
  maxDesi: number;
  price: number;
}

export interface ShippingCarrierConfig {
  id?: string;
  name: string;
  logoUrl?: string;
  pricingType?: "flat" | "tiered" | "receiver_pay" | "buyer_pays" | "free" | string;
  isActive?: boolean;
  addShippingCosts?: boolean;
  isFreeShipping?: boolean | string;
  isFree?: boolean;
  alwaysFree?: boolean;
  isReceiverPay?: boolean;
  freeThreshold?: number | string | null;
  taxRate?: number;
  billingMethod?: "weight" | "price" | string;
  fallbackFee?: number | string | null;
  outOfRangeBehavior?: "highest" | "disable" | string;
  tiers?: ShippingTier[];
}

export function parseActiveShippingCarriers(rawCarriers: any): ShippingCarrierConfig[] {
  if (!rawCarriers) return [];
  let list: any = rawCarriers;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.filter((c) => c && c.isActive !== false);
}

export function extractItemWeightInKg(item: any): number {
  if (!item) return 0.5;

  if (item.weight && !isNaN(Number(item.weight))) {
    const w = Number(item.weight);
    return w >= 50 ? w / 1000 : w;
  }
  if (item.kg && !isNaN(Number(item.kg))) {
    return Number(item.kg);
  }
  if (item.gram && !isNaN(Number(item.gram))) {
    return Number(item.gram) / 1000;
  }

  const text = `${item.variantLabel || ""} ${item.name || ""} ${item.desc || ""}`.toLowerCase();

  const kgMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogram)\b/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1].replace(",", "."));
    if (!isNaN(val) && val > 0) return val;
  }

  const grMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:gr|g|gram)\b/);
  if (grMatch) {
    const val = parseFloat(grMatch[1].replace(",", "."));
    if (!isNaN(val) && val > 0) return val / 1000;
  }

  const ltMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|litre|l)\b/);
  if (ltMatch) {
    const val = parseFloat(ltMatch[1].replace(",", "."));
    if (!isNaN(val) && val > 0) return val;
  }

  const mlMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ml)\b/);
  if (mlMatch) {
    const val = parseFloat(mlMatch[1].replace(",", "."));
    if (!isNaN(val) && val > 0) return val / 1000;
  }

  return 0.5;
}

export function calculateCartWeightAndDesi(cartItems: any[]): {
  totalWeightKg: number;
  totalDesi: number;
} {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { totalWeightKg: 0, totalDesi: 0 };
  }
  const totalWeightKg = cartItems.reduce((acc, item) => {
    const itemKg = extractItemWeightInKg(item);
    return acc + itemKg * (Number(item.quantity || 1) || 1);
  }, 0);
  const totalDesi = totalWeightKg > 0 ? Math.max(1, Math.ceil(totalWeightKg * 1.5)) : 1;
  return { totalWeightKg, totalDesi };
}

export function isCarrierAlwaysFree(carrier?: ShippingCarrierConfig | null): boolean {
  if (!carrier) return false;
  return Boolean(
    carrier.isFreeShipping === true ||
      carrier.isFreeShipping === "true" ||
      carrier.isFree === true ||
      carrier.alwaysFree === true ||
      carrier.pricingType === "free"
  );
}

export function isCarrierReceiverPay(carrier?: ShippingCarrierConfig | null): boolean {
  if (!carrier) return false;
  return Boolean(
    carrier.pricingType === "receiver_pay" ||
      carrier.pricingType === "buyer_pays" ||
      carrier.isReceiverPay === true
  );
}

export function calculateCarrierTariffFee(
  carrier: ShippingCarrierConfig | null | undefined,
  subtotal: number,
  totalDesi: number,
  siteFallbackFee = 150
): number {
  const safeSiteFallback = Number.isFinite(Number(siteFallbackFee)) && Number(siteFallbackFee) > 0
    ? Number(siteFallbackFee)
    : 150;

  if (!carrier) return safeSiteFallback;
  if (isCarrierAlwaysFree(carrier) || isCarrierReceiverPay(carrier)) return 0;

  const fallbackVal = Number(carrier.fallbackFee ?? 0);

  if (carrier.pricingType === "flat") {
    return fallbackVal > 0 ? fallbackVal : safeSiteFallback;
  }

  const tiers = Array.isArray(carrier.tiers) ? carrier.tiers : [];
  if (tiers.length > 0) {
    const metric =
      carrier.billingMethod === "price"
        ? Math.max(0, Number(subtotal || 0))
        : Math.max(1, Number(totalDesi || 1));

    const match = tiers.find(
      (t) => metric >= Number(t.minDesi) && metric <= Number(t.maxDesi)
    );
    if (match && Number.isFinite(Number(match.price))) {
      return Number(match.price);
    }

    const sortedDesc = [...tiers].sort((a, b) => Number(b.maxDesi) - Number(a.maxDesi));
    if (sortedDesc[0] && metric > Number(sortedDesc[0].maxDesi)) {
      if (carrier.outOfRangeBehavior === "highest" || !carrier.outOfRangeBehavior) {
        return Number(sortedDesc[0].price);
      }
    }

    const sortedAsc = [...tiers].sort((a, b) => Number(a.minDesi) - Number(b.minDesi));
    if (sortedAsc[0] && metric < Number(sortedAsc[0].minDesi)) {
      return Number(sortedAsc[0].price);
    }
  }

  return fallbackVal > 0 ? fallbackVal : safeSiteFallback;
}

export function calculateShippingSummary(params: {
  carrier?: ShippingCarrierConfig | null;
  subtotal: number;
  cartItems: any[];
  siteSettings?: any;
  isCouponFreeShipping?: boolean;
}) {
  const { carrier, subtotal, cartItems, siteSettings, isCouponFreeShipping = false } = params;
  const { totalWeightKg, totalDesi } = calculateCartWeightAndDesi(cartItems);
  const safeSubtotal = Math.max(0, Number(subtotal || 0));
  const hasItems = Array.isArray(cartItems) && cartItems.length > 0 && safeSubtotal > 0;

  const receiverPay = isCarrierReceiverPay(carrier);
  const alwaysFree = !receiverPay && isCarrierAlwaysFree(carrier);

  // freeThreshold yalnızca > 0 ise ücretsiz kargo eşiği aktiftir! (0 = ücretsiz kargo limiti yok)
  const rawThreshold =
    carrier?.freeThreshold !== undefined && carrier?.freeThreshold !== null && carrier?.freeThreshold !== ""
      ? Number(carrier.freeThreshold)
      : Number(siteSettings?.shippingThreshold ?? 0);
  const freeThreshold = Number.isFinite(rawThreshold) && rawThreshold > 0 ? rawThreshold : 0;

  const carrierBaseFee = calculateCarrierTariffFee(
    carrier,
    safeSubtotal,
    totalDesi,
    Number(siteSettings?.shippingFee ?? 150)
  );

  const isFreeByThreshold = hasItems && freeThreshold > 0 && safeSubtotal >= freeThreshold;
  const isShippingFree = !receiverPay && (alwaysFree || (hasItems && (isCouponFreeShipping || isFreeByThreshold)));

  const shippingCost = !hasItems || receiverPay || isShippingFree ? 0 : carrierBaseFee;
  const remainingForFreeShipping = freeThreshold > 0 ? Math.max(0, freeThreshold - safeSubtotal) : 0;
  const progressPercent = freeThreshold > 0 ? Math.min(100, (safeSubtotal / freeThreshold) * 100) : 0;

  return {
    totalWeightKg,
    totalDesi,
    hasItems,
    isReceiverPay: receiverPay,
    isCarrierAlwaysFree: alwaysFree,
    freeThreshold,
    carrierBaseFee,
    isFreeByThreshold,
    isShippingFree,
    shippingCost,
    remainingForFreeShipping,
    progressPercent,
  };
}
