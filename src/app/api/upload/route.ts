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
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime"
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".xlsx", ".mp4", ".webm", ".ogg", ".mov"];
    const fileExt = path.extname(file.name).toLowerCase();

    if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { error: "Geçersiz dosya türü. Sadece resim, video, PDF ve Excel dosyaları yüklenebilir." },
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
    const buffer = Buffer.from(bytes);

    // 3. Rastgele güvenli dosya adı oluştur
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const filename = `${uniqueId}${fileExt}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    
    const localUploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Local / varsayılan dizinin varlığını garanti et
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true });
    }

    const localFilePath = path.join(localUploadDir, filename);
    await writeFile(localFilePath, buffer);

    // Eğer cPanel ortamındaysak, doğrudan public_html/uploads altına da kopyala/yaz
    const cpanelDir = "/home/ata3a6icilikcom/public_html/uploads";
    if (fs.existsSync("/home/ata3a6icilikcom/public_html")) {
      if (!fs.existsSync(cpanelDir)) {
        fs.mkdirSync(cpanelDir, { recursive: true });
      }
      const cpanelFilePath = path.join(cpanelDir, filename);
      await writeFile(cpanelFilePath, buffer);
    }

    // URL döndür
    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      name: originalName
    });

  } catch (error: any) {
    console.error("Yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
