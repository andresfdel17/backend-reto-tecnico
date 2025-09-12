#!/bin/bash

# Script de inicio completo con credenciales aleatorias
set -e

echo "🚀 Iniciando proyecto con credenciales aleatorias..."

# Verificar si existe .env.template, si no, crearlo desde .env local
if [ ! -f ".env.template" ]; then
    echo "📋 .env.template no existe, creándolo desde .env local..."
    if [ -f ".env" ]; then
        ./scripts/sync-env-template.sh true
    else
        echo "❌ Error: No existe .env local para crear .env.template"
        echo "   Asegúrate de tener tu archivo .env configurado primero"
        exit 1
    fi
fi

# Verificar si ya existe .env
if [ -f ".env" ]; then
    echo "⚠️  El archivo .env ya existe."
    read -p "¿Deseas generar nuevas credenciales? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Usando credenciales existentes"
    else
        echo "🔄 Generando nuevas credenciales..."
        ./scripts/generate-env.sh
    fi
else
    echo "🔐 Generando credenciales por primera vez..."
    ./scripts/generate-env.sh
fi

echo ""
echo "🐳 Iniciando servicios Docker..."

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "   Por favor, inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

# Limpiar contenedores anteriores si existen
echo "🧹 Limpiando contenedores anteriores..."
docker-compose down 2>/dev/null || true

# Levantar servicios
echo "⬆️  Levantando servicios..."
docker-compose up -d

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
