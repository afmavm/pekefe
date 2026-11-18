import fs from 'fs';
import path from 'path';

export interface LocalCategory {
  id: string;
  name: string;
  parentId: string | null;
  attributes?: any[];
  variants?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_CATEGORIES: LocalCategory[] = [
  { id: "PKF-KAT-001", name: "Pestil - Köme", parentId: null, attributes: [], variants: [] },
  { id: "PKF-KAT-002", name: "Geleneksel Pekmezler", parentId: null, attributes: [], variants: [] },
  { id: "PKF-KAT-003", name: "Yöresel Peynirler & Bal", parentId: null, attributes: [], variants: [] },
  { id: "PKF-KAT-004", name: "Arıcılık Ekipmanları", parentId: null, attributes: [], variants: [] },
];

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'categories_db.json');

let _writeLock: Promise<void> = Promise.resolve();

export function readLocalCategories(): LocalCategory[] {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(DEFAULT_CATEGORIES, null, 2), 'utf8');
      return DEFAULT_CATEGORIES;
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(content);
    if (!Array.isArray(data) || data.length === 0) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(DEFAULT_CATEGORIES, null, 2), 'utf8');
      return DEFAULT_CATEGORIES;
    }
    return data;
  } catch (e) {
    console.error('[JSON CATEGORY DB] Okuma hatası:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveLocalCategoriesBulk(categories: LocalCategory[]): void {
  _writeLock = _writeLock.then(() => {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(categories, null, 2), 'utf8');
    } catch (e) {
      console.error('[JSON CATEGORY DB] Toplu kayıt hatası:', e);
    }
  });
}

export function saveLocalCategory(category: Partial<LocalCategory>): LocalCategory {
  const current = readLocalCategories();
  
  let customId = category.id;
  if (!customId || customId.startsWith("cms")) {
    customId = `PKF-KAT-${String(current.length + 1).padStart(3, '0')}`;
  }

  const categoryToSave: LocalCategory = {
    id: customId,
    name: category.name || 'Yeni Kategori',
    parentId: category.parentId ? String(category.parentId) : null,
    attributes: Array.isArray(category.attributes) ? category.attributes : [],
    variants: Array.isArray(category.variants) ? category.variants : [],
    createdAt: category.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existingIndex = current.findIndex(c => String(c.id).trim().toLowerCase() === String(customId).trim().toLowerCase());

  if (existingIndex !== -1) {
    current[existingIndex] = {
      ...current[existingIndex],
      ...categoryToSave,
      id: current[existingIndex].id
    };
  } else {
    current.push(categoryToSave);
  }

  _writeLock = _writeLock.then(() => {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(current, null, 2), 'utf8');
    } catch (e) {
      console.error('[JSON CATEGORY DB] Kayıt hatası:', e);
    }
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

    const filtered = current.filter(c => !toDeleteIds.has(String(c.id).trim().toLowerCase()));

    _writeLock = _writeLock.then(() => {
      try {
        const dir = path.dirname(DB_FILE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(filtered, null, 2), 'utf8');
      } catch (e) {
        console.error('[JSON CATEGORY DB] Silme yazma hatası:', e);
      }
    });

    return {
      success: true,
      deletedIds: Array.from(toDeleteIds)
    };
  } catch (e) {
    console.error('[JSON CATEGORY DB] Silme hatası:', e);
    return { success: false, deletedIds: [] };
  }
}
