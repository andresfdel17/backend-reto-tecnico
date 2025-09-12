# Usar Node.js 22 como imagen base
FROM node:22-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y yarn.lock
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install --frozen-lockfile --production=false

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN yarn build

# Crear directorio para logs
RUN mkdir -p logs

# Exponer el puerto (será configurado por variable de entorno)
EXPOSE ${PORT}

# Comando para iniciar la aplicación
CMD ["yarn", "start"]
