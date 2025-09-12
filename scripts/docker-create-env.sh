#!/bin/sh

# Script para crear archivo .env dentro del contenedor Docker
# Usa el .env local como base y solo cambia las credenciales de BD por seguridad

echo "🔧 Creando archivo .env basado en configuración local..."

# Verificar si existe .env.template (copia del .env local)
if [ -f ".env.template" ]; then
    echo "📋 Usando .env.template como base..."
    # Copiar .env.template como base
    cp .env.template .env
    
    # Solo reemplazar las credenciales de BD con las generadas por Docker
    sed -i "s/^DB_HOST=.*/DB_HOST=${DB_HOST}/" .env
    sed -i "s/^DB_PORT=.*/DB_PORT=${DB_PORT}/" .env
    sed -i "s/^DB_USER=.*/DB_USER=${DB_USER}/" .env
    sed -i "s/^DB_PASS=.*/DB_PASS=${DB_PASS}/" .env
    sed -i "s/^DB_NAME=.*/DB_NAME=${DB_NAME}/" .env
    
    echo "✅ Archivo .env creado con credenciales de BD seguras"
    echo "🔒 Solo se cambiaron las credenciales de BD por seguridad"
    echo "🔑 JWT_SECRET y demás configuraciones mantienen los valores locales"
else
    echo "⚠️  .env.template no encontrado, creando .env básico..."
    # Fallback: crear .env básico si no existe template
    cat > .env << EOF
# Configuración de la aplicación (generado automáticamente)
NODE_ENV=${NODE_ENV}
APP_NAME=${APP_NAME}
APP_URL=${APP_URL}
PORT=${PORT}
FRONT_DOMAIN=${FRONT_DOMAIN}

# Configuración de base de datos (credenciales seguras)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DB_NAME=${DB_NAME}

# JWT Secret (desde docker-compose)
JWT_SECRET=${JWT_SECRET}

# Configuración de logging
LOG_LEVEL=${LOG_LEVEL}
LOG_TO_FILE=${LOG_TO_FILE}
LOG_DIRECTORY=${LOG_DIRECTORY}
LOG_MAX_SIZE=${LOG_MAX_SIZE}
LOG_MAX_FILES=${LOG_MAX_FILES}

# Debug
APP_DEBUG=${APP_DEBUG}
EOF
fi

echo "📊 Variables de BD configuradas:"
echo "   - DB_HOST: ${DB_HOST}"
echo "   - DB_PORT: ${DB_PORT}"
echo "   - DB_USER: ${DB_USER}"
echo "   - DB_NAME: ${DB_NAME}"
echo ""
