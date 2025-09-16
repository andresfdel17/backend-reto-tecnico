#!/bin/bash

# Script de inicio completo con credenciales aleatorias
set -e

echo "🚀 Iniciando proyecto con credenciales aleatorias..."

# Verificar si existe .env
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env desde .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Archivo .env creado desde .env.example"
        echo "🔧 Configuración por defecto aplicada:"
        echo "   - API: http://localhost:3000"
        echo "   - MySQL: localhost:3307 (usuario: reto_user)"
        echo "   - Frontend: http://localhost:3001"
    else
        echo "❌ Error: .env.example no encontrado"
        echo "   Creando .env con configuración por defecto..."
        cat > .env << 'EOF'
# Configuración de la aplicación
NODE_ENV=development
APP_NAME=NodeJS API
PORT=3000
EXTERNAL_PORT=3000
APP_URL=http://localhost:3000
FRONT_DOMAIN=http://localhost:3001

# Configuración de base de datos MySQL (PARA DESARROLLO LOCAL)
DB_HOST=localhost
DB_PORT=3307
DB_USER=reto_user
DB_PASS=userpass123
DB_NAME=reto_tecnico
DB_ROOT_PASSWORD=rootpass123

# JWT Secret (GENERAR UNO NUEVO EN PRODUCCIÓN)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production-12345

# Configuración de logging
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_DIRECTORY=./logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d

# Debug
APP_DEBUG=true
EOF
        echo "✅ Archivo .env creado con configuración por defecto"
    fi
else
    echo "✅ Archivo .env encontrado"
fi

# Verificar si existe .env.template, si no, crearlo desde .env
if [ ! -f ".env.template" ]; then
    echo "📋 Creando .env.template desde .env..."
    ./scripts/sync-env-template.sh true
fi

echo "📝 Usando archivo .env (las credenciales de BD en Docker están hardcodeadas)"
echo "🔒 MySQL Docker usa credenciales fijas: reto_user/userpass123"

echo ""
echo "🐳 Iniciando servicios Docker..."

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "   Por favor, inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

# Limpiar contenedores anteriores y volúmenes si existen
echo "🧹 Limpiando contenedores anteriores y volúmenes..."
docker-compose down -v 2>/dev/null || true

# Levantar servicios (siempre reconstruir sin caché)
echo "⬆️  Levantando servicios (reconstruyendo imagen sin caché)..."
docker-compose up -d --build --force-recreate

echo ""
echo "⏳ Esperando a que los servicios estén listos..."

# Esperar a que MySQL esté listo
echo "   - Esperando MySQL..."
timeout=60
counter=0
until docker-compose exec -T mysql mysqladmin ping -h"localhost" --silent 2>/dev/null; do
    if [ $counter -eq $timeout ]; then
        echo "❌ Timeout esperando MySQL"
        docker-compose logs mysql
        exit 1
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo " ✅"

# Esperar a que la API esté lista
echo "   - Esperando API..."
timeout=30
counter=0
until curl -s http://localhost:${PORT:-3000}/health > /dev/null 2>&1; do
    if [ $counter -eq $timeout ]; then
        echo " ⚠️  API no responde en /health, pero puede estar funcionando"
        break
    fi
    sleep 1
    counter=$((counter + 1))
    echo -n "."
done
echo " ✅"

echo ""
echo "🎉 ¡Servicios iniciados correctamente!"
echo ""
echo "📊 Estado de los servicios:"
docker-compose ps
echo ""
echo "🔗 URLs disponibles:"
echo "   - API: http://localhost:${PORT:-3000}"
echo "   - MySQL: localhost:${DB_PORT:-3306}"
echo ""
echo "🗄️  Verificar base de datos:"
echo "   docker-compose exec mysql mysql -u\$(grep DB_USER .env | cut -d'=' -f2) -p\$(grep DB_PASS .env | cut -d'=' -f2) reto_tecnico -e 'SHOW TABLES;'"
echo ""
echo "📝 Ver logs:"
echo "   docker-compose logs -f"
