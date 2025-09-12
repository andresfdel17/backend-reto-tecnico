#!/bin/bash

# Script para sincronizar .env local con .env.template

# Verificar si se está ejecutando en modo silencioso (desde otro script)
SILENT_MODE=${1:-false}

if [ "$SILENT_MODE" != "true" ]; then
    echo "🔄 Sincronizando .env local con .env.template..."
fi

if [ ! -f ".env" ]; then
    echo "❌ Error: Archivo .env no encontrado"
    echo "   Asegúrate de tener tu .env local configurado primero"
    exit 1
fi

# Crear .env.template basado en .env local
cp .env .env.template

if [ "$SILENT_MODE" != "true" ]; then
    echo "✅ .env.template creado/actualizado"
    echo "📋 Este archivo se usará como base en Docker"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   - .env.template se versiona en Git"
    echo "   - Las credenciales de BD se generarán automáticamente en Docker"
    echo "   - JWT_SECRET y demás configuraciones se mantendrán iguales"
    echo ""
    echo "🔒 Variables que se cambiarán automáticamente en Docker:"
    echo "   - DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME"
    echo ""
    echo "🔑 Variables que se mantendrán iguales:"
    echo "   - JWT_SECRET, LOG_*, PORT, APP_*, etc."
else
    echo "   ✅ .env.template creado desde .env local"
fi
