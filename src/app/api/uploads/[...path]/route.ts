import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolved = await context.params;
    const segments = (resolved?.path || []).filter(
      (seg) => seg && seg !== ".." && seg !== "." && !seg.includes("\\")
    );

    if (segments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const candidateDirs = [
      path.join(process.cwd(), "public", "uploads"),
      "/home/ata3a6icilikcom/public_html/pekefe.com/uploads",
    ];

    let foundPath: string | null = null;
    for (const baseDir of candidateDirs) {
      const targetPath = path.resolve(baseDir, ...segments);
      if (!targetPath.startsWith(path.resolve(baseDir))) continue;
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        foundPath = targetPath;
        break;
      }
    }

    if (!foundPath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(foundPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(foundPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[API UPLOADS SERVE ERROR]:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
