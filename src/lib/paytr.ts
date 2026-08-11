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

export function getPayTRCredentials() {
  const merchantId = (process.env.PAYTR_MERCHANT_ID || '').trim();
  const merchantKey = (process.env.PAYTR_MERCHANT_KEY || '').trim();
  const merchantSalt = (process.env.PAYTR_MERCHANT_SALT || '').trim();
  const testMode = (process.env.PAYTR_TEST_MODE || '0').trim();

  return { merchantId, merchantKey, merchantSalt, testMode };
}

/**
 * Creates a PayTR iFrame Token via official PayTR API
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

    const noInterest = '0';
    const maxInstallment = '0'; // 0 = default (all options)
    const currency = 'TL';
    const debugOn = testMode === '1' ? '1' : '0';

    // Hash String Calculation
    // merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_interest + max_installment + currency + test_mode
    const hashString = `${merchantId}${userIp}${merchantOid}${email}${totalKurus}${userBasketStr}${noInterest}${maxInstallment}${currency}${testMode}`;
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
      no_interest: noInterest,
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
 * Validates HMAC SHA256 signature sent by PayTR Webhook Callback
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
