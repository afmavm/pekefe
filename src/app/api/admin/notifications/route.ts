import { NextRequest, NextResponse } from "next/server";
import { prisma, withTimeout } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const fetchPromise = (async () => {
      const notifications = await prisma.$queryRawUnsafe(
        `SELECT * FROM admin_notifications ORDER BY createdAt DESC LIMIT 50`
      );

      const unreadCountResult: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM admin_notifications WHERE isRead = 0`
      );

      const unreadCount = Number(unreadCountResult[0]?.count || 0);
      return { notifications, unreadCount };
    })();

    const result = await withTimeout(fetchPromise, 400, { notifications: [], unreadCount: 0 });

    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("GET Admin Notifications Warning (DB unreachable, returning empty list):", error);
    return NextResponse.json({
      notifications: [],
      unreadCount: 0
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, all } = body;

    if (all) {
      await prisma.$executeRawUnsafe(`UPDATE admin_notifications SET isRead = 1`);
    } else if (id) {
      await prisma.$executeRawUnsafe(`UPDATE admin_notifications SET isRead = 1 WHERE id = ?`, id);
    } else {
      return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Admin Notifications Error:", error);
    return NextResponse.json({ error: error.message || "Bildirim güncellenemedi." }, { status: 500 });
  }
}
