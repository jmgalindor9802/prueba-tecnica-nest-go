export enum Environment {
  Production = 'production',
  Sandbox = 'sandbox',
}

export enum CheckoutPaymentIntent {
  Capture = 'CAPTURE',
}

export class Client {
  orders = {
    createOrder: async (_: any) => ({ result: { id: 'id', links: [] } }),
    captureOrder: async (_: any) => ({ result: { status: 'COMPLETED' } }),
  };

  constructor(_config: any) {}
}
