export const core = {
  PayPalHttpClient: class {},
  LiveEnvironment: class {},
  SandboxEnvironment: class {},
};

export const orders = {
  OrdersCreateRequest: class {
    prefer() {}
    requestBody() {}
  },
  OrdersCaptureRequest: class {
    constructor(public id: string) {}
    requestBody() {}
  },
};