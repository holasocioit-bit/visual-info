# Usa una imagen oficial de Node.js
FROM node:20-alpine

# Crea un directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install --production

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto que usa tu app (ajusta si es diferente)
EXPOSE 8079

# Comando de inicio
CMD ["npm", "start"]
