# Prueba técnica NestJS/Go

Este repositorio contiene la API **Autostore**, desarrollada con NestJS como parte de la prueba técnica.

## Endpoints de PayPal

La API incluye dos endpoints especiales utilizados como URLs de retorno en el flujo de pago de PayPal:

- `GET /paypal/success`: PayPal redirige a esta ruta cuando el usuario aprueba el pago. Se captura la transacción y se responde con `{ status: 'COMPLETED' }`.
- `GET /paypal/cancel`: PayPal redirige a esta ruta cuando el usuario cancela el proceso. No se realiza ningún cargo y se responde con `{ status: 'CANCELLED' }`.

Ambos endpoints aparecen al final de la documentación de Swagger bajo la etiqueta **payments**.