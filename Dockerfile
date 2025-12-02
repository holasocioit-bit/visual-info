# =============================================================
# ETAPA 1: BUILDER (Construcción y Optimización de Archivos)
# =============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración para aprovechar el caché
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente completo
COPY . .

# Ejecutar el script de construcción de tu package.json
# Esto crea la carpeta 'dist'
RUN npm run build

# =============================================================
# ETAPA 2: PRODUCTION (Servidor Web Ligero)
# =============================================================
# Usamos Nginx, que es un servidor web muy rápido y ligero.
FROM nginx:alpine

# 1. Copiar los archivos compilados desde la etapa 'builder'
# La ruta /usr/share/nginx/html es donde Nginx busca los archivos estáticos por defecto.
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. Exponer el puerto de Nginx
EXPOSE 80

# 3. Comando de inicio de Nginx (por defecto)
# Nginx se inicia automáticamente con el comando CMD predefinido en la imagen nginx:alpine.
# CMD ["nginx", "-g", "daemon off;"]
