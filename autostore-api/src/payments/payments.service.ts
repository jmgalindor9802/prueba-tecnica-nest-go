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
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: total.toFixed(2) },
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
}