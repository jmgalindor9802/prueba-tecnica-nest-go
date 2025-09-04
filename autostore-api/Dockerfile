# Imagen base ligera de Node
FROM node:20-alpine

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (sin devDependencies en producción)
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Compilar
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando por defecto
CMD ["npm", "run", "start:prod"]
