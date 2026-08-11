/**
 * POST /api/ai-assistant/ask
 *
 * Patron / Yönetici AI Asistanı — API Endpoint
 *
 * Güvenlik:
 *   - requireAdmin() ile sadece admin/yönetici erişimi
 *   - Rate limiting (10 istek/dakika per kullanıcı)
 *   - Input boyutu sınırı (500 karakter)
 *   - SQL validator (multi-layer)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-helpers';
import { aiAssistant } from '@/modules/ai-assistant/nl2sql-service';

// In-memory rate limiter (production'da Redis ile değiştirin)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 10;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 dakika

  const existing = rateLimitMap.get(userId);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - 1, resetIn: windowMs };
  }

  if (existing.count >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existing.resetAt - now
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_PER_MINUTE - existing.count,
    resetIn: existing.resetAt - now
  };
}

export async function POST(request: NextRequest) {
  // 1. Yetki kontrolü
  const auth = await requirePermission('use_ai_assistant', request);
  if (!auth.ok) return auth.response;

  const userId = auth.session?.user?.id || 'anonymous';

  // 2. Rate limit kontrolü
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika sonra tekrar deneyin.',
        resetInSeconds: Math.ceil(rateCheck.resetIn / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_PER_MINUTE),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateCheck.resetIn / 1000))
        }
      }
    );
  }

  // 3. Request body parse
  let body: { question?: string; debug?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Geçersiz JSON formatı.' },
      { status: 400 }
    );
  }

  const { question, debug = false } = body;

  // 4. Input validation
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: '"question" alanı zorunludur ve boş olamaz.' },
      { status: 400 }
    );
  }

  if (question.length > 500) {
    return NextResponse.json(
      { success: false, error: 'Soru 500 karakterden uzun olamaz.' },
      { status: 400 }
    );
  }

  // 5. AI Assistant pipeline'ı çalıştır
  try {
    console.log(`[AI_ASSISTANT_API] User: ${userId} | Soru: "${question.slice(0, 80)}..."`);

    const result = await aiAssistant.askAssistant({
      question: question.trim(),
      userId
    });

    // 6. Response oluştur
    const response: Record<string, any> = {
      success: result.success,
      answer: result.answer,
      rowCount: result.rowCount,
      executionMs: result.executionMs,
      rateLimit: {
        remaining: rateCheck.remaining,
        resetInSeconds: Math.ceil(rateCheck.resetIn / 1000)
      }
    };

    // Debug modu: SQL ve ham veriyi ekle
    if (debug) {
      response.sql = result.sql;
      response.rows = result.rows?.slice(0, 50); // Max 50 satır debug'da
    }

    // Bloklanan sorgular için
    if (result.blocked) {
      response.blocked = true;
    }

    // Hata varsa
    if (!result.success && result.error) {
      response.errorDetail = result.error;
    }

    const statusCode = result.success ? 200 : result.blocked ? 403 : 500;

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        'X-RateLimit-Limit': String(RATE_LIMIT_PER_MINUTE),
        'X-RateLimit-Remaining': String(rateCheck.remaining),
        'X-AI-Model': aiAssistant.getModelName(),
        'X-Execution-Ms': String(result.executionMs)
      }
    });

  } catch (error: any) {
    console.error('[AI_ASSISTANT_API_ERROR]:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Servis geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET: Sağlık kontrolü ve durum bilgisi
export async function GET(request: NextRequest) {
  const auth = await requirePermission('use_ai_assistant', request);
  if (!auth.ok) return auth.response;

  const hasApiKey = !!(process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim().length > 0 &&
    process.env.GEMINI_API_KEY !== 'your-gemini-api-key');

  return NextResponse.json({
    status: 'operational',
    mode: hasApiKey ? 'live' : 'mock',
    model: aiAssistant.getModelName(),
    rateLimitPerMinute: RATE_LIMIT_PER_MINUTE,
    features: [
      'NL2SQL (Natural Language to SQL)',
      'Turkish language support',
      'Read-only guardrails',
      'Multi-layer SQL validation',
      'Result summarization'
    ],
    schema: {
      tables: [
        'Order', 'Invoice', 'InvoiceItem', 'CurrentAccount (cariler)',
        'Product', 'StockTransaction', 'StockLocation', 'Warehouse',
        'Transaction', 'Bank', 'supplier_ledger', 'incoming_e_invoices',
        'despatch_advices'
      ]
    },
    message: hasApiKey
      ? 'Gemini API bağlantısı aktif. Gerçek AI yanıtları için hazır.'
      : '⚠️ GEMINI_API_KEY bulunamadı. Mock mod aktif. .env dosyasına GEMINI_API_KEY ekleyin.'
  });
}
