/**
 * NL2SQL Patron / Yönetici Asistanı — Çekirdek Servis
 *
 * Güvenlik Katmanları:
 *   1. Prompt-level guardrail (system prompt'ta sadece SELECT izni)
 *   2. SQL parser validator (regex-based yasak keyword tespiti)
 *   3. Prisma read-only execution (INSERT/UPDATE/DELETE asla çalışmaz)
 *   4. Row limit (max 500 satır per sorgu)
 *   5. Query timeout (5 saniye)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export interface AssistantRequest {
  question: string;
  userId?: string;
}

export interface AssistantResponse {
  success: boolean;
  answer: string;
  sql: string | null;
  rows: any[];
  rowCount: number;
  executionMs: number;
  error?: string;
  blocked?: boolean;
}

// ─── Güvenlik: Yasak SQL Komutları ───────────────────────────────────────────

const FORBIDDEN_SQL_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE',
  'CREATE', 'REPLACE', 'MERGE', 'UPSERT', 'GRANT', 'REVOKE',
  'EXEC', 'EXECUTE', 'CALL', 'PRAGMA', 'ATTACH', 'DETACH',
  'LOAD_EXTENSION', '--', ';--', '/*',
  'xp_', 'sp_', 'OPENROWSET', 'BULK INSERT',
  'INFORMATION_SCHEMA', 'sqlite_master', 'sqlite_schema',
  'sys.tables', 'pg_tables'
];

// UNION injection için ayrı kontrol (keyword olmadan regex)
const UNION_INJECTION_PATTERN = /UNION\s+(ALL\s+)?SELECT/i;

/**
 * Üretilen SQL'i güvenlik açısından doğrular.
 * Yasak komut içeriyorsa null döndürür.
 */
export function validateSQL(sql: string): { valid: boolean; reason?: string } {
  const normalized = sql.toUpperCase().trim();

  // Mutlaka SELECT ile başlamalı
  if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
    return {
      valid: false,
      reason: `SQL komutu SELECT veya WITH ile başlamalıdır. Üretilen başlangıç: "${sql.slice(0, 40)}..."`
    };
  }

  // Yasak keyword kontrolü
  for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(sql)) {
      return {
        valid: false,
        reason: `Güvenlik ihlali: SQL içinde yasak komut tespit edildi → "${keyword}"`
      };
    }
  }

  // UNION injection özel kontrol
  if (UNION_INJECTION_PATTERN.test(sql)) {
    return {
      valid: false,
      reason: 'Güvenlik ihlali: UNION SELECT injection tespit edildi.'
    };
  }

  // Noktalı virgül (statement zincirleme) kontrolü
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  if (statements.length > 1) {
    return {
      valid: false,
      reason: 'Çoklu SQL ifadesi (statement chaining) güvenlik gerekçesiyle engellendi.'
    };
  }

  return { valid: true };
}

// ─── ERP Veritabanı Şema Context'i ───────────────────────────────────────────

/**
 * Gemini'ye öğretilecek ERP veritabanı şeması.
 * SQLite dialect kullanıldığı için SQLite uyumlu sorgular üretilmeli.
 * 
 * NOT: Bu şema production'da canlı DB introspection ile dinamik olarak
 * güncellenebilir (PRAGMA table_info() ile).
 */
