# Prueba técnica NestJS/Go

Este repositorio contiene dos retos independientes:

- **autostore-api/**: API REST construida con NestJS para administrar una tienda virtual de autos.
- **pinger/**: servicio en Go que realiza pings ICMP de forma concurrente a múltiples equipos de red.

Cada proyecto cuenta con su propio archivo `docker-compose.yml` que facilita la ejecución local.

> **Nota:** por tratarse de un repositorio de prueba, los `docker-compose.yml` están configurados para cargar variables de entorno desde `.env.example`. Si necesitas personalizarlas, copia ese archivo a `.env` y ajusta sus valores.

## Ejecución rápida

Para levantar cada servicio de forma aislada, ingresa a la carpeta del proyecto que desees probar y ejecuta:

```bash
docker compose up --build
```

Si prefieres ejecutar los servicios desde la raíz del repositorio, especifica el archivo de composición y un nombre de proyecto para evitar que se mezclen:

```bash
docker compose -f autostore-api/docker-compose.yml -p autostore-api up --build
docker compose -f pinger/docker-compose.yml -p pinger up --build
```

Consulta el README de cada subcarpeta para instrucciones detalladas de configuración y uso.