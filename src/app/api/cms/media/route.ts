import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// GET: Retrieve all media items from the database
export async function GET(request: NextRequest) {
  try {
    let items = await prisma.mediaItem.findMany({
      orderBy: { createdAt: "desc" }
    });

    // Seed default items if the media table is empty
    if (items.length === 0) {
      const defaultItems = [
        { name: "logo_dark.webp", url: "/uploads/logo_dark.png", size: "45 KB", tag: "logo", alt: "Atak Arıcılık Kurumsal Logosu" },
        { name: "banner_honey.webp", url: "/uploads/banner_honey.jpg", size: "380 KB", tag: "banner", alt: "Arı Kovanı ve Bal Süzme Slayt Görseli" },
        { name: "hive_wood.webp", url: "/uploads/hive_wood.png", size: "120 KB", tag: "product", alt: "304 Kalite Paslanmaz Krom Arı Kovanı" },
        { name: "comb_wax.webp", url: "/uploads/comb_wax.png", size: "85 KB", tag: "product", alt: "Doğal Petek Mum Kalıbı Görseli" },
      ];

      for (const d of defaultItems) {
        try {
          await prisma.mediaItem.create({
            data: {
              name: d.name,
              url: d.url,
              size: d.size,
              tag: d.tag,
              alt: d.alt
            }
          });
        } catch (e) {
          // Ignore unique conflicts during seeding
        }
      }

      items = await prisma.mediaItem.findMany({
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching media items:", error);
    return NextResponse.json({ error: "Medya dosyaları yüklenemedi." }, { status: 500 });
  }
}

// POST: Add new media (supports JSON link URL addition AND local file uploads)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // A. Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const data = await request.formData();
      const file: File | null = data.get("file") as unknown as File;

      if (!file) {
        return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
      }

      // Validate file size (max 5 MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Dosya boyutu 5 MB limitini aşamaz." }, { status: 400 });
      }

      const fileExt = path.extname(file.name).toLowerCase();
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
      if (!allowedExtensions.includes(fileExt)) {
        return NextResponse.json({ error: "Sadece resim dosyaları yüklenebilir." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create unique safe filename
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const filename = `${uniqueId}${fileExt}`;
      const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/${filename}`;
      const sizeStr = `${Math.round(file.size / 1024)} KB`;

      // Save to database
      const savedItem = await prisma.mediaItem.create({
        data: {
          name: originalName,
          url: fileUrl,
          size: sizeStr,
          tag: "general",
          alt: originalName.split(".")[0]
        }
      });

      return NextResponse.json({ success: true, item: savedItem });
    }

    // B. Handle link addition (application/json)
    const body = await request.json();
    const { url, name } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "Görsel URL adresi zorunludur." }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const cleanName = (name && name.trim()) ? name.trim() : cleanUrl.split("/").pop() || "Görsel Linki";
    
    // Save link to database
    const savedItem = await prisma.mediaItem.create({
      data: {
        name: cleanName,
        url: cleanUrl,
        size: "Dış Bağlantı",
        tag: "general",
        alt: cleanName.split(".")[0]
      }
    });

    return NextResponse.json({ success: true, item: savedItem });

  } catch (error: any) {
    console.error("Error adding media item:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Bu görsel zaten kütüphanede mevcut." }, { status: 400 });
    }
    return NextResponse.json({ error: "Dosya işlenirken sunucu hatası oluştu." }, { status: 500 });
  }
}

// DELETE: Delete a media item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID parametresi gereklidir." }, { status: 400 });
    }

    const item = await prisma.mediaItem.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json({ error: "Görsel bulunamadı." }, { status: 404 });
    }

    // Delete database record
    await prisma.mediaItem.delete({
      where: { id }
    });

    // Optionally delete from public/uploads if it's a local file
    if (item.url.startsWith("/uploads/")) {
      try {
        const filePath = path.join(process.cwd(), "public", item.url);
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (err) {
        console.error("Error deleting physical file:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Medya başarıyla silindi." });
  } catch (error: any) {
    console.error("Error deleting media item:", error);
    return NextResponse.json({ error: "Dosya silinirken hata oluştu." }, { status: 500 });
  }
}
