# Pinger

Servicio en Go que envía ping ICMP a hasta **3000** objetivos de red de forma concurrente mediante un modelo de *worker pool*. Expone un endpoint HTTP para consultar el progreso y los resultados.

## Ejecución con Docker Compose

```bash
cd pinger
docker compose up --build
```

La imagen se construye localmente, se otorga la capacidad de red `NET_RAW` y se publica el puerto `8080`. Una vez iniciado, los resultados pueden consultarse en `http://localhost:8080/results`.

El número de *workers*, el tiempo de espera y la cantidad de paquetes pueden configurarse mediante las variables de entorno `WORKERS`, `TIMEOUT` y `COUNT`. Se incluye un archivo `.env.example` como referencia; puedes copiarlo a `.env` y ajustar los valores sin modificar `docker-compose.yml`. El archivo `targets.txt` se monta en el contenedor por si se desean definir objetivos personalizados habilitando el flag `-file` en dicho archivo.