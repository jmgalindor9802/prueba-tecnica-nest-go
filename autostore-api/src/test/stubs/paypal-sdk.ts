export const core = {
  PayPalHttpClient: class {},
  LiveEnvironment: class {},
  SandboxEnvironment: class {},
};

export const orders = {
  OrdersCreateRequest: class {
    body: any;
    prefer() {}
    requestBody(body: any) {
      this.body = body;
    }
  },
  OrdersCaptureRequest: class {
    constructor(public id: string) {}
    requestBody() {}
  },
};