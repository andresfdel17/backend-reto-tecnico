#!/bin/bash

# Script para generar archivo .env con credenciales aleatorias
# Uso: ./generate-env.sh [environment]
# Ejemplos: ./generate-env.sh development, ./generate-env.sh production

ENVIRONMENT=${1:-"development"}
ENV_FILE=".env"

if [ "$ENVIRONMENT" != "development" ]; then
    ENV_FILE=".env.${ENVIRONMENT}"
fi

echo "🔐 Generando credenciales aleatorias para entorno: $ENVIRONMENT"
echo "📄 Archivo: $ENV_FILE"

# Función para generar contraseñas aleatorias
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Generar credenciales aleatorias
DB_ROOT_PASSWORD=$(generate_password)
DB_USER_PASSWORD=$(generate_password)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

# Crear archivo .env para el entorno especificado
cat > $ENV_FILE << EOF
# Configuración de la aplicación
NODE_ENV=development
APP_NAME=NodeJS API
PORT=3000
EXTERNAL_PORT=3000
APP_URL=http://localhost:3000
FRONT_DOMAIN=http://localhost:3000

# Configuración de base de datos MySQL (GENERADAS AUTOMÁTICAMENTE)
DB_HOST=mysql
DB_PORT=3307
DB_USER=reto_user
DB_PASS=${DB_USER_PASSWORD}
DB_NAME=reto_tecnico
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}

# JWT Secret (GENERADO AUTOMÁTICAMENTE)
JWT_SECRET=${JWT_SECRET}

# Configuración de logging
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_DIRECTORY=./logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Debug
APP_DEBUG=true
EOF

echo "✅ Archivo $ENV_FILE creado con credenciales aleatorias"
echo "🔑 Credenciales generadas:"
echo "   - Usuario BD: reto_user"
echo "   - Password BD: ${DB_USER_PASSWORD}"
echo "   - Root Password: ${DB_ROOT_PASSWORD}"
echo "   - JWT Secret: ${JWT_SECRET}"
echo ""
echo "🚀 Ahora puedes ejecutar:"

# Cargar utilidades de Docker Compose para mostrar el comando correcto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/docker-utils.sh"

DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   $DOCKER_COMPOSE_CMD up -d"
else
    echo "   docker compose up -d  # o docker-compose up -d"
fi
