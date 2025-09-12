#!/bin/bash
# Script de inicialización de base de datos más robusto

set -e

echo "🗄️  Inicializando base de datos..."

# Esperar a que MySQL esté listo
until mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1" &> /dev/null; do
  echo "⏳ Esperando MySQL..."
  sleep 2
done

echo "✅ MySQL está listo"

# Ejecutar script de inicialización
mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" < /docker-entrypoint-initdb.d/init.sql

echo "🎉 Base de datos inicializada correctamente"
