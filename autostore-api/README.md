# Autostore API

API construida con [NestJS](https://nestjs.com/) como parte de la prueba técnica. Expone endpoints para gestionar usuarios, vehiculos, órdenes y pagos.

## Usuario administrador inicial

Al construir el contenedor la semilla se ejecuta automáticamente para crear el primer administrador. 
En entornos locales también puedes ejecutarla manualmente:

```bash
npm run seed:admin
```

La semilla inserta un usuario con las siguientes credenciales:

- **correo**: `admin@autostore.com`
- **contraseña**: `admin123`


## Endpoints de PayPal

La API incluye dos endpoints especiales utilizados como URLs de retorno en el flujo de pago de PayPal:

- `GET /paypal/success`: PayPal redirige a esta ruta cuando el usuario aprueba el pago. Se captura la transacción y se responde con `{ status: 'COMPLETED' }`.
- `GET /paypal/cancel`: PayPal redirige a esta ruta cuando el usuario cancela el proceso. No se realiza ningún cargo y se responde con `{ status: 'CANCELLED' }`.

Ambos endpoints aparecen al final de la documentación de Swagger bajo la etiqueta **payments**.


## Cancelación de órdenes

Para cancelar una orden utiliza `PATCH /orders/:id/cancel` enviando opcionalmente un cuerpo con `{ "reason": "motivo" }`.
Solo las órdenes con estado `PENDING` pueden cancelarse. Intentar cancelar una orden ya pagada, enviada o previamente cancelada
responderá con un error `400` y el mensaje `Solo se pueden cancelar órdenes pendientes`.