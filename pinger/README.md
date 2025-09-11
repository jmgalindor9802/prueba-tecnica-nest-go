# Pinger

Servicio en Go que envía ping ICMP a hasta **3000** objetivos de red de forma concurrente mediante un modelo de *worker pool*. Expone un endpoint HTTP para consultar el progreso y los resultados.

## Ejecución con Docker Compose

```bash
docker compose up --build
```

La imagen se construye localmente, se otorga la capacidad de red `NET_RAW` y se publica el puerto `8080`. Una vez iniciado, los resultados pueden consultarse en `http://localhost:8080/results`.

## Configuración

Variables de entorno disponibles:

- `WORKERS`: número de workers concurrentes.
- `TIMEOUT`: tiempo de espera por paquete en milisegundos.
- `COUNT`: cantidad de paquetes enviados a cada objetivo.

El archivo `.env.example` puede copiarse a `.env` para ajustar estos valores sin modificar `docker-compose.yml`.
El archivo `targets.txt` se monta en el contenedor para definir objetivos personalizados habilitando el flag `-file`.
