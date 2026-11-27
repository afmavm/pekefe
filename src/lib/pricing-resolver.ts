/**
 * PEKEFE Role-Aware Pricing Resolver (Single Source of Truth)
 *
 * Price Matrix in /admin/stock/form:
 * - purchasePrice -> Product.cost (Birim Alış Fiyatı)
 * - salePrice     -> Product.b2b_base_price & attributes.b2bPrice (B2B Bayi Satış Fiyatı)
 * - retailPrice   -> attributes.retailPrice (Perakende Fiyatı)
 * - webPrice      -> Product.price & Product.sale_price & attributes.webPrice (Web Perakende Fiyatı)
 * - marketPrice   -> Product.oldPrice & Product.list_price (Piyasa / Çizgili Fiyat)
 *
 * Backward-compatibility:
 * Legacy products saved before this fix may have B2B price stored in Product.price / Product.sale_price,
 * while their true Web Retail price is stored in attributes.webPrice (or attributes.retailPrice).
 * Therefore, resolveWebRetailPrice ALWAYS prioritizes attributes.webPrice > p.webPrice > attributes.retailPrice
 * before falling back to p.sale_price / p.price.
 */

export function parseProductAttributes(attrs: any): Record<string, any> {
  if (!attrs) return {};
  if (typeof attrs === "string") {
    try {
      const parsed = JSON.parse(attrs);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof attrs === "object" ? attrs : {};
}

export function toPositiveNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "object" && val !== null && typeof (val as any).toNumber === "function") {
    const n = (val as any).toNumber();
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Resolves the public Web Perakende (B2C) selling price.
 * Used for Guests, normal Customers, Admins previewing storefront,
 * Google Merchant Center XML/TSV, JSON-LD Product Schema, SEO, and Social Media.
 */
export function resolveWebRetailPrice(p: any): number {
  if (!p) return 0;
  const attrs = parseProductAttributes(p.attributes);

  const attrWeb = toPositiveNumber(attrs.webPrice);
  if (attrWeb > 0) return attrWeb;

  const topWeb = toPositiveNumber(p.webPrice);
  if (topWeb > 0) return topWeb;

  const attrRetail = toPositiveNumber(attrs.retailPrice);
  if (attrRetail > 0) return attrRetail;

  const saleP = toPositiveNumber(p.sale_price);
  if (saleP > 0) return saleP;

  const baseP = toPositiveNumber(p.price);
  if (baseP > 0) return baseP;

  const listP = toPositiveNumber(p.list_price ?? p.oldPrice);
  if (listP > 0) return listP;

  if (Array.isArray(p.variants) && p.variants.length > 0) {
    for (const v of p.variants) {
      const vp = toPositiveNumber(v?.price);
      if (vp > 0) return vp;
    }
  }

  return 0;
}

/**
 * Resolves the B2B Dealer base selling price.
 * Used ONLY for authenticated B2B / DEALER / Corporate Cari accounts.
 */
export function resolveB2BBasePrice(p: any): number {
  if (!p) return 0;
  const attrs = parseProductAttributes(p.attributes);

  const attrB2b = toPositiveNumber(attrs.b2bPrice);
  if (attrB2b > 0) return attrB2b;

  const dbB2b = toPositiveNumber(p.b2b_base_price);
  if (dbB2b > 0) return dbB2b;

  // Fallback to Web Retail price if no dedicated B2B price is configured
  return resolveWebRetailPrice(p);
}

/**
 * Resolves the strikethrough Market / List price (Piyasa Fiyatı).
 */
export function resolveMarketListPrice(p: any, activePrice?: number): number {
  if (!p) return 0;
  const attrs = parseProductAttributes(p.attributes);
  const candidates = [
    toPositiveNumber(p.oldPrice),
    toPositiveNumber(p.list_price),
    toPositiveNumber(attrs.marketPrice),
    toPositiveNumber(attrs.oldPrice),
    toPositiveNumber(attrs.list_price),
  ];
  const found = candidates.find((n) => n > 0) || 0;
  if (activePrice && activePrice > 0 && found < activePrice) {
    return activePrice;
  }
  return found || activePrice || 0;
}

/**
 * Determines whether a user/account should receive B2B Dealer pricing.
 * Admins & Super Admins browsing the public storefront receive standard Web Perakende pricing
 * unless explicitly marked as a DEALER role.
 */
export function isEligibleB2BUser(
  dbUser: { role?: string | null; customer_type?: string | null } | null | undefined,
  dealerAccount: { cariTipi?: string | null; type?: string | null } | null | undefined
): boolean {
  const role = String(dbUser?.role || "").toUpperCase();
  const customerType = String(dbUser?.customer_type || "").toLowerCase();

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return false;
  }

  if (role === "DEALER" || customerType === "b2b") {
    return true;
  }

  if (dealerAccount && (dealerAccount.cariTipi === "CORPORATE" || dealerAccount.type === "BAYI")) {
    return true;
  }

  return false;
}
