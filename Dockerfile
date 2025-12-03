# --- ETAPA 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copiamos package.json (y lock si existe)
COPY package*.json ./

# 2. Instalamos TODAS las dependencias (necesarias para compilar Vite/React)
RUN npm install

# 3. Copiamos todo el código fuente
COPY . .

# 4. Compilamos el frontend (Genera la carpeta 'dist')
RUN npm run build


# --- ETAPA 2: Ejecución (Production) ---
FROM node:20-alpine

WORKDIR /app

# Configuración de Entorno
ENV NODE_ENV=production
ENV PORT=80
ENV DATA_DIR=/app/data
ENV UPLOADS_DIR=/app/uploads

# 5. Copiamos package.json de nuevo
COPY package*.json ./

# --- CORRECCIÓN AQUÍ ---
# Usamos 'npm install --omit=dev' en lugar de 'npm ci'.
# Esto instala solo dependencias de producción y no falla si falta el lockfile.
RUN npm install --omit=dev

# 6. Traemos la carpeta 'dist' construida en la Etapa 1
COPY --from=builder /app/dist ./dist

# 7. Copiamos el servidor backend
COPY server.js ./

# 8. Creamos directorios para los volúmenes
RUN mkdir -p /app/data && mkdir -p /app/uploads

# 9. Exponemos el puerto 80
EXPOSE 80

# 10. Arrancamos
CMD ["node", "server.js"]
