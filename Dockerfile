FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false

COPY . .

RUN yarn build

RUN mkdir -p logs

# Crear script de inicialización simple
RUN printf '#!/bin/sh\necho "Creating .env from environment variables..."\ncat > .env << EOF\nNODE_ENV=${NODE_ENV}\nAPP_NAME=${APP_NAME}\nPORT=${PORT}\nDB_HOST=${DB_HOST}\nDB_PORT=${DB_PORT}\nDB_USER=${DB_USER}\nDB_PASS=${DB_PASS}\nDB_NAME=${DB_NAME}\nJWT_SECRET=${JWT_SECRET}\nEOF\necho "Environment file created successfully"\n' > create-env.sh && chmod +x create-env.sh

EXPOSE ${PORT}

# Crear .env y luego iniciar la aplicación
CMD ["sh", "-c", "./create-env.sh && yarn start"]
