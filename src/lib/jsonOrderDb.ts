import fs from 'fs';
import path from 'path';

const LOCAL_ORDERS_PATH = path.join(process.cwd(), 'data', 'orders_db.json');

export interface LocalOrder {
  id: string;
  orderNumber?: string;
  client?: string;
  currentAccountId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  date?: string;
  status: string;
  cargoCompany?: string;
  trackingNo?: string;
  amount: number;
  total?: number;
  shippingFee?: number;
  type?: string;
  method?: string;
  summary?: string;
  items?: any[];
  createdAt?: string;
}

function ensureOrdersFileExists() {
  try {
    const dir = path.dirname(LOCAL_ORDERS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_ORDERS_PATH)) {
      fs.writeFileSync(LOCAL_ORDERS_PATH, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring local orders DB file:', err);
  }
}

export function readLocalOrders(): LocalOrder[] {
  try {
    ensureOrdersFileExists();
    if (fs.existsSync(LOCAL_ORDERS_PATH)) {
      const raw = fs.readFileSync(LOCAL_ORDERS_PATH, 'utf-8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('Error reading local orders DB:', err);
  }
  return [];
}

export function saveLocalOrder(order: LocalOrder): LocalOrder {
  try {
    const orders = readLocalOrders();
    const existingIndex = orders.findIndex((o) => o.id === order.id || (o.orderNumber && order.orderNumber && o.orderNumber === order.orderNumber));
    
    const formattedOrder: LocalOrder = {
      ...order,
      id: order.id,
      orderNumber: order.orderNumber || order.id,
      client: order.client || order.customerName || 'Müşteri',
      date: order.date || new Date().toISOString(),
      status: order.status || 'Yeni',
      amount: Number(order.amount ?? order.total ?? 0),
      createdAt: order.createdAt || new Date().toISOString()
    };

    if (existingIndex >= 0) {
      orders[existingIndex] = { ...orders[existingIndex], ...formattedOrder };
    } else {
      orders.unshift(formattedOrder);
    }

    fs.writeFileSync(LOCAL_ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');
    return formattedOrder;
  } catch (err) {
    console.error('Error saving local order:', err);
    return order;
  }
}

export function updateLocalOrderStatus(id: string, updates: Partial<LocalOrder>): LocalOrder | null {
  try {
    const orders = readLocalOrders();
    const idx = orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx >= 0) {
      orders[idx] = { ...orders[idx], ...updates };
      fs.writeFileSync(LOCAL_ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');
      return orders[idx];
    }
  } catch (err) {
    console.error('Error updating local order status:', err);
  }
  return null;
}

export const getLocalOrders = readLocalOrders;