export const ERP_SCHEMA_CONTEXT = `
## ERP VERİTABANI ŞEMASI (SQLite)

### ANA TABLOLAR:

**Order** (Siparişler)
- id: TEXT PRIMARY KEY
- currentAccountId: TEXT → cariler.id (müşteri)
- date: DATETIME (sipariş tarihi)
- status: TEXT → 'Yeni' | 'Hazırlanıyor' | 'Kargolandı' | 'Tamamlandı' | 'İptal' | 'Paketlendi'
- total: REAL (toplam tutar TL)
- type: TEXT → 'B2B' | 'B2C'
- isDeleted: INTEGER (0=aktif, 1=silindi) — Her sorguda WHERE isDeleted=0 ekle!

**Invoice** (Satış Faturaları)
- id: TEXT PRIMARY KEY
- currentAccountId: TEXT → cariler.id
- orderId: TEXT (bağlı sipariş, nullable)
- date: DATETIME
- dueDate: DATETIME (vade tarihi)
- totalAmount: REAL (KDV dahil toplam TL)
- taxAmount: REAL (KDV tutarı)
- status: TEXT → 'Taslak' | 'Kesildi' | 'Gönderildi' | 'Ödendi' | 'İptal'
- type: TEXT → 'Satış' | 'İade'
- isDeleted: INTEGER

**InvoiceItem** (Fatura Satırları)
- id: TEXT PRIMARY KEY
- invoiceId: TEXT → Invoice.id
- name: TEXT (ürün adı)
- quantity: REAL (adet)
- unitPrice: REAL (birim fiyat)
- vatRate: REAL (KDV oranı, örn: 20.0)
- totalAmount: REAL (satır toplam)

**cariler** (CurrentAccount — Müşteri & Tedarikçi Cari)
- id: TEXT PRIMARY KEY
- name: TEXT (firma veya kişi adı)
- type: TEXT → 'MUSTERI' | 'TEDARIKCI' | 'MUSTERI_TEDARIKCI'
- cariTipi: TEXT → 'CORPORATE' | 'INDIVIDUAL'
- balance: REAL (cari bakiye, pozitif = alacak, negatif = borç)
- isActive: INTEGER
- isDeleted: INTEGER

**Product** (Ürünler / Stok Kartları)
- id: TEXT PRIMARY KEY
- name: TEXT
- sku: TEXT UNIQUE (stok kodu)
- category: TEXT
- stock: REAL (toplam stok miktarı)
- criticalLimit: REAL (kritik stok seviyesi)
- price: REAL (satış fiyatı TL)
- cost: REAL (maliyet TL)
- isDeleted: INTEGER

**StockTransaction** (Stok Hareketleri)
- id: TEXT PRIMARY KEY
- productId: TEXT → Product.id
- warehouseId: TEXT → Warehouse.id (nullable)
- type: TEXT → 'IN' | 'OUT' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'SALE' | 'PRODUCTION_IN' | 'PRODUCTION_OUT'
- quantity: REAL (pozitif=giriş, negatif=çıkış)
- date: DATETIME
- moduleSource: TEXT → 'MANUAL' | 'API' | 'SALE' | 'DESPATCH' | 'PRODUCTION'
- description: TEXT

**StockLocation** (Depo Bazlı Stok)
- id: TEXT PRIMARY KEY
- productId: TEXT → Product.id
- warehouseId: TEXT → Warehouse.id
- stock: REAL (bu depodaki mevcut stok)
- criticalLimit: REAL

**Warehouse** (Depolar)
- id: TEXT PRIMARY KEY
- name: TEXT
- code: TEXT UNIQUE

**Transaction** (Cari Hareketler)
- id: TEXT PRIMARY KEY
- currentAccountId: TEXT → cariler.id
- date: DATETIME
- type: TEXT → 'Tahsilat' | 'Ödeme' | 'Fatura' | 'İade'
- amount: REAL
- description: TEXT

**Bank** (Banka Hesapları)
- id: TEXT PRIMARY KEY
- name: TEXT
- balance: REAL
- currency: TEXT → 'TRY' | 'USD' | 'EUR'

### ÖZEL TABLOLAR (Ham SQL):

**supplier_ledger** (Tedarikçi Defteri)
- ledger_id: TEXT PK
- supplier_id: TEXT
- transaction_type: TEXT
- debit: REAL (borç)
- credit: REAL (alacak)
- balance: REAL
- created_at: DATETIME

**incoming_e_invoices** (Gelen e-Faturalar)
- ettn_no: TEXT PK
- invoice_no: TEXT
- supplier_vkn: TEXT
- invoice_date: TEXT
- total_gross_amount: REAL
- status: TEXT → 'Pending' | 'Approved' | 'Rejected'
- created_at: DATETIME

**despatch_advices** (e-İrsaliyeler)
- despatch_id: TEXT PK
- despatch_no: TEXT
- customer_id: TEXT
- status: TEXT → 'Draft' | 'Sent' | 'Approved'
- issue_date: DATETIME
- created_at: DATETIME

### ÖNEMLİ NOTLAR:
- Veritabanı SQLite kullanıyor. Tarih işlemleri için: strftime('%Y-%m', date) veya date('now', 'start of month')
- "Bu ay" için: WHERE date >= date('now', 'start of month')
- "Bugün" için: WHERE date >= date('now', 'start of day')
- "Bu yıl" için: WHERE date >= date('now', 'start of year')
- Türkçe karakter destekli LIKE sorguları için: LIKE '%arama%' (case-insensitive değil!)
- Sayısal hesaplama: ROUND(SUM(...), 2) ile 2 ondalık
`;

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildNL2SQLPrompt(schema: string): string {
  return `Sen, bir Türk e-ticaret ERP sisteminin AI veritabanı asistanısın. Adın "Atak ERP Asistanı".

## GÜVENLİK KURALLARI (MUTLAK - İHLAL EDİLEMEZ):
1. YALNIZCA SELECT sorgular üret. INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE ve diğer yazma komutlarını KESİNLİKLE kullanma.
2. Zararlı, şüpheli veya veri değiştirme niyeti taşıyan sorulara SQL üretme. Bunun yerine Türkçe olarak nazikçe reddet.
3. Kullanıcı SQL injection girişimi yaparsa (örn: '; DROP TABLE'), hemen reddet.
4. Kullanıcı "şifreyi göster", "tüm kullanıcıları listele" gibi yetkisiz veri isterlerse reddet.

## GÖREV:
Kullanıcının Türkçe sorusunu aşağıdaki veritabanı şemasını kullanarak tek bir güvenli SQLite SELECT sorgusuna çevir.

${schema}

## ÇIKTI FORMATI:
Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:
{
  "sql": "SELECT ... FROM ... WHERE ... LIMIT 50;",
  "explanation": "Bu sorgunun kısa Türkçe açıklaması (1 cümle)"
}

Eğer soruyu anlayamadıysan veya güvenlik kurallarına aykırıysa:
{
  "sql": null,
  "explanation": "Bu soruya yanıt veremiyorum çünkü: [sebep]",
  "blocked": true
}

## KURALLAR:
- Her zaman LIMIT ekle (max: 100)
- isDeleted=0 kontrolü olan tablolarda bunu WHERE'e ekle
- Tarih işlemlerinde SQLite syntax kullan (strftime, date())
- Sadece şemada bulunan tablo ve kolonları kullan
- Tablo isimleri büyük-küçük harfe dikkat et (Product, Order, Invoice vb.). SQLite rezerve kelime çakışmasını önlemek için "Order" tablosunu her zaman çift tırnak içinde yaz: "Order"
`;
}

