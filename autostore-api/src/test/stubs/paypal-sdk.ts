export enum Environment {
    Production = 'production',
    Sandbox = 'sandbox',
}

export enum CheckoutPaymentIntent {
    Capture = 'CAPTURE',
}

export class Client {
    constructor(_config: any) { }
}
export class OrdersController {
    constructor(_client: Client) { }
    async createOrder(_: any) {
        return { result: { id: 'id', links: [] } };
    }
    async captureOrder(_: any) {
        return { result: { status: 'COMPLETED' } };
    }
}
