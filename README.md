# Backend - Reto Técnico

API backend desarrollada en Node.js con TypeScript, MySQL y Docker.

## 🚀 Despliegue rápido

```bash
# Un solo comando despliega todo el entorno
yarn setup-backend
```

Este comando:
- ✅ Configura credenciales de BD aleatorias por seguridad
- ✅ Levanta MySQL en puerto 3307 (sin conflictos con MySQL local)
- ✅ Levanta la API en puerto personalizable (por defecto 3000)
- ✅ Incluye phpMyAdmin para visualizar tablas y datos de BD
- ✅ Importa automáticamente la estructura de BD
- ✅ **Siempre recrea la BD limpia** (elimina volúmenes automáticamente)

## 🔗 URLs disponibles

Una vez desplegado:

- **API**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080 (interfaz para visualizar tablas y datos de BD)
- **MySQL**: localhost:3307

## 🔴 phpMyAdmin - Solo para monitoreo

**⚠️ IMPORTANTE**: phpMyAdmin está incluido únicamente para **fines de monitoreo y demostración** del reto técnico. Permite visualizar las tablas, datos y estructura de la base de datos a través de una interfaz web amigable.

## 📋 Comandos adicionales

```bash
# Ver logs en tiempo real
yarn docker:logs

# Parar servicios (elimina volúmenes automáticamente)
yarn docker:stop

# Reiniciar servicios (recrea todo limpio)
yarn docker:restart

# Verificar que todo funcione
yarn verify-backend

# Limpiar todo + sistema Docker
yarn docker:clean
```

## 🛠️ Desarrollo

Para desarrollo local sin Docker, configura tu archivo `.env` y ejecuta:

```bash
yarn dev
```

## 🌐 Comunicación con Frontend

Este backend crea una **red Docker compartida** (`reto_tecnico_network`) que permite la comunicación con el frontend:

```bash
# 1. Levantar backend (crea la red)
yarn setup-backend

# 2. Levantar frontend (usa la red existente)
cd ../frontend-reto-tecnico
yarn setup-frontend
```

Los contenedores se pueden comunicar usando sus nombres:
- Backend accesible como `backend` desde otros contenedores
- MySQL accesible como `mysql` desde otros contenedores

## 📁 Estructura

- `src/` - Código fuente de la API
- `scripts/` - Scripts de automatización
- `database.sql` - Estructura de base de datos
- `docker-compose.yml` - Configuración de servicios
