# Tests del Backend - Reto Técnico

Este directorio contiene todas las pruebas unitarias y de integración para los endpoints del backend.

## 🚀 **Cómo ejecutar los tests**

### Ejecutar todos los tests
```bash
yarn test
```

### Ejecutar tests específicos
```bash
# Solo tests de Login
yarn test --testNamePattern="Login Controller"

# Solo tests de Sends
yarn test --testNamePattern="Sends Controller"

# Solo tests de General (routes, drivers)
yarn test --testNamePattern="General Controller"

# Solo tests de Users
yarn test --testNamePattern="Users Controller"
```

### Ejecutar tests con watch mode (desarrollo)
```bash
yarn test --watch
```

### Ejecutar tests sin coverage
```bash
yarn test --coverage=false
```

## 📁 **Estructura de Tests**

```
test/
├── setup.ts                    # Configuración global de tests
├── helpers/
│   └── testHelpers.ts          # Utilidades y datos mock
├── controllers/
│   ├── Login.test.ts           # Tests de autenticación
│   ├── Sends.test.ts           # Tests de envíos
│   ├── General.test.ts         # Tests de rutas y conductores
│   └── Users.test.ts           # Tests de usuarios
└── README.md                   # Esta documentación
```

## 🔧 **Configuración**

### Mocks incluidos:
- **MySQL2**: Mock completo de la base de datos
- **Socket.IO**: Mock de las notificaciones en tiempo real
- **JWT**: Tokens válidos e inválidos para autenticación
- **bcryptjs**: Hash y verificación de contraseñas

### Variables de entorno para tests:
```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
DB_HOST=localhost
DB_USER=test
DB_PASSWORD=test
DB_NAME=test_db
PORT=3001
```

## 📊 **Cobertura de Tests**

Los tests cubren:

### **Login Controller**
- ✅ Login exitoso con credenciales válidas
- ✅ Login fallido con email inexistente
- ✅ Login fallido con contraseña incorrecta
- ✅ Validación de datos de entrada
- ✅ Validación de tokens JWT
- ✅ Manejo de errores de base de datos

### **Sends Controller**
- ✅ Crear envío exitosamente
- ✅ Crear envío con ruta y conductor
- ✅ Validación de capacidad de vehículo
- ✅ Validación de disponibilidad de conductor
- ✅ Actualizar envío exitosamente
- ✅ Cambio automático a "en tránsito"
- ✅ Notificaciones socket específicas
- ✅ Validaciones de permisos y existencia
- ✅ Filtrado de envíos con paginación

### **General Controller**
- ✅ Obtener rutas con vehículos asociados
- ✅ Obtener conductores ordenados por nombre
- ✅ Manejo de datos vacíos
- ✅ Autenticación requerida
- ✅ Manejo de errores de base de datos

### **Users Controller**
- ✅ Obtener usuarios con paginación
- ✅ Exclusión de contraseñas en respuesta
- ✅ Valores por defecto de paginación
- ✅ Manejo de parámetros inválidos
- ✅ Rate limiting (middleware)
- ✅ Autenticación requerida

## 🎯 **Datos de Prueba**

Los tests utilizan datos basados en `database.sql`:

### Usuarios:
- **Admin**: `a@mail.com` (rol_id: 1)
- **Usuario**: `afd@mail.com` (rol_id: 2)

### Conductores:
- Juan cano (12345678)
- Jose Pekerman (123456789)
- Camilo Vargas (98765432)

### Vehículos:
- Turbo (capacidad: 15)
- Chevrolet (capacidad: 2)

### Rutas:
- COL001: De sur a norte

## 🔍 **Casos de Prueba Principales**

### Autenticación:
- Tokens válidos e inválidos
- Usuarios existentes y no existentes
- Contraseñas correctas e incorrectas

### Validaciones de Negocio:
- Capacidad de vehículos vs unidades del envío
- Disponibilidad de conductores
- Permisos de usuario (propietario vs otros)

### Notificaciones Socket:
- Nuevo envío creado
- Envío asignado automáticamente
- Cambio manual a "en tránsito"
- Envío entregado
- Actualización general de envío

### Paginación:
- Valores por defecto (page: 1, limit: 20)
- Parámetros personalizados
- Manejo de valores inválidos
- Cálculo correcto de páginas totales

## 🚨 **Errores Comunes y Soluciones**

### "Cannot find module '@types'"
```bash
# Asegúrate de que el moduleNameMapper esté configurado en jest.config.js
```

### "Database connection error" en tests
```bash
# Los mocks de MySQL2 están configurados automáticamente
# Verifica que setup.ts esté siendo cargado correctamente
```

### "Socket.io is not a function"
```bash
# El mock de Socket.IO está incluido en setup.ts
# Verifica que no estés importando socket.io directamente en los tests
```

## 📈 **Métricas de Coverage**

Para obtener un reporte detallado de cobertura:
```bash
yarn test --coverage
open coverage/lcov-report/index.html
```

Los tests están diseñados para cubrir:
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%
