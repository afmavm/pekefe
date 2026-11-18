import { NextRequest, NextResponse } from "next/server";
import { readLocalProducts, saveLocalProduct } from "@/lib/jsonProductDb";
import { prisma, withTimeout } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const products = readLocalProducts().filter((p: any) => !p.isDeleted && p.active !== false);

    // 1. Eksik meta açıklaması olan ürünler
    const missingMeta = products
      .filter((p: any) => !p.seoDesc || String(p.seoDesc).trim().length < 20)
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        path: `/urun/${p.slug || p.id}`,
        desc: p.seoDesc || "",
        fixed: false,
      }));

    // 2. Görsel alt/SEO başlığı optimize edilmemiş ürünler
    const missingAlt = products
      .filter((p: any) => !p.seoKeywords || String(p.seoKeywords).trim().length < 5)
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        location: `Ürün Görseli (${p.sku || p.id})`,
        alt: p.seoKeywords || "",
        fixed: false,
      }));

    // 3. Yinelenen veya eksik SEO başlığı (Title) olan ürünler
    const titleCounts = new Map<string, number>();
    products.forEach((p: any) => {
      const t = String(p.seoTitle || p.name || "").trim().toLowerCase();
      if (t) titleCounts.set(t, (titleCounts.get(t) || 0) + 1);
    });

    const duplicateOrMissingTitle = products
      .filter((p: any) => {
        const t = String(p.seoTitle || "").trim();
        if (!t) return true;
        return (titleCounts.get(t.toLowerCase()) || 0) > 1;
      })
      .map((p: any) => ({
        id: String(p.id),
        name: p.name,
        path: `/urun/${p.slug || p.id}`,
        currentTitle: p.seoTitle || p.name,
        newTitle: p.seoTitle || "",
        fixed: false,
      }));

    // 4. Düşük kelime sayısına sahip ürün açıklamaları (< 25 kelime)
    const lowWordCount = products
      .filter((p: any) => {
        const text = `${p.desc || ""} ${p.description || ""}`.trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        return words < 25;
      })
      .map((p: any) => {
        const text = `${p.desc || ""} ${p.description || ""}`.trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        return {
          id: String(p.id),
          name: p.name,
          path: `/urun/${p.slug || p.id}`,
          currentWords: words,
          targetWords: 30,
          textToAdd: "",
          fixed: false,
        };
      });

    return NextResponse.json({
      counts: {
        meta: missingMeta.length,
        alt: missingAlt.length,
        duplicate: duplicateOrMissingTitle.length,
        wordcount: lowWordCount.length,
      },
      metaPages: missingMeta,
      altImages: missingAlt,
      duplicatePages: duplicateOrMissingTitle,
      lowWords: lowWordCount,
    });
  } catch (err: any) {
    console.error("[SEO AUDIT GET ERROR]:", err);
    return NextResponse.json({ error: err?.message || "SEO taraması yapılamadı." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { type, id, value } = body || {};

    if (!type || !id || !String(value || "").trim()) {
      return NextResponse.json({ error: "Geçersiz parametreler." }, { status: 400 });
    }

    const products = readLocalProducts();
    const target = products.find((p: any) => String(p.id) === String(id));
    if (!target) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 });
    }

    const cleanVal = String(value).trim();
    const updatePatch: any = { ...target };
    const prismaPatch: any = {};

    if (type === "meta") {
      updatePatch.seoDesc = cleanVal;
      prismaPatch.seoDesc = cleanVal;
    } else if (type === "alt") {
      updatePatch.seoKeywords = cleanVal;
      prismaPatch.seoKeywords = cleanVal;
    } else if (type === "duplicate") {
      updatePatch.seoTitle = cleanVal;
      prismaPatch.seoTitle = cleanVal;
    } else if (type === "wordcount") {
      const combined = `${target.desc || ""} ${cleanVal}`.trim();
      updatePatch.desc = combined;
      prismaPatch.desc = combined;
    }

    saveLocalProduct(updatePatch, true);

    try {
      await withTimeout(
        prisma.product.update({
          where: { id: String(id) },
          data: prismaPatch,
        }),
        1500,
        null
      );
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[SEO AUDIT POST ERROR]:", err);
    return NextResponse.json({ error: err?.message || "Güncelleme başarısız." }, { status: 500 });
  }
}
