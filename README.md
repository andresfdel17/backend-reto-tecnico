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
- ✅ **Siempre reconstruye la imagen** (sin caché, código más reciente)

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

## 📊 API de Gráficos y Analytics

### Endpoint de Datos para Gráficos
```http
GET /api/home/charts-data?period=7&user_id=2
```

**Parámetros:**
- `period` (opcional): Número de días a incluir (7, 15, 30). Por defecto: 7
- `user_id` (opcional, solo admin): ID del usuario específico a filtrar

**Respuesta:**
```json
{
  "code": 200,
  "data": {
    "chartData": {
      "labels": ["1/1/2024", "2/1/2024", ...],
      "datasets": [
        {
          "label": "Creados",
          "data": [5, 3, 8, ...],
          "borderColor": "#007bff"
        },
        {
          "label": "En Tránsito", 
          "data": [2, 4, 6, ...],
          "borderColor": "#ffc107"
        }
      ]
    },
    "stats": {
      "created": 45,
      "inTransit": 12,
      "delivered": 28,
      "cancelled": 3,
      "total": 88
    },
    "period": 7,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-01-07"
    },
    "filters": {
      "user_id": 2,
      "isAdmin": true
    }
  }
}
```

**Características:**
- ✅ **Incluye día actual** en el rango de fechas
- ✅ **Filtrado por rol**: Usuarios normales ven solo sus datos
- ✅ **Filtro de usuario para admin**: Parámetro `user_id` opcional
- ✅ **Datos listos para Chart.js**: Formato optimizado para gráficos
- ✅ **Estadísticas agregadas**: Totales por estado de envío

## 🧪 Testing

El proyecto incluye un sistema completo de pruebas unitarias con Jest y Supertest.

### Comandos de Testing

```bash
# Ejecutar todas las pruebas
yarn test

# Ejecutar pruebas con reporte de cobertura
yarn test:coverage
```

### Cobertura Actual

El proyecto mantiene una **cobertura del 35.2%** con tests que incluyen:

- **Controllers**: Tests de endpoints con autenticación simulada
  - ✅ Login (95.55% coverage)
  - ✅ Users (50% coverage)
  - ✅ Sends (15.29% coverage)
  - ✅ General (42.85% coverage)

- **Middlewares**: Tests de manejo de errores
  - ✅ ErrorMiddleware (87.5% coverage)

- **Utils**: Tests de construcción de queries dinámicas
  - ✅ QueryBuilder (63.82% coverage)

- **Schemas**: Validación de datos (100% coverage)
  - ✅ loginSchemas
  - ✅ sendSchemas
  - ✅ routeSchemas

### Características del Testing

- **🔒 Tests Aislados**: Cada test es completamente independiente
- **🗄️ Mocking de Base de Datos**: Sin conexiones reales a MySQL
- **🚀 Ejecución Rápida**: Todos los tests corren en menos de 6 segundos
- **🔐 Autenticación Simulada**: Tests con JWT y middlewares mockeados
- **📊 Reportes Detallados**: Cobertura línea por línea con Jest
- **⚡ Sin Cuelgues**: Tests optimizados para no quedarse ejecutando

### Archivos de Testing

```
test/
├── setup.ts              # Configuración global y mocks
├── helpers/
│   └── testHelpers.ts     # Datos mock y utilidades
├── controllers/           # Tests de endpoints
│   ├── Login.test.ts
│   ├── Users.test.ts
│   ├── Sends.test.ts
│   └── General.test.ts
├── middlewares/           # Tests de middlewares
│   └── ErrorMiddleware.test.ts
└── util/                  # Tests de utilidades
    └── QueryBuilder.test.ts
```

### Datos Mock

Los tests utilizan datos consistentes basados en `database.sql`:

- **Usuarios**: `a@mail.com` (Admin) y `afd@mail.com` (User)
- **Envíos**: Estados 1-4 (Creado, En tránsito, Entregado, Anulado)
- **Rutas y Conductores**: Datos realistas para validaciones

## 📁 Estructura

- `src/` - Código fuente de la API
- `test/` - Suite completa de pruebas unitarias
- `scripts/` - Scripts de automatización
- `database.sql` - Estructura de base de datos
- `docker-compose.yml` - Configuración de servicios
