import crypto from 'crypto';

export interface PayTRBasketItem {
  name: string;
  price: string | number; // TL price per item (e.g. "150.00" or 150)
  quantity: number;
}

export interface PayTROrderParams {
  merchantOid: string; // Unique order ID
  email: string;
  paymentAmount: number; // Total amount in TL (e.g. 250.50)
  userName: string;
  userAddress: string;
  userPhone: string;
  userIp: string;
  basket: PayTRBasketItem[];
  okUrl?: string;
  failUrl?: string;
}

export interface PayTRTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PayTRStatusResult {
  success: boolean;
  status?: string;
  paymentAmount?: string;
  paymentTotal?: string;
  currency?: string;
  paymentDate?: string;
  returns?: any[];
  error?: string;
}

export interface PayTRRefundParams {
  merchantOid: string;
  returnAmount: number; // Tutar TL cinsinden (örn: 150.50)
  referenceNo?: string;
}

export interface PayTRRefundResult {
  success: boolean;
  merchantOid?: string;
  returnAmount?: string;
  isTest?: number;
  error?: string;
}

export function getPayTRCredentials() {
  const merchantId = (process.env.PAYTR_MERCHANT_ID || '').trim();
  const merchantKey = (process.env.PAYTR_MERCHANT_KEY || '').trim();
  const merchantSalt = (process.env.PAYTR_MERCHANT_SALT || '').trim();
  const testMode = (process.env.PAYTR_TEST_MODE || '0').trim();

  return { merchantId, merchantKey, merchantSalt, testMode };
}

/**
 * Creates a PayTR iFrame Token via official PayTR API (Sanal POS / Kredi Kartı)
 * Doküman: https://dev.paytr.com/iframe-api/iframe-api-1-adim
 */
export async function createPayTRToken(params: PayTROrderParams): Promise<PayTRTokenResult> {
  try {
    const { merchantId, merchantKey, merchantSalt, testMode } = getPayTRCredentials();

    if (!merchantId || !merchantKey || !merchantSalt) {
      console.error('[PAYTR ERROR] Missing PayTR Merchant Credentials in environment!');
      return { success: false, error: 'PayTR entegrasyon anahtarları eksik.' };
    }

    const {
      merchantOid,
      email,
      paymentAmount,
      userName,
      userAddress,
      userPhone,
      userIp,
      basket,
      okUrl = 'https://www.pekefe.com/sepet/onay',
      failUrl = 'https://www.pekefe.com/sepet/odeme?error=paytr',
    } = params;

    // Convert payment amount to Kuruş (e.g. 100.50 TL -> 10050)
    const totalKurus = Math.round(paymentAmount * 100);

    // Format user basket for PayTR: Array of [name, price_in_tl_str, quantity]
    const paytrBasketItems = basket.map((item) => [
      item.name.replace(/"/g, "'"),
      Number(item.price).toFixed(2),
      Number(item.quantity),
    ]);

    const userBasketStr = Buffer.from(JSON.stringify(paytrBasketItems)).toString('base64');

    const noInstallment = '0'; // 0 = taksit seçenekleri gösterilsin, 1 = sadece tek çekim
    const maxInstallment = '0'; // 0 = varsayılan taksit sınırı yok
    const currency = 'TL';
    const debugOn = testMode === '1' ? '1' : '0';

    // Official PayTR iFrame Hash String Calculation:
    // merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
    const hashString = `${merchantId}${userIp}${merchantOid}${email}${totalKurus}${userBasketStr}${noInstallment}${maxInstallment}${currency}${testMode}`;
    const paytrToken = crypto
      .createHmac('sha256', merchantKey)
      .update(hashString + merchantSalt)
      .digest('base64');

    const bodyParams = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp || '127.0.0.1',
      merchant_oid: merchantOid,
      email: email || 'musteri@pekefe.com',
      payment_amount: String(totalKurus),
      paytr_token: paytrToken,
      user_basket: userBasketStr,
      debug_on: debugOn,
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: userName || 'Pekefe Müşterisi',
      user_address: userAddress || 'Türkiye',
      user_phone: userPhone || '05000000000',
      merchant_ok_url: okUrl,
      merchant_fail_url: failUrl,
      timeout_limit: '30',
      currency: currency,
      test_mode: testMode,
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return { success: true, token: data.token };
    } else {
      console.error('[PAYTR API ERROR]:', data.reason || data);
      return { success: false, error: data.reason || 'PayTR jeton üretilemedi.' };
    }
  } catch (err: any) {
    console.error('[PAYTR EXCEPTION]:', err);
    return { success: false, error: err.message || 'PayTR servisiyle bağlantı kurulamadı.' };
  }
}

/**
 * Creates a PayTR Havale/EFT iFrame Token via official PayTR API
 * Doküman: https://dev.paytr.com/havale-eft-iframe-api/havale-eft-iframe-api-1-adim
 */
