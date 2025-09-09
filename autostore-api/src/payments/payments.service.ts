import { Injectable } from '@nestjs/common';
import {
    Client,
    Environment,
    CheckoutPaymentIntent,
    OrdersController,
} from '@paypal/paypal-server-sdk';

@Injectable()
export class PaymentsService {
    private client: Client;
    private ordersController: OrdersController;

    constructor() {
        const clientId = process.env.PAYPAL_CLIENT_ID ?? '';
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET ?? '';
        const environment =
            process.env.PAYPAL_MODE === 'live'
                ? Environment.Production
                : Environment.Sandbox;

        this.client = new Client({
            environment,
            clientCredentialsAuthCredentials: {
                oAuthClientId: clientId,
                oAuthClientSecret: clientSecret,
            },
        });
        this.ordersController = new OrdersController(this.client);
    }

    async createOrder(total: number): Promise<{ id: string; links: any[] }> {
        const rate = await this.getCopToUsdRate();
        const usdTotal = (total * rate).toFixed(2);
        const { result } = await this.ordersController.createOrder({
            body: {
                intent: CheckoutPaymentIntent.Capture,
                applicationContext: {
                    returnUrl: process.env.PAYPAL_RETURN_URL ?? '',
                    cancelUrl: process.env.PAYPAL_CANCEL_URL ?? '',
                },
                purchaseUnits: [
                    {
                        amount: { currencyCode: 'USD', value: usdTotal },
                    },
                ],
            },
            prefer: 'return=representation',
        });
        return { id: result.id ?? '', links: result.links ?? [] };
    }

    async captureOrder(orderId: string): Promise<boolean> {
        const { result } = await this.ordersController.captureOrder({ id: orderId });
        return result.status === 'COMPLETED';
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