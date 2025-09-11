# Prueba técnica NestJS/Go

Este repositorio contiene dos retos independientes:

- **autostore-api/**: API REST en NestJS para una tienda virtual de productos de autos. Su archivo `docker-compose.yml` se encuentra dentro de esta carpeta.
- **pinger/**: script en Go que realiza ping ICMP concurrente a múltiples equipos de red. También cuenta con su propio `docker-compose.yml`.

Para ejecutar cualquiera de los proyectos, navega a la carpeta correspondiente y corre:

```bash
docker compose up --build
```