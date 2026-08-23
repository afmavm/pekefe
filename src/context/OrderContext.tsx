"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Order {
  id: string;
  orderNumber: string;
  client: string;
  type: "B2B" | "B2C";
  summary: string;
  amount: number;
  method: string;
  date: string;
  status: "Yeni" | "Hazırlanıyor" | "Kargolandı" | "Teslim Edildi";
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  taxOffice?: string;
  cargoCompany?: string;
  trackingNo?: string;
  shippingFee?: number;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  refreshOrders: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      if (!res.ok) return; // Auth failure, silently skip
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (order: Order) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) fetchOrders();
    } catch (err) { console.error(err); }
  };

  // ✅ Artık DB'ye persist ediyor
  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    // Optimistic update (önce UI'ı güncelle)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status })
      });
      if (!res.ok) {
        // Rollback on failure
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
      fetchOrders(); // Rollback
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, refreshOrders: fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
