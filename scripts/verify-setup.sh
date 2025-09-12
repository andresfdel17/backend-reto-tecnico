#!/bin/bash

# Script para verificar que la configuración de Docker está funcionando correctamente

echo "🔍 Verificando configuración del backend..."

# Verificar que el archivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    echo "   Ejecuta: yarn setup-backend"
    exit 1
fi

# Cargar variables de entorno
source .env

echo "✅ Archivo .env encontrado"

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

echo "✅ Docker está corriendo"

# Verificar que los contenedores están activos
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Error: Los contenedores no están corriendo"
    echo "   Ejecuta: yarn setup-backend"
    exit 1
fi

echo "✅ Contenedores están activos"

# Verificar conexión a MySQL
echo "🔍 Verificando conexión a MySQL..."
if docker-compose exec -T mysql mysql -u"$DB_USER" -p"$DB_PASS" -e "SELECT 'Conexión exitosa' as status;" > /dev/null 2>&1; then
    echo "✅ Conexión a MySQL exitosa"
else
    echo "❌ Error: No se puede conectar a MySQL"
    echo "   Verifica las credenciales en .env"
    exit 1
fi

# Verificar que la base de datos existe
echo "🔍 Verificando base de datos reto_tecnico..."
if docker-compose exec -T mysql mysql -u"$DB_USER" -p"$DB_PASS" -e "USE reto_tecnico; SELECT 'BD existe' as status;" > /dev/null 2>&1; then
    echo "✅ Base de datos reto_tecnico existe"
else
    echo "❌ Error: Base de datos reto_tecnico no existe"
    exit 1
fi

# Verificar tablas
echo "🔍 Verificando tablas..."
TABLES=$(docker-compose exec -T mysql mysql -u"$DB_USER" -p"$DB_PASS" reto_tecnico -e "SHOW TABLES;" 2>/dev/null | tail -n +2)
if [ -n "$TABLES" ]; then
    echo "✅ Tablas encontradas:"
    echo "$TABLES" | sed 's/^/   - /'
else
    echo "⚠️  Advertencia: No se encontraron tablas"
fi

# Verificar API (si está corriendo)
echo "🔍 Verificando API..."
if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
    echo "✅ API responde en puerto $PORT"
else
    echo "⚠️  API no responde (puede estar iniciando)"
fi

# Verificar phpMyAdmin
echo "🔍 Verificando phpMyAdmin..."
if curl -s "http://localhost:8080" > /dev/null 2>&1; then
    echo "✅ phpMyAdmin disponible en puerto 8080"
else
    echo "⚠️  phpMyAdmin no responde (puede estar iniciando)"
fi

echo ""
echo "🎉 Verificación completada"
echo ""
echo "📊 Información del entorno:"
echo "   - Puerto API: $PORT"
echo "   - Puerto MySQL: $DB_PORT"
echo "   - Puerto phpMyAdmin: 8080"
echo "   - Usuario BD: $DB_USER"
echo "   - Base de datos: $DB_NAME"
echo ""
echo "🔗 URLs disponibles:"
echo "   - API: http://localhost:$PORT"
echo "   - phpMyAdmin: http://localhost:8080"
echo "   - MySQL: localhost:$DB_PORT"
echo ""
echo "🛠️ Comandos útiles:"
echo "   - Logs: yarn docker:logs"
echo "   - Parar: yarn docker:stop"
echo "   - Reiniciar: yarn docker:restart"
