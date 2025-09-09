import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
    beforeEach(() => {
        (global as any).fetch = jest.fn().mockResolvedValue({
            json: () => Promise.resolve({ quotes: { COPUSD: 0.00025 } }),
        });
    });

    it('convierte el total a USD al crear la orden', async () => {
        const service = new PaymentsService();
        const createOrder = jest
            .fn()
            .mockResolvedValue({ result: { id: '1', links: [] } });
        (service as any).ordersController = { createOrder };
        await service.createOrder(400000); // 400000 COP * 0.00025 = 100 USD

        const body = createOrder.mock.calls[0][0].body;
        const amount = body.purchaseUnits[0].amount;
        expect(amount.currencyCode).toBe('USD');
        expect(amount.value).toBe('100.00');
    });
});