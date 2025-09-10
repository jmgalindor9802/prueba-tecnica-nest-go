import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
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

    constructor(private readonly redisService: RedisService) {
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
        //  evita capturar dos veces la misma orden
        const lockKey = `payment:lock:${orderId}`;
        const acquired = await this.redisService.lock(lockKey, 5 * 60 * 1000); // 5 minutos
        if (!acquired) {
            return false;
        }
        try {
            const { result } = await this.ordersController.captureOrder({ id: orderId });
            return String(result.status) === 'COMPLETED';
        } finally {
            await this.redisService.unlock(lockKey);
        }
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