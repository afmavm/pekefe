/**
 * PEKEFE Geleneksel & Doğal Lezzetler Sepet İndirim Hesaplama Motoru
 * Hem client-side (CartContext, Checkout UI) hem server-side (api/checkout) kullanılır.
 * Bu sayede fiyat tutarsızlığı ve manipülasyon girişimleri önlenir.
 */

export interface CartDiscountSettings {
  cartDiscountType: "none" | "percentage" | "fixed";
  cartDiscountValue: number;
  cartDiscountMinAmount: number;
  bankTransferDiscountRate: number;
}

export interface CartItemForCalc {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  cartDiscountRate?: number; // Ürün bazlı sepette indirim oranı (%)
}

export interface DiscountBreakdown {
  subtotal: number;           // Ham toplam (indirim öncesi)
  itemDiscountTotal: number;  // Ürün bazlı indirimler toplamı
  cartDiscount: number;       // Genel kampanya indirimi
  bankTransferDiscount: number; // Havale indirimi
  totalDiscount: number;      // Tüm indirimler
  discountedSubtotal: number; // İndirimlerin uygulandığı subtotal
  shipping: number;           // Kargo ücreti
  grandTotal: number;         // Ödenecek nihai tutar
  bankTransferDiscountRate: number; // Uygulanan havale indirim oranı (%)
  cartDiscountApplied: boolean; // Genel kampanya uygulandı mı?
}

export function calculateCartDiscounts(
  items: CartItemForCalc[],
  settings: CartDiscountSettings,
  paymentMethod: "creditCard" | "bankTransfer",
  shippingFee: number,
  couponDiscount: number = 0
): DiscountBreakdown {
  // 1. Ham Toplam
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // 2. Ürün bazlı indirimler
  let itemDiscountTotal = 0;
  for (const item of items) {
    const rate = item.cartDiscountRate ?? 0;
    if (rate > 0) {
      itemDiscountTotal += item.price * item.quantity * (rate / 100);
    }
  }

  // 3. Genel kampanya indirimi
  let cartDiscount = 0;
  let cartDiscountApplied = false;
  const { cartDiscountType, cartDiscountValue, cartDiscountMinAmount } = settings;

  if (cartDiscountType !== "none" && cartDiscountValue > 0) {
    // Minimum sepet tutarı kontrolü (item indirimleri sonrası)
    const afterItemDiscounts = subtotal - itemDiscountTotal;
    if (afterItemDiscounts >= cartDiscountMinAmount) {
      if (cartDiscountType === "percentage") {
        cartDiscount = afterItemDiscounts * (cartDiscountValue / 100);
      } else if (cartDiscountType === "fixed") {
        cartDiscount = Math.min(cartDiscountValue, afterItemDiscounts);
      }
      cartDiscountApplied = true;
    }
  }

  // 4. Kupon indirimi (dışarıdan gelir)
  const totalDiscountBeforeBank = itemDiscountTotal + cartDiscount + couponDiscount;
  const discountedSubtotalBeforeBank = Math.max(0, subtotal - totalDiscountBeforeBank);

  // 5. Banka havalesi indirimi (kupon + ürün + kampanya sonrası)
  let bankTransferDiscount = 0;
  const bankRate = settings.bankTransferDiscountRate ?? 0;
  if (paymentMethod === "bankTransfer" && bankRate > 0) {
    bankTransferDiscount = discountedSubtotalBeforeBank * (bankRate / 100);
  }

  // 6. Sonuçlar
  const totalDiscount = totalDiscountBeforeBank + bankTransferDiscount;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const grandTotal = Math.max(0, discountedSubtotal + shippingFee);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemDiscountTotal: Math.round(itemDiscountTotal * 100) / 100,
    cartDiscount: Math.round(cartDiscount * 100) / 100,
    bankTransferDiscount: Math.round(bankTransferDiscount * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    shipping: Math.round(shippingFee * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    bankTransferDiscountRate: bankRate,
    cartDiscountApplied
  };
}

/**
 * Ürünün sepette indirimli fiyatını hesaplar
 */
export function getDiscountedItemPrice(price: number, cartDiscountRate: number): number {
  if (!cartDiscountRate || cartDiscountRate <= 0) return price;
  return Math.round(price * (1 - cartDiscountRate / 100) * 100) / 100;
}
