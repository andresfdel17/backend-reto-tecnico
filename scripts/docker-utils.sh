#!/bin/bash

# Utilidades compartidas para Docker Compose
# Detecta automáticamente si usar 'docker-compose' o 'docker compose'

# Función para detectar el comando correcto de Docker Compose
get_docker_compose_cmd() {
    # Primero intentar con 'docker compose' (versión más nueva)
    if docker compose version > /dev/null 2>&1; then
        echo "docker compose"
        return 0
    fi
    
    # Si no funciona, intentar con 'docker-compose' (versión legacy)
    if docker-compose --version > /dev/null 2>&1; then
        echo "docker-compose"
        return 0
    fi
    
    # Si ninguno funciona, mostrar error
    echo "❌ Error: No se encontró 'docker compose' ni 'docker-compose'"
    echo "   Por favor, instala Docker Compose:"
    echo "   - Docker Desktop: incluye 'docker compose'"
    echo "   - Standalone: instala docker-compose-plugin o docker-compose"
    return 1
}

# Función para ejecutar comandos de Docker Compose con detección automática
docker_compose_run() {
    local cmd
    cmd=$(get_docker_compose_cmd)
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    # Mostrar el comando que se va a ejecutar (para debugging)
    echo "🐳 Ejecutando: $cmd $*"
    
    # Ejecutar el comando
    $cmd "$@"
}

# Función para verificar que Docker está corriendo
verify_docker_running() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Error: Docker no está corriendo"
        echo "   Por favor, inicia Docker Desktop y vuelve a intentar"
        return 1
    fi
    return 0
}

# Función para mostrar información sobre la versión detectada
show_docker_compose_info() {
    local cmd
    cmd=$(get_docker_compose_cmd)
    if [ $? -eq 0 ]; then
        echo "ℹ️  Usando: $cmd"
        if [ "$cmd" = "docker compose" ]; then
            echo "   (Docker Compose V2 - integrado en Docker)"
        else
            echo "   (Docker Compose V1 - standalone)"
        fi
    fi
}
