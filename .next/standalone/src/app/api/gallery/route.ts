import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

export const dynamic = "force-dynamic";

const dataFilePath = path.join(process.cwd(), "src", "data", "gallery_items.json");

interface GalleryItem {
  id: string;
  type: "image" | "video";
  category: string;
  categoryLabel: string;
  title: string;
  desc: string;
  src: string;
  thumb?: string;
  badge?: string;
  isFeatured?: boolean;
  active: boolean;
  order: number;
  createdAt: string;
}

// Helper: Read gallery items from JSON file
function readItems(): GalleryItem[] {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const content = fs.readFileSync(dataFilePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading gallery_items.json:", error);
    return [];
  }
}

// Helper: Save gallery items to JSON file
function saveItems(items: GalleryItem[]) {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing gallery_items.json:", error);
  }
}

// GET: Retrieve all gallery items
export async function GET() {
  const items = readItems();
  return NextResponse.json(items);
}

// POST: Add new gallery item or upload file
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // A. Handle Direct File Upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file: File | null = formData.get("file") as unknown as File;

      if (!file) {
        return NextResponse.json({ error: "Yüklenecek dosya seçilmedi." }, { status: 400 });
      }

      // Max file size: 50MB for video/image
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json({ error: "Dosya boyutu 50 MB limitini aşamaz." }, { status: 400 });
      }

      const fileExt = path.extname(file.name).toLowerCase();
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueId = `gallery-media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const filename = `${uniqueId}${fileExt}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        url: fileUrl,
        filename: file.name,
      });
    }

    // B. Handle JSON Body (Create new Gallery Item record)
    const body = await request.json();
    const { type, category, categoryLabel, title, desc, src, thumb, badge, isFeatured, active } = body;

    if (!title || !src) {
      return NextResponse.json({ error: "Başlık ve Görsel/Video kaynağı zorunludur." }, { status: 400 });
    }

    const items = readItems();

    const newItem: GalleryItem = {
      id: `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: type || (src.match(/\.(mp4|webm|mov)$/i) ? "video" : "image"),
      category: category || "uretim",
      categoryLabel: categoryLabel || "Geleneksel Üretim",
      title,
      desc: desc || "",
      src,
      thumb: thumb || src,
      badge: badge || "Galeri Özel",
      isFeatured: Boolean(isFeatured),
      active: active !== undefined ? Boolean(active) : true,
      order: items.length + 1,
      createdAt: new Date().toISOString(),
    };

    const updatedItems = [newItem, ...items];
    saveItems(updatedItems);

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error("Error creating gallery item:", error);
    return NextResponse.json({ error: "Galeri ögesi eklenirken hata oluştu." }, { status: 500 });
  }
}

// PUT: Update existing item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, category, categoryLabel, title, desc, src, thumb, badge, isFeatured, active, order } = body;

    if (!id) {
      return NextResponse.json({ error: "Düzenlenecek galeri öge ID'si zorunludur." }, { status: 400 });
    }

    const items = readItems();
    const index = items.findIndex((i) => i.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Öge bulunamadı." }, { status: 404 });
    }

    items[index] = {
      ...items[index],
      ...(type && { type }),
      ...(category && { category }),
      ...(categoryLabel && { categoryLabel }),
      ...(title && { title }),
      ...(desc !== undefined && { desc }),
      ...(src && { src }),
      ...(thumb !== undefined && { thumb }),
      ...(badge !== undefined && { badge }),
      ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(order !== undefined && { order: Number(order) }),
    };

    saveItems(items);

    return NextResponse.json({ success: true, item: items[index] });
  } catch (error: any) {
    console.error("Error updating gallery item:", error);
    return NextResponse.json({ error: "Güncelleme sırasında hata oluştu." }, { status: 500 });
  }
}

// DELETE: Remove item by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Silinecek ID belirtilmedi." }, { status: 400 });
    }

    const items = readItems();
    const filtered = items.filter((i) => i.id !== id);

    if (filtered.length === items.length) {
      return NextResponse.json({ error: "Silinecek öge bulunamadı." }, { status: 404 });
    }

    saveItems(filtered);

    return NextResponse.json({ success: true, message: "Galeri ögesi başarıyla silindi." });
  } catch (error: any) {
    console.error("Error deleting gallery item:", error);
    return NextResponse.json({ error: "Silme işlemi sırasında hata oluştu." }, { status: 500 });
  }
}