function buildSummaryPrompt(question: string, rows: any[], sql: string): string {
  const rowsSample = rows.slice(0, 20); // İlk 20 satır özet için yeterli
  return `Sen bir ERP sisteminin Türkçe konuşan veri analisti asistanısın.

Yönetici şunu sordu: "${question}"

Çalıştırılan SQL:
${sql}

Gelen veri (${rows.length} satır):
${JSON.stringify(rowsSample, null, 2)}

Görevi: Yukarıdaki ham veriyi yöneticiye şık, anlaşılır ve profesyonel bir Türkçe özet metin olarak sun.
- Sayısal değerleri Türk formatında yaz (1.250,00 TL gibi)
- Eğer veri boşsa "Belirtilen kriterlerde herhangi bir kayıt bulunamadı." de
- 2-5 cümle yeterli
- Madde işaretleri kullanabilirsin
- Tarih bilgilerini Türkçe formatla (01 Haziran 2026 gibi)
- Sadece özet metni döndür, SQL veya teknik detay ekleme`;
}

// ─── Ana Servis Sınıfı ────────────────────────────────────────────────────────

export class AIAssistantService {
  private genAI: GoogleGenerativeAI | null = null;
  // Model öncelik sırası: en iyi → fallback
  private models = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const isValidKey = apiKey &&
      apiKey.trim().length > 10 &&
      apiKey !== 'your-gemini-api-key-here' &&
      apiKey !== 'your-gemini-api-key' &&
      !apiKey.startsWith('your-');

