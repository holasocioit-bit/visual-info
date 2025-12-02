# --- ETAPA 1: Construcción (Builder) ---
# Usamos una imagen de Node para instalar dependencias y hacer el build de React
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copiamos package.json primero para aprovechar la caché de Docker
COPY package*.json ./

# 2. Instalamos TODAS las dependencias (necesarias para que Vite construya el sitio)
RUN npm install

# 3. Copiamos el resto del código fuente
COPY . .

# 4. Ejecutamos el build de React
# (Esto debe generar la carpeta 'dist' que usa tu server.js)
RUN npm run build


# --- ETAPA 2: Ejecución (Production) ---
# Usamos una imagen limpia para correr el servidor
FROM node:20-alpine

WORKDIR /app

# Configuración de Entorno para Producción
ENV NODE_ENV=production
# Forzamos el puerto 80 como pediste para la "Opción B"
ENV PORT=80
# Rutas para los volúmenes
ENV DATA_DIR=/app/data
ENV UPLOADS_DIR=/app/uploads

# 5. Instalamos SOLO dependencias de producción (ahorra espacio)
COPY package*.json ./
RUN npm ci --only=production

# 6. Copiamos la carpeta 'dist' generada en la Etapa 1
COPY --from=builder /app/dist ./dist

# 7. Copiamos el servidor backend
COPY server.js ./
# OJO: Si tu server.js importa otros archivos (ej. utils.js), agrégalos aquí con COPY.
# Si 'utils.ts' es TypeScript, Node no lo leerá directamente a menos que lo compiles.
# Asumo que server.js es JavaScript puro.

# 8. Creamos las carpetas de los volúmenes para asegurar que existan
RUN mkdir -p /app/data && mkdir -p /app/uploads

# 9. Exponemos el puerto 80 (Documentación para Traefik)
EXPOSE 80

# 10. Comando de inicio
CMD ["node", "server.js"]
