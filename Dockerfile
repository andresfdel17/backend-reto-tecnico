FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false

COPY . .

RUN yarn build

RUN mkdir -p logs

# Script para crear .env desde variables de entorno
COPY scripts/docker-create-env.sh ./
COPY .env.template ./
RUN chmod +x docker-create-env.sh

EXPOSE ${PORT}

# Crear .env y luego iniciar la aplicación
CMD ["sh", "-c", "./docker-create-env.sh && yarn start"]
