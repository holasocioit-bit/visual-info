# =============================================================
# Dockerfile para la aplicación visual-info-research-vault (Vite/Node.js)
# =============================================================

# 1. IMAGEN BASE
# Usamos Node 20 slim, que es una versión reciente y ligera.
FROM node:20-slim

# 2. DIRECTORIO DE TRABAJO
# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /usr/src/app

# 3. CACHE DE DEPENDENCIAS
# Copiamos primero los archivos package.json y package-lock.json.
# Esto asegura que Docker no reinstale las dependencias (el paso RUN npm install) 
# a menos que estos archivos cambien, mejorando la velocidad de construcción.
COPY package*.json ./

# 4. INSTALACIÓN DE DEPENDENCIAS
RUN npm install

# 5. CÓDIGO DE LA APLICACIÓN
# Copia el resto del código del proyecto al contenedor.
COPY . .

# 6. PUERTO DE EXPOSICIÓN
# Documenta el puerto en el que correrá la aplicación (Vite por defecto).
EXPOSE 5173

# 7. COMANDO DE INICIO (ENTRYPOINT - SOLUCIÓN AL ERROR)
# ENTRYPOINT fuerza la ejecución de 'npm run dev', ignorando el script 'start' faltante.
# Esto inicia tu servidor de desarrollo/producción con Vite.
ENTRYPOINT [ "npm", "run", "dev" ]
