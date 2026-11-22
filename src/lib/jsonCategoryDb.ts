import fs from 'fs';
import path from 'path';
import {
  CategoryRecord,
  PEKEFE_DEFAULT_CATEGORIES,
  normalizeCategoryRecord,
  slugifyTr,
} from './category-utils';

export type LocalCategory = CategoryRecord;

export const DEFAULT_CATEGORIES: LocalCategory[] = PEKEFE_DEFAULT_CATEGORIES;

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'categories_db.json');

let _writeLock: Promise<void> = Promise.resolve();

function writeCategoriesFile(categories: LocalCategory[]) {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(categories, null, 2), 'utf8');
  } catch (e) {
    console.error('[JSON CATEGORY DB] Yazma hatası:', e);
  }
}

export function readLocalCategories(): LocalCategory[] {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      writeCategoriesFile(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(content);
    if (!Array.isArray(data) || data.length === 0) {
      writeCategoriesFile(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    // Eğer dosya eski şemadan kalma (hiç slug içermeyen) 4 kategori ise, yeni 5+12 mimariyi uygula
    const hasModernSlugs = data.some((c: any) => c?.slug === 'pestil-cesitleri' || c?.slug === 'pekmez-cesitleri');
    const isOldDefaultOnly =
      !hasModernSlugs &&
      data.every((c: any) => !c?.slug);

    if (isOldDefaultOnly) {
      writeCategoriesFile(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }

    return data.map((c: any, idx: number) => normalizeCategoryRecord(c, idx));
  } catch (e) {
    console.error('[JSON CATEGORY DB] Okuma hatası:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveLocalCategoriesBulk(categories: LocalCategory[]): void {
  const normalized = categories.map((c, idx) => normalizeCategoryRecord(c, idx));
  _writeLock = _writeLock.then(() => {
    writeCategoriesFile(normalized);
  });
}

export function ensureUniqueSlug(
  desiredSlug: string,
  allCategories: LocalCategory[],
  excludeId?: string
): string {
  const base = slugifyTr(desiredSlug) || 'kategori';
  let candidate = base;
  let counter = 2;
  const excludeNorm = excludeId ? String(excludeId).trim().toLowerCase() : null;

  while (
    allCategories.some(
      (c) =>
        c.slug === candidate &&
        (!excludeNorm || String(c.id).trim().toLowerCase() !== excludeNorm)
    )
  ) {
    candidate = `${base}-${counter}`;
    counter++;
  }
  return candidate;
}

export function saveLocalCategory(category: Partial<LocalCategory>): LocalCategory {
  const current = readLocalCategories();

  let customId = category.id;
  if (!customId || customId.startsWith('cms')) {
    let maxNum = current.length;
    current.forEach((c) => {
      const m = String(c.id).match(/PKF-KAT-(\d+)/i);
      if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    customId = `PKF-KAT-${String(maxNum + 1).padStart(3, '0')}`;
  }

  const existingIndex = current.findIndex(
    (c) => String(c.id).trim().toLowerCase() === String(customId).trim().toLowerCase()
  );
  const existing = existingIndex !== -1 ? current[existingIndex] : undefined;

  const finalName = (category.name !== undefined ? category.name : existing?.name || 'Yeni Kategori').trim();
  const rawSlug =
    category.slug !== undefined && category.slug !== ''
      ? category.slug
      : existing?.slug || finalName;
  const uniqueSlug = ensureUniqueSlug(rawSlug, current, customId);

  const categoryToSave: LocalCategory = {
    id: existing ? existing.id : customId,
    name: finalName,
    slug: uniqueSlug,
    parentId:
      category.parentId !== undefined
        ? category.parentId
          ? String(category.parentId)
          : null
        : existing?.parentId ?? null,
    shortDesc: category.shortDesc !== undefined ? category.shortDesc : existing?.shortDesc ?? null,
    seoDesc: category.seoDesc !== undefined ? category.seoDesc : existing?.seoDesc ?? null,
    metaTitle: category.metaTitle !== undefined ? category.metaTitle : existing?.metaTitle ?? null,
    metaDescription:
      category.metaDescription !== undefined
        ? category.metaDescription
        : existing?.metaDescription ?? null,
    image: category.image !== undefined ? category.image : existing?.image ?? null,
    sortOrder:
      typeof category.sortOrder === 'number'
        ? category.sortOrder
        : existing?.sortOrder ?? current.length + 1,
    isActive: category.isActive !== undefined ? Boolean(category.isActive) : existing?.isActive ?? true,
    attributes: Array.isArray(category.attributes)
      ? category.attributes
      : existing?.attributes || [],
    variants: Array.isArray(category.variants)
      ? category.variants
      : existing?.variants || [],
    createdAt: existing?.createdAt || category.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    current[existingIndex] = categoryToSave;
  } else {
    current.push(categoryToSave);
  }

  _writeLock = _writeLock.then(() => {
    writeCategoriesFile(current);
  });

  return categoryToSave;
}

export function deleteLocalCategory(id: string): { success: boolean; deletedIds: string[] } {
  try {
    const current = readLocalCategories();
    const cleanId = String(id).trim().toLowerCase();

    const toDeleteIds = new Set<string>();
    toDeleteIds.add(cleanId);

    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      for (const cat of current) {
        const catId = String(cat.id).trim().toLowerCase();
        const parentId = cat.parentId ? String(cat.parentId).trim().toLowerCase() : null;
        if (parentId && toDeleteIds.has(parentId) && !toDeleteIds.has(catId)) {
          toDeleteIds.add(catId);
          foundNew = true;
        }
      }
    }

    const originalDeletedIds = current
      .filter((c) => toDeleteIds.has(String(c.id).trim().toLowerCase()))
      .map((c) => c.id);

    const remaining = current.filter(
      (c) => !toDeleteIds.has(String(c.id).trim().toLowerCase())
    );

    _writeLock = _writeLock.then(() => {
      writeCategoriesFile(remaining);
    });

    return { success: true, deletedIds: originalDeletedIds };
  } catch (e) {
    console.error('[JSON CATEGORY DB] Silme hatası:', e);
    return { success: false, deletedIds: [] };
  }
}
