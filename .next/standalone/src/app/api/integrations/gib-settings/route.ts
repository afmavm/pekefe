import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const envFilePath = path.join(process.cwd(), ".env");

// .env dosyasındaki anahtarları güncelleyen yardımcı fonksiyon
function updateEnvFile(updates: Record<string, string>) {
  let content = "";
  if (fs.existsSync(envFilePath)) {
    content = fs.readFileSync(envFilePath, "utf-8");
  }

  const lines = content.split("\n");
  const updatedLines = [...lines];

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`);
    const lineIndex = updatedLines.findIndex(line => regex.test(line.trim()));

    const newLine = `${key}=${value}`;

    if (lineIndex !== -1) {
      updatedLines[lineIndex] = newLine;
    } else {
      updatedLines.push(newLine);
    }
  }

  fs.writeFileSync(envFilePath, updatedLines.join("\n"), "utf-8");
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    gibApiKey: process.env.GIB_API_KEY || "",
    gibApiUrl: process.env.GIB_API_URL || "https://earsiv.gib.gov.tr",
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { gibApiKey, gibApiUrl } = body;

    // Bellekte güncelle
    process.env.GIB_API_KEY = gibApiKey || "";
    process.env.GIB_API_URL = gibApiUrl || "https://earsiv.gib.gov.tr";

    // Dosyada güncelle
    updateEnvFile({
      GIB_API_KEY: gibApiKey || "",
      GIB_API_URL: gibApiUrl || "https://earsiv.gib.gov.tr",
    });

    return NextResponse.json({ success: true, message: "GİB API ayarları başarıyla kaydedildi." });
  } catch (error: any) {
    console.error("GİB ayar kaydetme hatası:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilirken hata oluştu." }, { status: 500 });
  }
}
