# Pinger

Servicio en Go que envía ping ICMP a hasta **3000** objetivos de red de forma concurrente mediante un modelo de *worker pool*. Expone un endpoint HTTP para consultar el progreso y los resultados.

## Ejecución con Docker Compose

```bash
cd pinger
docker compose up --build
```

La imagen se construye localmente, se otorga la capacidad de red `NET_RAW` y se publica el puerto `8080`. Una vez iniciado, los resultados pueden consultarse en `http://localhost:8080/results`.

Los parámetros como número de workers, tiempo de espera y cantidad de paquetes se ajustan en `docker-compose.yml`. El archivo `targets.txt` se monta en el contenedor por si se desean definir objetivos personalizados habilitando el flag `-file` en dicho archivo.