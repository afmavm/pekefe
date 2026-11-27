import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-helpers';
import { saveLocalProductsBulk } from '@/lib/jsonProductDb';
import { FALLBACK_PRODUCTS } from '@/lib/fallbackProducts';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth && 'authorized' in auth && !auth.authorized) {
      return auth.response;
    }

    const body = await request.json().catch(() => ({}));
    const rawProducts = Array.isArray(body) ? body : (Array.isArray(body?.products) ? body.products : []);
    const updateExisting = body.updateExisting !== undefined ? Boolean(body.updateExisting) : true;

    if (!rawProducts || rawProducts.length === 0) {
      return NextResponse.json({ error: 'İçe aktarılacak ürün listesi boş.' }, { status: 400 });
    }

    // Clean and validate each product
    const cleanedProducts: any[] = [];
    const validationErrors: { row: number; name?: string; message: string }[] = [];

    for (let i = 0; i < rawProducts.length; i++) {
      const p = rawProducts[i];
      const rowNum = i + 1;

      if (!p || typeof p !== 'object') {
        validationErrors.push({ row: rowNum, message: 'Geçersiz satır biçimi' });
        continue;
      }

      const name = String(p.name || p.ÜrünAdı || p['Ürün Adı'] || p.title || '').trim();
      if (!name || name.length < 2) {
        validationErrors.push({ row: rowNum, name, message: 'Ürün adı en az 2 karakter olmalıdır' });
        continue;
      }

      const rawPrice = p.price ?? p.sale_price ?? p['Satış Fiyatı'] ?? p.Fiyat ?? 0;
      const price = Number(rawPrice);
      if (isNaN(price) || price <= 0) {
        validationErrors.push({ row: rowNum, name, message: 'Geçersiz satış fiyatı. Fiyat 0\'dan büyük olmalıdır.' });
        continue;
      }

      const rawListPrice = p.list_price ?? p.oldPrice ?? p['Liste Fiyatı'] ?? p['Piyasa Fiyatı'] ?? price;
      const listPrice = Number(rawListPrice) || price;

      const rawStock = p.stock ?? p.stock_quantity ?? p['Stok'] ?? p['Mevcut Stok'] ?? 0;
      const stock = Math.max(0, Number(rawStock) || 0);

      const rawCost = p.cost ?? p['Maliyet'] ?? Math.round(price * 0.45);
      const cost = Math.max(0, Number(rawCost) || 0);

      const rawSku = String(p.sku || p['Stok Kodu'] || p.SKU || p.kod || '').trim();
      const sku = rawSku || `PKF-${Math.floor(100000 + Math.random() * 900000)}`;

      const category = String(p.category || p['Kategori'] || 'Dut Pekmezi').trim();
      const unit = String(p.unit || p['Birim'] || 'Adet').trim();
      const desc = String(p.desc || p.shortDesc || p['Açıklama'] || '').trim();
      const barcode = String(p.barcode || p['Barkod'] || '').trim();
      const image = String(p.image || p['Görsel URL'] || '').trim();

      const activeRaw = p.active ?? p.isPublished ?? p['Durum'] ?? true;
      const active = activeRaw === true || activeRaw === 'Yayında' || activeRaw === 'Aktif' || activeRaw === 1 || activeRaw === '1';

      const criticalLimit = Math.max(0, Number(p.criticalLimit ?? p['Kritik Stok Limiti'] ?? p['Kritik Limit'] ?? 5) || 5);

      cleanedProducts.push({
        id: p.id,
        name,
        sku,
        category,
        stock,
        stock_quantity: stock,
        criticalLimit,
        price,
        sale_price: price,
        oldPrice: listPrice,
        list_price: listPrice,
        cost,
        unit,
        barcode,
        desc,
        shortDesc: desc,
        image: image || (category.toLowerCase().includes('pekmez') ? '/pekefe-dut-pekmezi-kavanoz-tr.jpg' : (category.toLowerCase().includes('kome') ? '/ispir-kome-beyaz.png' : '/pekefe-dut-pekmezi-kavanoz-tr.jpg')),
        active,
        isPublished: active,
        attributes: {
          isActive: active,
          active,
          isPublished: active,
          webPrice: price,
          salePrice: price,
          unit,
          barcode,
        }
      });
    }

    if (cleanedProducts.length === 0) {
      return NextResponse.json({
        error: 'İçe aktarılacak geçerli ürün bulunamadı.',
        validationErrors
      }, { status: 400 });
    }

    // 1. Save to JSON database (Primary local persistence)
    const jsonResult = saveLocalProductsBulk(cleanedProducts, updateExisting);

    // 2. Mirror into FALLBACK_PRODUCTS memory array
    for (const savedProd of jsonResult.products) {
      const existingIdx = FALLBACK_PRODUCTS.findIndex((fp: any) => fp.id === savedProd.id || fp.sku === savedProd.sku);
      if (existingIdx !== -1) {
        if (updateExisting) {
          FALLBACK_PRODUCTS[existingIdx] = { ...FALLBACK_PRODUCTS[existingIdx], ...savedProd };
        }
      } else {
        FALLBACK_PRODUCTS.unshift(savedProd as any);
      }
    }

    // 3. Try to sync to Prisma database if connection is available
    let dbSuccessCount = 0;
    try {
      for (const p of cleanedProducts) {
        try {
          const existingDb = await prisma.product.findUnique({ where: { sku: p.sku }, select: { id: true } });
          if (existingDb && !updateExisting) {
            continue;
          }
          if (existingDb) {
            await prisma.product.update({
              where: { id: existingDb.id },
              data: {
                name: p.name,
                category: p.category,
                stock: p.stock,
                criticalLimit: p.criticalLimit,
                price: p.price,
                sale_price: p.sale_price,
                list_price: p.list_price,
                oldPrice: p.oldPrice,
                cost: p.cost,
                desc: p.desc || undefined,
                image: p.image || undefined,
                attributes: p.attributes,
                isDeleted: false
              }
            });
          } else {
            await prisma.product.create({
              data: {
                name: p.name,
                sku: p.sku,
                category: p.category,
                stock: p.stock,
                criticalLimit: p.criticalLimit,
                price: p.price,
                sale_price: p.sale_price,
                list_price: p.list_price,
                oldPrice: p.oldPrice,
                cost: p.cost,
                desc: p.desc || null,
                image: p.image || null,
                attributes: p.attributes,
                isDeleted: false
              }
            });
          }
          dbSuccessCount++;
        } catch (itemErr) {
          // ignore individual item Prisma error if Prisma offline
        }
      }
    } catch (dbErr) {
      // Prisma offline, JSON DB successfully handled it
    }

    // Revalidate paths for instant client-side sync
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/admin/stock');
      revalidatePath('/admin/dashboard');
      revalidatePath('/api/products');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `${jsonResult.added} yeni ürün eklendi, ${jsonResult.updated} ürün güncellendi.`,
      added: jsonResult.added,
      updated: jsonResult.updated,
      total: jsonResult.total,
      validationErrors,
      products: jsonResult.products
    });

  } catch (error: any) {
    console.error('Bulk products import error:', error);
    return NextResponse.json({
      error: error?.message || 'Toplu ürün içe aktarılırken bir hata oluştu.'
    }, { status: 500 });
  }
}
