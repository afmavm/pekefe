import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  cartDiscountRate?: number;
  quantity: number; // Normalized field
  qty: number;      // Landing page fallback
  image: string;
  img?: string;     // B2C fallback
  desc?: string;    // B2C item description
  badge?: string;   // B2C tag badge
  sku?: string;
}

interface CartStore {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  discountedTotal: number;
  totalItemDiscount: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      cartTotal: 0,
      discountedTotal: 0,
      totalItemDiscount: 0,

      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

      addItem: (newItem) => {
        set((state) => {
          const itemId = String(newItem.id);
          const existingIndex = state.items.findIndex((item) => String(item.id) === itemId);
          let updatedItems = [...state.items];

          if (existingIndex > -1) {
            const currentItem = updatedItems[existingIndex];
            const newQty = (currentItem.quantity || 1) + (newItem.quantity || 1);
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
              qty: newQty,
            };
          } else {
            updatedItems.push({
              ...newItem,
              id: itemId,
              quantity: newItem.quantity || 1,
              qty: newItem.quantity || 1,
            });
          }

          // Recalculate totals
          const cartTotal = updatedItems.reduce((total, item) => total + item.price * item.quantity, 0);
          const totalItemDiscount = updatedItems.reduce((total, item) => {
            const rate = item.cartDiscountRate ?? 0;
            if (rate > 0) {
              return total + item.price * item.quantity * (rate / 100);
            }
            return total;
          }, 0);
          const discountedTotal = Math.max(0, cartTotal - totalItemDiscount);

          return {
            items: updatedItems,
            cartTotal,
            totalItemDiscount,
            discountedTotal,
          };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const targetId = String(id);
          const updatedItems = state.items.filter((item) => String(item.id) !== targetId);

          // Recalculate totals
          const cartTotal = updatedItems.reduce((total, item) => total + item.price * item.quantity, 0);
          const totalItemDiscount = updatedItems.reduce((total, item) => {
            const rate = item.cartDiscountRate ?? 0;
            if (rate > 0) {
              return total + item.price * item.quantity * (rate / 100);
            }
            return total;
          }, 0);
          const discountedTotal = Math.max(0, cartTotal - totalItemDiscount);

          return {
            items: updatedItems,
            cartTotal,
            totalItemDiscount,
            discountedTotal,
          };
        });
      },

      updateQuantity: (id, quantity) => {
        const targetId = String(id);
        if (quantity < 1) {
          get().removeItem(targetId);
          return;
        }

        set((state) => {
          const updatedItems = state.items.map((item) =>
            String(item.id) === targetId ? { ...item, quantity, qty: quantity } : item
          );

          // Recalculate totals
          const cartTotal = updatedItems.reduce((total, item) => total + item.price * item.quantity, 0);
          const totalItemDiscount = updatedItems.reduce((total, item) => {
            const rate = item.cartDiscountRate ?? 0;
            if (rate > 0) {
              return total + item.price * item.quantity * (rate / 100);
            }
            return total;
          }, 0);
          const discountedTotal = Math.max(0, cartTotal - totalItemDiscount);

          return {
            items: updatedItems,
            cartTotal,
            totalItemDiscount,
            discountedTotal,
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          cartTotal: 0,
          discountedTotal: 0,
          totalItemDiscount: 0,
        });
      },
    }),
    {
      name: "pekefe_cart", // Standardized localStorage key
      partialize: (state) => ({
        items: state.items,
      }),
      merge: (persistedState: any, currentState) => {
        const items = persistedState?.items || [];
        const mappedItems = items.map((item: any) => {
          const quantity = item.quantity || item.qty || 1;
          return {
            id: String(item.id),
            name: item.name || "",
            price: Number(item.price) || 0,
            originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
            cartDiscountRate: item.cartDiscountRate ? Number(item.cartDiscountRate) : undefined,
            quantity,
            qty: quantity,
            image: item.image || item.img || "/premium-pekefe-kavanoz.png",
            img: item.img || item.image || "/premium-pekefe-kavanoz.png",
            desc: item.desc || "Premium Kavanoz",
            badge: item.badge || "Geleneksel",
            sku: item.sku || "",
          };
        });

        const cartTotal = mappedItems.reduce((total: number, item: any) => total + item.price * item.quantity, 0);
        const totalItemDiscount = mappedItems.reduce((total: number, item: any) => {
          const rate = item.cartDiscountRate ?? 0;
          if (rate > 0) {
            return total + item.price * item.quantity * (rate / 100);
          }
          return total;
        }, 0);
        const discountedTotal = Math.max(0, cartTotal - totalItemDiscount);

        return {
          ...currentState,
          items: mappedItems,
          cartTotal,
          totalItemDiscount,
          discountedTotal,
        };
      },
    }
  )
);
