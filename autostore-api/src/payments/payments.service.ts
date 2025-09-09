import { Injectable } from '@nestjs/common';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaymentsService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID ?? '';
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';
    const environment =
      process.env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  async createOrder(total: number): Promise<{ id: string; links: any[] }> {
    const rate = await this.getCopToUsdRate();
    const usdTotal = (total * rate).toFixed(2);
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: usdTotal },
        },
      ],
    });
    const response = await this.client.execute(request);
    return { id: response.result.id, links: response.result.links };
  }

  async captureOrder(orderId: string): Promise<boolean> {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const response = await this.client.execute(request);
    return response.result.status === 'COMPLETED';
  }
  private async getCopToUsdRate(): Promise<number> {
    try {
         const params = new URLSearchParams({
        access_key: process.env.EXCHANGE_RATE_API_KEY ?? '',
        source: 'COP',
        currencies: 'USD',
      });
      const res = await fetch(        
        `https://api.exchangerate.host/live?${params.toString()}`,
      );
      const data = await res.json();
      return data?.quotes?.COPUSD ?? 1;
    } catch {
      return 1;
    }
  }
}