export async function createPayTRHavaleToken(params: PayTROrderParams): Promise<PayTRTokenResult> {
  try {
    const { merchantId, merchantKey, merchantSalt, testMode } = getPayTRCredentials();

    if (!merchantId || !merchantKey || !merchantSalt) {
      return { success: false, error: 'PayTR entegrasyon anahtarları eksik.' };
    }

    const { merchantOid, email, paymentAmount, userIp } = params;
    const totalKurus = Math.round(paymentAmount * 100);
    const paymentType = 'eft';
    const debugOn = testMode === '1' ? '1' : '0';

    // Hash calculation for EFT: merchant_id + user_ip + merchant_oid + email + payment_amount + payment_type + test_mode
    const hashString = `${merchantId}${userIp}${merchantOid}${email}${totalKurus}${paymentType}${testMode}`;
    const paytrToken = crypto
      .createHmac('sha256', merchantKey)
      .update(hashString + merchantSalt)
      .digest('base64');

    const bodyParams = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp || '127.0.0.1',
      merchant_oid: merchantOid,
      email: email || 'musteri@pekefe.com',
      payment_amount: String(totalKurus),
      payment_type: paymentType,
      paytr_token: paytrToken,
      debug_on: debugOn,
      timeout_limit: '30',
      test_mode: testMode,
    });

    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    const data = await response.json();
    if (data.status === 'success') {
      return { success: true, token: data.token };
    } else {
      return { success: false, error: data.reason || 'Havale/EFT jetonu üretilemedi.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'PayTR Havale servisi bağlantı hatası.' };
  }
}

/**
 * Queries transaction status from PayTR Status Query API (Durum Sorgu API)
 * Doküman: https://dev.paytr.com/durum-sorgu
 */
export async function queryPayTRStatus(merchantOid: string): Promise<PayTRStatusResult> {
  try {
    const { merchantId, merchantKey, merchantSalt } = getPayTRCredentials();

    if (!merchantId || !merchantKey || !merchantSalt) {
      return { success: false, error: 'PayTR entegrasyon anahtarları eksik.' };
    }

    // Hash String: merchant_id + merchant_oid + merchant_salt
    const hashString = `${merchantId}${merchantOid}${merchantSalt}`;
    const paytrToken = crypto
      .createHmac('sha256', merchantKey)
      .update(hashString)
      .digest('base64');

    const bodyParams = new URLSearchParams({
      merchant_id: merchantId,
      merchant_oid: merchantOid,
      paytr_token: paytrToken,
    });

    const response = await fetch('https://www.paytr.com/odeme/durum-sorgu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return {
        success: true,
        status: data.status,
        paymentAmount: data.payment_amount,
        paymentTotal: data.payment_total,
        currency: data.currency,
        paymentDate: data.payment_date,
        returns: data.returns || [],
      };
    } else {
      return {
        success: false,
        error: `${data.err_no || ''} - ${data.err_msg || data.reason || 'Sorgulama başarısız.'}`,
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Durum sorgu bağlantı hatası.' };
  }
}

/**
 * Performs full or partial refund via official PayTR Refund API (İade API)
 * Doküman: https://dev.paytr.com/iade-api
 */
export async function refundPayTROrder(params: PayTRRefundParams): Promise<PayTRRefundResult> {
  try {
    const { merchantId, merchantKey, merchantSalt } = getPayTRCredentials();

    if (!merchantId || !merchantKey || !merchantSalt) {
      return { success: false, error: 'PayTR entegrasyon anahtarları eksik.' };
    }

    const { merchantOid, returnAmount, referenceNo } = params;
    const returnAmountStr = Number(returnAmount).toFixed(2); // örn: "11.97"

    // Hash String: merchant_id + merchant_oid + return_amount + merchant_salt
    const hashString = `${merchantId}${merchantOid}${returnAmountStr}${merchantSalt}`;
    const paytrToken = crypto
      .createHmac('sha256', merchantKey)
      .update(hashString)
      .digest('base64');

    const bodyParams = new URLSearchParams({
      merchant_id: merchantId,
      merchant_oid: merchantOid,
      return_amount: returnAmountStr,
      paytr_token: paytrToken,
    });

    if (referenceNo) {
      bodyParams.append('reference_no', referenceNo);
    }

    const response = await fetch('https://www.paytr.com/odeme/iade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString(),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return {
        success: true,
        merchantOid: data.merchant_oid,
        returnAmount: data.return_amount,
        isTest: data.is_test,
      };
    } else {
      return {
        success: false,
        error: `${data.err_no || ''} - ${data.err_msg || 'İade işlemi gerçekleştirilemedi.'}`,
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'İade API bağlantı hatası.' };
  }
}

/**
 * Validates HMAC SHA256 signature sent by PayTR Webhook Callback
 * Doküman: https://dev.paytr.com/iframe-api/iframe-api-2-adim
 */
export function validatePayTRCallback(postData: Record<string, string>): boolean {
  try {
    const { merchantKey, merchantSalt } = getPayTRCredentials();
    const { merchant_oid, status, total_amount, hash } = postData;

    if (!merchant_oid || !status || !total_amount || !hash) {
      return false;
    }

    const hashStr = `${merchant_oid}${merchantSalt}${status}${total_amount}`;
    const expectedHash = crypto
      .createHmac('sha256', merchantKey)
      .update(hashStr)
      .digest('base64');

    return hash === expectedHash;
  } catch (err) {
    console.error('[PAYTR CALLBACK VALIDATION ERROR]:', err);
    return false;
  }
}

