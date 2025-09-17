#!/bin/bash

# Script auxiliar para ejecutar comandos Docker Compose con detección automática
# Uso: ./scripts/docker-cmd.sh [comando docker-compose]

# Cargar utilidades de Docker Compose
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/docker-utils.sh"

# Verificar que se pasó al menos un argumento
if [ $# -eq 0 ]; then
    echo "❌ Error: Se requiere al menos un comando"
    echo "Uso: $0 [comando docker-compose]"
    echo "Ejemplo: $0 down -v"
    exit 1
fi

# Ejecutar el comando con detección automática
docker_compose_run "$@"
