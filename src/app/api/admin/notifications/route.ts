import { NextRequest, NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { isAdminRole } from "@/lib/auth-helpers";
import { readLocalOrders } from "@/lib/jsonOrderDb";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const READ_NOTIFS_FILE = path.join(process.cwd(), "data", "admin_read_notifications.json");

interface ReadState {
  ids: Set<string>;
  lastReadAllAt: number;
}

function getLocalReadState(): ReadState {
  try {
    if (fs.existsSync(READ_NOTIFS_FILE)) {
      const raw = fs.readFileSync(READ_NOTIFS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return {
          ids: new Set(parsed.filter((id) => typeof id === "string" && id !== "all")),
          lastReadAllAt: 0,
        };
      }
      if (parsed && typeof parsed === "object") {
        const list = Array.isArray(parsed.ids) ? parsed.ids : [];
        return {
          ids: new Set(list.filter((id: any) => typeof id === "string" && id !== "all")),
          lastReadAllAt: Number(parsed.lastReadAllAt || 0),
        };
      }
    }
  } catch {}
  return { ids: new Set(), lastReadAllAt: 0 };
}

function saveLocalReadState(state: ReadState) {
  try {
    state.ids.delete("all");
    const dir = path.dirname(READ_NOTIFS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      READ_NOTIFS_FILE,
      JSON.stringify(
        {
          ids: Array.from(state.ids),
          lastReadAllAt: state.lastReadAllAt || 0,
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (err) {
    console.error("saveLocalReadState error:", err);
  }
}

async function getMergedReadState(): Promise<ReadState> {
  const state = getLocalReadState();
  try {
    const dbMarkers = await withTimeout(
      prisma.adminNotification.findMany({
        where: {
          isRead: true,
          type: { in: ["READ_MARKER", "READ_WATERMARK"] },
        },
        select: { type: true, title: true, message: true },
      }),
      1500,
      []
    );
    for (const m of dbMarkers || []) {
      if (m.type === "READ_WATERMARK") {
        const ts = Number(m.message || 0);
        if (ts > state.lastReadAllAt) state.lastReadAllAt = ts;
      } else if (m.title && m.title !== "all") {
        state.ids.add(m.title);
      }
    }
  } catch {}
  return state;
}

function normalizeOrderKey(rawId?: string): string {
  if (!rawId) return "";
  return String(rawId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === "development";
  const userRole = session?.user?.role;
  const isAuthorized = isDev || (session && isAdminRole(userRole));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const readState = await getMergedReadState();
    const readIds = readState.ids;
    const lastReadAllAt = readState.lastReadAllAt || 0;
    const synthesizedNotifs: any[] = [];
    const seenOrderKeys = new Set<string>();

    // 1. Hem MySQL (Prisma) hem Yerel JSON Siparişlerinden Canlı Bildirimler Üret
    let dbOrders: any[] = [];
    try {
      dbOrders = await withTimeout(
        prisma.order.findMany({
          include: { currentAccount: true },
          orderBy: { date: "desc" },
          take: 40,
        }),
        2000,
        []
      );
    } catch {}

    const localOrders = readLocalOrders();
    const combinedOrders: any[] = [];

    for (const o of dbOrders || []) {
      const key = normalizeOrderKey(o.id);
      if (key && !seenOrderKeys.has(key)) {
        seenOrderKeys.add(key);
        combinedOrders.push({
          id: o.id,
          client: o.currentAccount?.name || "Müşteri",
          total: Number(o.total || 0),
          method: o.method || "Kredi Kartı",
          type: o.type || "B2C",
          status: o.status || "Yeni",
          date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
        });
      }
    }

    for (const lo of localOrders || []) {
      const rawId = lo.id || lo.orderNumber || "";
      const key = normalizeOrderKey(rawId);
      if (key && !seenOrderKeys.has(key)) {
        seenOrderKeys.add(key);
        combinedOrders.push({
          id: rawId,
          client: lo.client || lo.customerName || "Müşteri",
          total: Number(lo.total ?? lo.amount ?? 0),
          method: lo.method || "Kredi Kartı",
          type: lo.type || "B2C",
          status: lo.status || "Yeni",
          date: lo.date || lo.createdAt || new Date().toISOString(),
        });
      }
    }

    combinedOrders.forEach((o) => {
      const rawId = String(o.id);
      const normKey = normalizeOrderKey(rawId);
      const id = `notif-order-${rawId}`;
      const createdTime = o.date ? new Date(o.date).getTime() : Date.now();
      const isRead =
        (lastReadAllAt > 0 && !Number.isNaN(createdTime) && createdTime <= lastReadAllAt) ||
        readIds.has(id) ||
        Array.from(readIds).some(
          (r) => r.startsWith("notif-order-") && normalizeOrderKey(r.replace("notif-order-", "")) === normKey
        );

      const clientName = o.client || "Müşteri";
      const totalAmount = Number(o.total || 0).toLocaleString("tr-TR");
      const paymentMethod = o.method || "Kredi Kartı";
      const isB2B = o.type === "B2B";

      synthesizedNotifs.push({
        id,
        orderId: rawId,
        type: isB2B ? "B2B_ORDER" : "ORDER",
        title: isB2B ? `Yeni Toptan B2B Siparişi: #${rawId}` : `Yeni Sipariş: #${rawId}`,
        message: `${clientName} tarafından ₺${totalAmount} tutarında (${paymentMethod}) sipariş oluşturuldu.`,
        isRead: isRead ? 1 : 0,
        createdAt: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
      });
    });

    // 2. Bayilik Başvuruları & Kurumsal Talepler
    try {
      const dealersPromise = prisma.user.findMany({
        where: { role: "DEALER", isApproved: false },
        take: 10,
        orderBy: { createdAt: "desc" },
      });
      const pendingDealers = await withTimeout(dealersPromise, 1500, []);
      pendingDealers.forEach((d: any) => {
        const id = `notif-dealer-${d.id}`;
        const createdTime = d.createdAt ? new Date(d.createdAt).getTime() : Date.now();
        const isRead =
          (lastReadAllAt > 0 && !Number.isNaN(createdTime) && createdTime <= lastReadAllAt) ||
          readIds.has(id);
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
    synthesizedNotifs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = synthesizedNotifs.filter((n) => !n.isRead).length;

    return NextResponse.json(
      {
        notifications: synthesizedNotifs.slice(0, 30),
        unreadCount,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("GET Admin Notifications Error:", error);
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === "development";
  const userRole = session?.user?.role;
  const isAuthorized = isDev || (session && isAdminRole(userRole));

  if (!isAuthorized) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, all } = body;
    const readState = await getMergedReadState();
    const readIds = readState.ids;

    if (all) {
      const nowTs = Date.now();
      readState.lastReadAllAt = nowTs;

      const localOrders = readLocalOrders();
      localOrders.forEach((o) => {
        if (o.id) readIds.add(`notif-order-${o.id}`);
        if (o.orderNumber) readIds.add(`notif-order-${o.orderNumber}`);
      });
      try {
        const dbOrders = await withTimeout(
          prisma.order.findMany({ select: { id: true }, take: 50, orderBy: { date: "desc" } }),
          1500,
          []
        );
        dbOrders.forEach((o: any) => {
          if (o.id) readIds.add(`notif-order-${o.id}`);
        });
        const pendingDealers = await withTimeout(
          prisma.user.findMany({ where: { role: "DEALER", isApproved: false }, select: { id: true } }),
          1500,
          []
        );
        pendingDealers.forEach((d: any) => {
          if (d.id) readIds.add(`notif-dealer-${d.id}`);
        });

        await withTimeout(
          prisma.adminNotification.upsert({
            where: { id: "admin-read-watermark" },
            update: { message: String(nowTs), isRead: true, type: "READ_WATERMARK", title: "READ_ALL" },
            create: { id: "admin-read-watermark", title: "READ_ALL", message: String(nowTs), type: "READ_WATERMARK", isRead: true },
          }),
          1500,
          null as any
        );
      } catch {}
    } else if (id) {
      readIds.add(id);
      try {
        const markerId = `read-${String(id).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120)}`;
        await withTimeout(
          prisma.adminNotification.upsert({
            where: { id: markerId },
            update: { title: String(id), isRead: true, type: "READ_MARKER", message: "read" },
            create: { id: markerId, title: String(id), message: "read", type: "READ_MARKER", isRead: true },
          }),
          1500,
          null as any
        );
      } catch {}
    } else {
      return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
    }

    saveLocalReadState(readState);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Admin Notifications Error:", error);
    return NextResponse.json({ error: error.message || "Bildirim güncellenemedi." }, { status: 500 });
  }
}
