import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı" },
        { status: 400 }
      );
    }

    // 1. Dosya türü ve uzantı doğrulaması
    const allowedExtensions = [
      ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".jfif", ".bmp", ".heic",
      ".pdf", ".xlsx", ".xls", ".mp4", ".webm", ".ogg", ".mov"
    ];
    const fileExt = path.extname(file.name).toLowerCase();

    const isImageOrVideoMime = file.type.startsWith("image/") || file.type.startsWith("video/") || file.type.includes("pdf") || file.type.includes("excel") || file.type.includes("spreadsheet");
    const isExtensionAllowed = allowedExtensions.includes(fileExt);

    if (!isExtensionAllowed && !isImageOrVideoMime) {
      return NextResponse.json(
        { error: "Geçersiz dosya türü. Sadece resim (JPEG, PNG, WEBP, AVIF), video, PDF ve Excel dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    // 2. Dosya boyutu doğrulaması (Maksimum 50 MB)
    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Dosya boyutu 50MB limitini aşamaz." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");

    let finalFilename = `${uniqueId}${fileExt}`;
    let isOptimized = false;
    let originalSize = file.size;
    let finalSize = buffer.length;

    // 3. Görselleri %100 Stüdyo Netliğinde WebP Formatına Dönüştür & Optimize Et (Sıfır Bulanıklık)
    const isImage = file.type.startsWith("image/") || [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".jfif", ".webp", ".avif", ".heic", ".tiff"].includes(fileExt);
    
    if (isImage && !fileExt.endsWith(".svg")) {
      try {
        const sharp = require("sharp");
        const convertedWebp = await sharp(buffer)
          .resize({
            width: 3840,
            height: 2160,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({
            quality: 98,
            effort: 6,
            chromaSubsampling: "4:4:4",
            smartSubsample: false,
          })
          .toBuffer();

        buffer = convertedWebp;
        finalFilename = `${uniqueId}.webp`;
        isOptimized = true;
        finalSize = convertedWebp.length;
      } catch (sharpError) {
        console.warn("Sharp WebP dönüştürme uyarısı (orijinal dosya saklandı):", sharpError);
      }
    }
    
    const localUploadDir = path.join(process.cwd(), "public", "uploads");
    
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true });
    }

    const localFilePath = path.join(localUploadDir, finalFilename);
    await writeFile(localFilePath, buffer);

    // Eğer cPanel ortamındaysak, doğrudan public_html/uploads altına da kopyala/yaz
    const cpanelDir = "/home/ata3a6icilikcom/public_html/uploads";
    if (fs.existsSync("/home/ata3a6icilikcom/public_html")) {
      if (!fs.existsSync(cpanelDir)) {
        fs.mkdirSync(cpanelDir, { recursive: true });
      }
      const cpanelFilePath = path.join(cpanelDir, finalFilename);
      await writeFile(cpanelFilePath, buffer);
    }

    const fileUrl = `/uploads/${finalFilename}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      name: originalName,
      optimized: isOptimized,
      format: isOptimized ? "WebP (1920x1080 px)" : fileExt.toUpperCase(),
      originalSize,
      finalSize
    });

  } catch (error: any) {
    console.error("Yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
