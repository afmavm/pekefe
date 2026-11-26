import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { getVisitorStats } from "@/lib/visitor-analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requirePermission("view_dashboard", request);
  if (!auth.ok) return auth.response;

  try {
    const stats = getVisitorStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("[API /admin/analytics/visitors] Error:", error);
    return NextResponse.json(
      { error: "Ziyaretçi istatistikleri alınamadı." },
      { status: 500 }
    );
  }
}
