// @ts-ignore
import Iyzipay from 'iyzipay';

export interface PaymentRequest {
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvv: string;
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
}

export interface PaymentResponse {
  status: "success" | "failure";
  transactionId?: string;
  errorMessage?: string;
}

export class PaymentService {
  private static iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY || 'sandbox-key',
    secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret',
    uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
  });

  static async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      const names = request.customerName.split(' ');
      const firstName = names[0] || 'Guest';
      const lastName = names.slice(1).join(' ') || 'User';

      const data = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: request.orderId,
        price: request.amount.toString(),
        paidPrice: request.amount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        installments: '1',
        basketId: 'B' + request.orderId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
          cardHolderName: request.customerName,
          cardNumber: request.cardNumber.replace(/\s/g, ''),
          expireMonth: request.expireMonth,
          expireYear: request.expireYear,
          cvc: request.cvv,
          registerCard: '0'
        },
        buyer: {
          id: 'BY' + Date.now(),
          name: firstName,
          surname: lastName,
          gsmNumber: '+905350000000',
          email: request.customerEmail,
          identityNumber: '74300864791',
          lastLoginDate: '2015-10-05 12:43:35',
          registrationDate: '2013-04-21 15:12:09',
          registrationAddress: 'NexaB2B Headquarters',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34732'
        },
        shippingAddress: {
          contactName: request.customerName,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'NexaB2B Delivery Address',
          zipCode: '34732'
        },
        billingAddress: {
          contactName: request.customerName,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'NexaB2B Billing Address',
          zipCode: '34732'
        },
        basketItems: [
          {
            id: 'BI101',
            name: 'Order ' + request.orderId,
            category1: 'General',
            category2: 'B2B',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: request.amount.toString()
          }
        ]
      };

      this.iyzipay.payment.create(data, (err: any, result: any) => {
        if (err || result.status !== 'success') {
          console.error(`[PAYMENT_ERROR] Iyzico Payment Failed for Order: ${request.orderId}`);
          console.error(`[PAYMENT_ERROR] Details:`, err || result?.errorMessage || "Unknown Error");
          
          resolve({
            status: "failure",
            errorMessage: result?.errorMessage || "Ödeme işlemi başarısız oldu."
          });
        } else {
          console.log(`[PAYMENT_SUCCESS] Payment completed for Order: ${request.orderId}. Transaction ID: ${result.paymentId}`);
          resolve({
            status: "success",
            transactionId: result.paymentId
          });
        }
      });
    });
  }
}
