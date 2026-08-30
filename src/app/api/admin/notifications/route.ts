import { NextRequest, NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { readLocalOrders } from "@/lib/jsonOrderDb";
import fs from "fs";
import path from "path";

const READ_NOTIFS_FILE = path.join(process.cwd(), "data", "admin_read_notifications.json");

function getReadNotifIds(): Set<string> {
  try {
    if (fs.existsSync(READ_NOTIFS_FILE)) {
      const raw = fs.readFileSync(READ_NOTIFS_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return new Set(list);
    }
  } catch {}
  return new Set();
}

function saveReadNotifIds(ids: Set<string>) {
  try {
    const dir = path.dirname(READ_NOTIFS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(READ_NOTIFS_FILE, JSON.stringify(Array.from(ids), null, 2), "utf-8");
  } catch {}
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === "development";
  const userRole = session?.user?.role;
  const isAuthorized = isDev || (session && (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ORDER_MANAGER" || userRole === "STOCK_MANAGER"));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const readIds = getReadNotifIds();
    const synthesizedNotifs: any[] = [];

    // 1. Yerel & Veritabanı Siparişlerinden Canlı Bildirimler Üret
    const localOrders = readLocalOrders();
    localOrders.forEach((o) => {
      const id = `notif-order-${o.id || o.orderNumber}`;
      const isRead = readIds.has(id) || readIds.has("all");
      const clientName = o.client || o.customerName || "Müşteri";
      const totalAmount = Number(o.total || o.amount || 0).toLocaleString("tr-TR");
      const paymentMethod = o.method || "Kredi Kartı";
      const isB2B = o.type === "B2B" || (o.notes && o.notes.includes("B2B"));

      synthesizedNotifs.push({
        id,
        orderId: o.id || o.orderNumber,
        type: isB2B ? "B2B_ORDER" : "ORDER",
        title: isB2B ? `Yeni Toptan B2B Siparişi: #${o.id}` : `Yeni Sipariş: #${o.id}`,
        message: `${clientName} tarafından ₺${totalAmount} tutarında (${paymentMethod}) sipariş oluşturuldu.`,
        isRead: isRead ? 1 : 0,
        createdAt: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
      });
    });

    // 2. Bayilik Başvuruları & Kurumsal Talepler (Varsa dosya / Prisma)
    try {
      const dealersPromise = prisma.user.findMany({
        where: { role: "DEALER", isApproved: false },
        take: 10,
        orderBy: { createdAt: "desc" }
      });
      const pendingDealers = await withTimeout(dealersPromise, 1500, []);
      pendingDealers.forEach((d: any) => {
        const id = `notif-dealer-${d.id}`;
        const isRead = readIds.has(id) || readIds.has("all");
        synthesizedNotifs.push({
          id,
          type: "DEALER_APPLICATION",
          title: `Yeni Bayilik Başvurusu: ${d.name || d.email}`,
          message: `${d.email} adresinden onay bekleyen kurumsal B2B bayilik başvurusu yapıldı.`,
          isRead: isRead ? 1 : 0,
          createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        });
      });
    } catch {}

    // Tarihe göre yeniden eskiye sırala
    synthesizedNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = synthesizedNotifs.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: synthesizedNotifs.slice(0, 30),
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET Admin Notifications Error:", error);
    return NextResponse.json({
      notifications: [],
      unreadCount: 0
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === "development";
  const userRole = session?.user?.role;
  const isAuthorized = isDev || (session && (userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "ORDER_MANAGER"));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, all } = body;
    const readIds = getReadNotifIds();

    if (all) {
      const localOrders = readLocalOrders();
      localOrders.forEach((o) => readIds.add(`notif-order-${o.id || o.orderNumber}`));
      readIds.add("all");
    } else if (id) {
      readIds.add(id);
    } else {
      return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
    }

    saveReadNotifIds(readIds);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Admin Notifications Error:", error);
    return NextResponse.json({ error: error.message || "Bildirim güncellenemedi." }, { status: 500 });
  }
}