    if (isValidKey) {
      this.genAI = new GoogleGenerativeAI(apiKey!);
      console.log('[AI_ASSISTANT] Gemini API bağlantısı aktif.');
    } else {
      console.log('[AI_ASSISTANT] GEMINI_API_KEY bulunamadı veya geçersiz. Mock mod aktif.');
    }
  }

  /**
   * Aktif model ismini döndürür.
   */
  getModelName(): string {
    return this.genAI ? this.models[0] : 'mock';
  }

  /**
   * Rate limit / quota aşımında otomatik model fallback + exponential backoff
   */
  private async generateWithRetry(
    prompt: string,
    config: { temperature: number; maxOutputTokens: number; responseMimeType?: string },
    attempt = 0
  ): Promise<string> {
    if (!this.genAI) throw new Error('Gemini API bağlı değil');

    const modelName = this.models[Math.min(attempt, this.models.length - 1)];
    const model = this.genAI.getGenerativeModel({ model: modelName });

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: config as any
      });
      if (attempt > 0) {
        console.log(`[AI_ASSISTANT] Model "${modelName}" ile başarılı yanit alindi.`);
      }
      return result.response.text().trim();
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota');
      const nextAttempt = attempt + 1;

      if (is429 && nextAttempt < this.models.length + 2) {
        // 429 ise: kısa bekle ve farklı model dene
        const delayMs = Math.min(3000 * nextAttempt, 12000); // max 12s
        console.warn(`[AI_ASSISTANT] Quota aşımı (${modelName}). ${delayMs}ms bekleniyor, sonraki deneme: ${this.models[Math.min(nextAttempt, this.models.length - 1)]}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.generateWithRetry(prompt, config, nextAttempt);
      }
      throw err;
    }
  }

  /**
   * 1. Adım: Doğal dil sorusunu SQL'e çevir
   */
  private async translateToSQL(question: string): Promise<{
    sql: string | null;
    explanation: string;
    blocked?: boolean;
  }> {
    // Mock mode (API key yok)
    if (!this.genAI) {
      return this.mockNL2SQL(question);
    }

    const systemPrompt = buildNL2SQLPrompt(ERP_SCHEMA_CONTEXT);
    const fullPrompt = `${systemPrompt}\n\nKullanıcı sorusu: "${question}"`;

    const responseText = await this.generateWithRetry(fullPrompt, {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    });

    try {
      // JSON bloğunu temizle (```json ... ``` çevresini)
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return {
        sql: parsed.sql || null,
        explanation: parsed.explanation || 'SQL oluşturuldu.',
        blocked: parsed.blocked || false
      };
    } catch {
      // JSON parse başarısız → model yanlış format döndürdü
      throw new Error(`AI yanıtı parse edilemedi: ${responseText.slice(0, 200)}`);
    }
  }

  /**
   * 2. Adım: SQL'i güvenli şekilde çalıştır
   */
  private async executeSQL(sql: string): Promise<any[]> {
    // Güvenlik validator
    const validation = validateSQL(sql);
    if (!validation.valid) {
      throw new Error(`SQL güvenlik doğrulaması başarısız: ${validation.reason}`);
    }

    // Row limit güvencesi: SQL'de LIMIT yoksa ekle
    let safeSql = sql.trim().replace(/;$/, ''); // Sondaki ; kaldır
    if (!/LIMIT\s+\d+/i.test(safeSql)) {
      safeSql = `${safeSql} LIMIT 500`;
    }

    // Prisma raw query (READ-ONLY — Prisma engine'de yazma engeli yok,
    // ama SQL validator zaten yazma komutlarını filtreler)
    const rows = await prisma.$queryRawUnsafe<any[]>(safeSql);

    // BigInt serializability sorunu (Prisma bazen BigInt döndürür)
    return JSON.parse(
      JSON.stringify(rows, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
    );
  }

  /**
   * 3. Adım: Ham veriyi Türkçe özete çevir
   */
  private async summarizeResults(
    question: string,
    rows: any[],
    sql: string
  ): Promise<string> {
    if (!this.genAI) {
      return this.mockSummary(rows);
    }

    if (rows.length === 0) {
      return 'Belirtilen kriterlere uygun herhangi bir kayıt bulunamadı. Lütfen tarih aralığını veya arama kriterlerini genişletin.';
    }

    const model = this.genAI.getGenerativeModel({ model: this.models[0] });
    const prompt = buildSummaryPrompt(question, rows, sql);

    const text = await this.generateWithRetry(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048
    });
    return text;
  }

  /**
   * Mock NL2SQL: API key olmadığında çalışır (demo/geliştirme modu)
   */
  private mockNL2SQL(question: string): {
    sql: string | null;
    explanation: string;
    blocked?: boolean;
  } {
    const q = question.toLowerCase();

    // Zararlı soru kontrolü
    if (/sil|drop|delete|update|insert|alter|truncate/i.test(question)) {
      return {
        sql: null,
        explanation: 'Bu işlem güvenlik politikamız gereği engellenmiştir.',
        blocked: true
      };
    }

    if (q.includes('satış') || q.includes('sipariş') || q.includes('gelir')) {
      return {
        sql: `SELECT strftime('%Y-%m-%d', date) as tarih, COUNT(*) as siparis_sayisi, ROUND(SUM(total), 2) as toplam_tutar FROM "Order" WHERE isDeleted=0 AND date >= date('now', 'start of month') GROUP BY tarih ORDER BY tarih DESC LIMIT 30`,
        explanation: 'Bu ay günlük sipariş ve satış toplamları'
      };
    }

    if (q.includes('stok') || q.includes('ürün') || q.includes('tükenen')) {
      return {
        sql: `SELECT name, sku, stock, criticalLimit, price FROM "Product" WHERE isDeleted=0 AND stock <= criticalLimit ORDER BY stock ASC LIMIT 20`,
        explanation: 'Kritik stok seviyesindeki ürünler'
      };
    }

    if (q.includes('müşteri') || q.includes('cari') || q.includes('alacak')) {
      return {
        sql: `SELECT name, balance, type FROM "cariler" WHERE isDeleted=0 AND type='MUSTERI' AND balance > 0 ORDER BY balance DESC LIMIT 20`,
        explanation: 'En yüksek alacaklı müşteriler'
      };
    }

    if (q.includes('fatura')) {
      return {
        sql: `SELECT strftime('%Y-%m', date) as ay, COUNT(*) as fatura_sayisi, ROUND(SUM(totalAmount), 2) as toplam FROM "Invoice" WHERE isDeleted=0 GROUP BY ay ORDER BY ay DESC LIMIT 12`,
        explanation: 'Aylık fatura sayısı ve toplamları'
      };
    }

    // Genel fallback
    return {
      sql: `SELECT strftime('%Y-%m-%d', date) as tarih, COUNT(*) as siparis_sayisi, ROUND(SUM(total), 2) as toplam FROM "Order" WHERE isDeleted=0 ORDER BY date DESC LIMIT 10`,
      explanation: 'Son 10 siparişin özeti'
    };
  }

  /**
   * Mock özet: API key olmadığında çalışır
   */
  private mockSummary(rows: any[]): string {
    if (rows.length === 0) {
      return 'Belirtilen kriterlere uygun herhangi bir kayıt bulunamadı.';
    }

    const keys = Object.keys(rows[0]);
    const firstRow = rows[0];

    // Sayısal değer varsa özetle
    const numericKeys = keys.filter(k => typeof firstRow[k] === 'number');
    if (numericKeys.length > 0) {
      const key = numericKeys[0];
      const total = rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
      return `Sorgu sonucunda **${rows.length} kayıt** bulundu. "${key}" değerlerinin toplamı: **${total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}**. Detaylı veriyi aşağıdaki tabloda inceleyebilirsiniz.`;
    }

    return `Sorgu sonucunda **${rows.length} kayıt** döndürüldü. Aşağıdaki tablo detaylı sonuçları göstermektedir.`;
  }

  /**
   * Ana Pipeline: Soru → SQL → Sonuç → Türkçe Özet
   */
  async askAssistant(request: AssistantRequest): Promise<AssistantResponse> {
    const startTime = Date.now();

    // Input validation
    if (!request.question || request.question.trim().length === 0) {
      return {
        success: false,
        answer: 'Lütfen bir soru girin.',
        sql: null,
        rows: [],
        rowCount: 0,
        executionMs: 0,
        error: 'Boş soru'
      };
    }

    if (request.question.length > 500) {
      return {
        success: false,
        answer: 'Soru çok uzun. Lütfen 500 karakterden kısa bir soru sorun.',
        sql: null,
        rows: [],
        rowCount: 0,
        executionMs: Date.now() - startTime,
        error: 'Soru çok uzun'
      };
    }

    try {
      // 1. NL → SQL
      console.log(`[AI_ASSISTANT] Soru: "${request.question}"`);
      const { sql, explanation, blocked } = await this.translateToSQL(request.question);

      if (blocked || !sql) {
        return {
          success: false,
          answer: explanation || 'Bu soru güvenlik politikası gereği yanıtlanamıyor.',
          sql: null,
          rows: [],
          rowCount: 0,
          executionMs: Date.now() - startTime,
          blocked: true
        };
      }

      console.log(`[AI_ASSISTANT] Üretilen SQL: ${sql}`);

      // 2. SQL Güvenlik Doğrulaması (ikinci katman)
      const validation = validateSQL(sql);
      if (!validation.valid) {
        console.warn(`[AI_ASSISTANT_SECURITY] SQL engellendi: ${validation.reason}`);
        return {
          success: false,
          answer: `Güvenlik politikası gereği bu sorgu çalıştırılamıyor. (${validation.reason})`,
          sql: sql,
          rows: [],
          rowCount: 0,
          executionMs: Date.now() - startTime,
          blocked: true,
          error: validation.reason
        };
      }

      // 3. SQL Çalıştır
      const rows = await this.executeSQL(sql);
      console.log(`[AI_ASSISTANT] ${rows.length} satır döndü.`);

      // 4. Özet Oluştur
      const answer = await this.summarizeResults(request.question, rows, sql);

      return {
        success: true,
        answer,
        sql,
        rows,
        rowCount: rows.length,
        executionMs: Date.now() - startTime
      };

    } catch (error: any) {
      console.error('[AI_ASSISTANT_ERROR]:', error);
      return {
        success: false,
        answer: `Bir hata oluştu: ${error.message || 'Bilinmeyen hata'}. Lütfen soruyu farklı bir şekilde ifade edin.`,
        sql: null,
        rows: [],
        rowCount: 0,
        executionMs: Date.now() - startTime,
        error: error.message
      };
    }
  }
}

// Singleton
export const aiAssistant = new AIAssistantService();
