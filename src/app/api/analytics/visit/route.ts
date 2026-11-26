import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/visitor-analytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    const ip = extractClientIp(request);

    let body: { visitorId?: string; path?: string; type?: string } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const visitType = body.type === "heartbeat" ? "heartbeat" : "pageview";
    const visitPath = typeof body.path === "string" ? body.path : "/";

    const result = recordVisit({
      visitorId: body.visitorId,
      ip,
      userAgent,
      path: visitPath,
      type: visitType,
    });

    return NextResponse.json(
      { ok: true, recorded: result.recorded },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error) {
    console.error("[API /analytics/visit] Error:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
