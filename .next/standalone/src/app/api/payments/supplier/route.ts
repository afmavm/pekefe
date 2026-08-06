import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  if (process.env.BYPASS_AUTH !== 'true') {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;
  }

  try {
    const body = await request.json();
    const {
      payment_no,
      supplier_id,
      payment_date,
      amount,
      currency,
      exchange_rate,
      payment_method,
      bank_account_id,
      reference_no,
      notes,
      settlements // Array of { invoice_id: string, applied_amount: number }
    } = body;

    // Girdi doğrulamaları
    if (!payment_no || !supplier_id || !payment_date || !amount || !payment_method) {
      return NextResponse.json(
        { error: 'payment_no, supplier_id, payment_date, amount ve payment_method alanları zorunludur.' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Ödeme tutarı sıfırdan büyük olmalıdır.' },
        { status: 400 }
      );
    }

    const rate = exchange_rate || 1.0;
    if (rate <= 0) {
      return NextResponse.json(
        { error: 'Döviz kuru sıfırdan büyük olmalıdır.' },
        { status: 400 }
      );
    }

    let paymentId = '';

    paymentId = crypto.randomUUID();
    const localAmount = Math.round(amount * rate * 100) / 100;

    await prisma.$transaction(async (tx) => {
      // 1. Mükerrer ödeme kontrolü
      const existing = await tx.$queryRaw<any[]>`SELECT payment_id FROM payments WHERE payment_no = ${payment_no} LIMIT 1`;
      if (existing && existing.length > 0) {
        throw new Error(`HATA: ${payment_no} numaralı ödeme fişi zaten sistemde mevcut!`);
      }

      // 2. Ödeme kaydı
      await tx.$executeRaw`INSERT INTO payments (
          payment_id, payment_no, supplier_id, payment_date, amount, currency, 
          exchange_rate, payment_method, bank_account_id, reference_no, notes, created_at
        ) VALUES (${paymentId}, ${payment_no}, ${supplier_id}, ${payment_date}, ${amount}, ${currency || 'TRY'}, ${rate}, ${payment_method}, ${bank_account_id || null}, ${reference_no || null}, ${notes || ''}, ${new Date()})`;

      // 3. Tedarikçi bakiye güncellemesi
      const supplierRows = await tx.$queryRaw<any[]>`SELECT balance FROM suppliers WHERE supplier_id = ${supplier_id} LIMIT 1`;
      if (!supplierRows || supplierRows.length === 0) {
        throw new Error('HATA: Belirtilen Tedarikçi Cari Kartı sistemde bulunamadı!');
      }
      const current_balance = Number(supplierRows[0].balance) || 0;
      const new_balance = current_balance - localAmount;

      await tx.$executeRaw`UPDATE suppliers SET balance = ${new_balance} WHERE supplier_id = ${supplier_id}`;

      // 4. Cari hareket logu
      const ledgerId = crypto.randomUUID();
      await tx.$executeRaw`INSERT INTO supplier_ledger (
          ledger_id, supplier_id, transaction_date, transaction_type, document_no,
          debit, credit, debit_fc, credit_fc, currency, exchange_rate, balance, description, created_at
        ) VALUES (${ledgerId}, ${supplier_id}, ${new Date()}, 'Payment', ${payment_no}, ${localAmount}, 0.00, ${amount}, 0.00, ${currency || 'TRY'}, ${rate}, ${new_balance}, ${notes || 'Tedarikçi Ödeme/Tediye Fişi'}, ${new Date()})`;

      // 5. Fatura kapatma eşleştirmeleri
      let totalSettled = 0;
      if (settlements && Array.isArray(settlements) && settlements.length > 0) {
        for (const set of settlements) {
          const { invoice_id, applied_amount } = set;
          if (applied_amount <= 0) {
            throw new Error(`HATA: Eşleştirilen fatura kapatma tutarı sıfır veya negatif olamaz! Fatura ID: ${invoice_id}`);
          }

          // Faturayı sorgula
          const invoiceRows = await tx.$queryRaw<any[]>`SELECT open_amount, total_gross_amount, supplier_id FROM invoice_headers WHERE invoice_id = ${invoice_id} LIMIT 1`;
          if (!invoiceRows || invoiceRows.length === 0) {
            throw new Error(`HATA: Kapatılmak istenen alış faturası sistemde bulunamadı! Fatura ID: ${invoice_id}`);
          }

          const open_amount = Number(invoiceRows[0].open_amount) || 0;
          const total_gross_amount = Number(invoiceRows[0].total_gross_amount) || 0;
          const invSupplierId = invoiceRows[0].supplier_id;
          
          if (invSupplierId !== supplier_id) {
            throw new Error(`HATA: Eşleştirilmek istenen fatura başka bir tedarikçiye ait! Fatura ID: ${invoice_id}`);
          }

          if (applied_amount > open_amount) {
            throw new Error(`HATA: Kapatılmak istenen tutar (${applied_amount}) faturanın kalan açık bakiyesini (${open_amount}) aşamaz!`);
          }

          totalSettled += applied_amount;
          const new_open_amount = open_amount - applied_amount;
          
          let newStatus = 'Approved';
          if (new_open_amount <= 0.01) {
            newStatus = 'Paid';
          } else if (new_open_amount < total_gross_amount) {
            newStatus = 'Partially Paid';
          }

          // Fatura güncelle
          await tx.$executeRaw`UPDATE invoice_headers SET open_amount = ${new_open_amount}, status = ${newStatus} WHERE invoice_id = ${invoice_id}`;

          // Eşleştirme kaydı ekle
          const settlementId = crypto.randomUUID();
          await tx.$executeRaw`INSERT INTO invoice_settlements (settlement_id, invoice_id, payment_id, applied_amount, created_at) 
             VALUES (${settlementId}, ${invoice_id}, ${paymentId}, ${applied_amount}, ${new Date()})`;
        }

        if (totalSettled > amount) {
          throw new Error(`HATA: Faturalara uygulanan kapatma toplamı (${totalSettled}) ödeme tutarını (${amount}) aşamaz!`);
        }
      }
    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json({
      success: true,
      paymentId,
      message: 'Ödeme başarıyla işlendi, cari bakiye güncellendi ve faturalar kapatıldı.'
    });

  } catch (error: any) {
    console.error('[API_SUPPLIER_PAYMENT_POST_ERROR]:', error);
    return NextResponse.json(
      { error: 'Ödeme kaydedilirken bir hata oluştu.', details: error.message },
      { status: 500 }
    );
  }
}
