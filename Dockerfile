# =============================================================
# Dockerfile para la aplicación research_vault_app (Node.js)
# =============================================================

# 1. Usar una imagen base oficial de Node.js (versión 20-slim es ligera)
FROM node:20-slim

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar únicamente los archivos de configuración de dependencias
#    Esto permite que Docker cachee este paso si las dependencias no cambian.
COPY package*.json ./

# 4. Instalar todas las dependencias
#    Este es tu "npm install"
RUN npm install

# 5. Copiar el resto del código de la aplicación al contenedor
COPY . .

# 6. Comando de ejecución final (CMD)
#    Este es tu "npm run [script]"

# 🚨 MUY IMPORTANTE: Reemplaza 'dev' por el nombre real del script 
#    que inicia tu aplicación en tu archivo package.json (ej: 'server', 'prod', 'start-server').
ENTRYPOINT [ "npm", "run", "dev" ]
