#!/bin/bash

# Script de inicio para Docker
echo "🐳 Iniciando la aplicación Node.js..."

# Verificar que las variables de entorno requeridas estén configuradas
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Error: Variables de base de datos no configuradas"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET no configurado"
    exit 1
fi

# Esperar a que MySQL esté disponible
echo "⏳ Esperando a que MySQL esté disponible..."
while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" --silent; do
    sleep 2
done
echo "✅ MySQL está disponible"

# Iniciar la aplicación
echo "🚀 Iniciando la aplicación en el puerto $PORT"
exec yarn start
