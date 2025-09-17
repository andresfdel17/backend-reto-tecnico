export const swaggerConfig = {
    document: {
        openapi: '3.0.0',
        info: {
            title: 'API de Gestión de Envíos - Reto Técnico',
            description: `
# API de Gestión de Envíos

Esta API permite gestionar un sistema completo de envíos con las siguientes funcionalidades:

## 🚀 Características principales
- **Autenticación JWT** con roles (Admin/Usuario)
- **Gestión de envíos** con estados y tracking
- **Dashboard con gráficas** y métricas en tiempo real
- **Gestión de conductores** y rutas
- **Tracking público** sin autenticación
- **Notificaciones en tiempo real** con Socket.IO
- **Internacionalización** (ES/EN)

## 🔐 Autenticación
La mayoría de endpoints requieren autenticación JWT. Usa el endpoint \`POST /login/login\` para obtener un token.

## 👥 Roles de Usuario
- **Admin (rol_id: 1)**: Acceso completo a todos los endpoints
- **Usuario (rol_id: 2)**: Acceso limitado a sus propios datos

## 📊 Estados de Envíos
1. **En espera** (state: 1) - Envío creado
2. **En tránsito** (state: 2) - Envío en camino
3. **Entregado** (state: 3) - Envío completado
4. **Cancelado** (state: 4) - Envío cancelado
            `,
            version: '1.0.0',
            contact: {
                name: 'Equipo de Desarrollo',
                email: 'dev@retotecnico.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor de desarrollo',
            },
        ],
        paths: {
            // AUTENTICACIÓN
            '/login/login': {
                post: {
                    description: 'Autentica un usuario con email y contraseña, devuelve un token JWT válido',
                    tags: ['Autenticación'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            description: 'Email del usuario',
                                        },
                                        password: {
                                            type: 'string',
                                            minLength: 6,
                                            description: 'Contraseña del usuario',
                                        },
                                    },
                                },
                                examples: {
                                    Administrador: {
                                        description: 'Login como administrador con acceso completo',
                                        value: {
                                            email: 'a@mail.com',
                                            password: '123456',
                                        },
                                    },
                                    'Usuario Regular': {
                                        description: 'Login como usuario regular con acceso limitado',
                                        value: {
                                            email: 'afd@mail.com',
                                            password: '12345678',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Login exitoso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            token: {
                                                type: 'string',
                                                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                                description: 'Token JWT para autenticación',
                                            },
                                            text: { type: 'string', example: 'session-started' },
                                            user: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'number', example: 1 },
                                                    name: { type: 'string', example: 'Admin User' },
                                                    email: { type: 'string', example: 'a@mail.com' },
                                                },
                                            },
                                        },
                                    },
                                    examples: {
                                        'Login Admin Exitoso': {
                                            description: 'Respuesta exitosa para administrador',
                                            value: {
                                                code: 200,
                                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoxLCJuYW1lIjoiQWRtaW4gVXNlciIsImVtYWlsIjoiYUBtYWlsLmNvbSIsInJvbF9pZCI6MX0sImV4cCI6MTcwMDAwMDAwMH0...',
                                                text: 'session-started',
                                                user: {
                                                    id: 1,
                                                    name: 'Admin User',
                                                    email: 'a@mail.com',
                                                },
                                            },
                                        },
                                        'Login Usuario Exitoso': {
                                            description: 'Respuesta exitosa para usuario regular',
                                            value: {
                                                code: 200,
                                                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoyLCJuYW1lIjoiVXNlciIsImVtYWlsIjoiYWZkQG1haWwuY29tIiwicm9sX2lkIjoyfSwiZXhwIjoxNzAwMDAwMDAwfQ...',
                                                text: 'session-started',
                                                user: {
                                                    id: 2,
                                                    name: 'User',
                                                    email: 'afd@mail.com',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: 'Datos inválidos o contraseña incorrecta',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number' },
                                            text: { type: 'string' },
                                        },
                                    },
                                    examples: {
                                        'Error de validación': {
                                            description: 'Datos de entrada inválidos',
                                            value: {
                                                code: 400,
                                                text: 'Validation error: email is required',
                                            },
                                        },
                                        'Credenciales incorrectas': {
                                            description: 'Email o contraseña incorrectos',
                                            value: {
                                                code: 400,
                                                text: 'user-pass-unk',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description: 'Usuario no encontrado',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 401 },
                                            text: { type: 'string', example: 'user-pass-unk' },
                                        },
                                    },
                                },
                            },
                        },
                        429: {
                            description: 'Demasiados intentos de login',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            error: { type: 'string', example: 'Too many requests' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/login/register': {
                post: {
                    description: 'Crea una nueva cuenta de usuario con rol de usuario regular (rol_id = 2)',
                    tags: ['Autenticación'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'password'],
                                    properties: {
                                        name: {
                                            type: 'string',
                                            minLength: 2,
                                            description: 'Nombre completo del usuario',
                                        },
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            description: 'Email del usuario',
                                        },
                                        password: {
                                            type: 'string',
                                            minLength: 6,
                                            description: 'Contraseña del usuario',
                                        },
                                    },
                                },
                                examples: {
                                    'Registro nuevo usuario': {
                                        description: 'Ejemplo de registro de usuario regular',
                                        value: {
                                            name: 'Juan Pérez',
                                            email: 'juan@mail.com',
                                            password: 'password123',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Usuario creado exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 201 },
                                            text: { type: 'string', example: 'user-created' },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: 'Datos inválidos o usuario ya existe',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number' },
                                            text: { type: 'string' },
                                        },
                                    },
                                    examples: {
                                        'Usuario ya existe': {
                                            description: 'El email ya está registrado',
                                            value: {
                                                code: 400,
                                                text: 'user-exists',
                                            },
                                        },
                                        'Error de validación': {
                                            description: 'Datos de entrada inválidos',
                                            value: {
                                                code: 400,
                                                text: 'Validation error details',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // USUARIOS
            '/users/getAllUsers': {
                get: {
                    description:
                        'Devuelve una lista paginada de todos los usuarios del sistema con información básica (sin contraseñas). SOLO DISPONIBLE PARA ADMINISTRADORES.',
                    tags: ['Usuarios'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        {
                            name: 'page',
                            in: 'query',
                            schema: { type: 'integer', minimum: 1, default: 1 },
                            description: 'Número de página (inicia en 1)',
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                            description: 'Cantidad de usuarios por página (máximo 100)',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de usuarios obtenida exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'number', example: 1 },
                                                        name: { type: 'string', example: 'Juan Pérez' },
                                                        email: { type: 'string', example: 'juan@mail.com' },
                                                        rol_id: { type: 'number', example: 2 },
                                                    },
                                                },
                                            },
                                            pagination: {
                                                type: 'object',
                                                properties: {
                                                    page: { type: 'number', example: 1 },
                                                    limit: { type: 'number', example: 20 },
                                                    total: { type: 'number', example: 50 },
                                                    totalPages: { type: 'number', example: 3 },
                                                },
                                            },
                                            message: { type: 'string', example: 'users-retrieved' },
                                        },
                                    },
                                    examples: {
                                        'Lista usuarios página 1': {
                                            description: 'Primera página de usuarios',
                                            value: {
                                                code: 200,
                                                data: [
                                                    {
                                                        id: 1,
                                                        name: 'Admin User',
                                                        email: 'a@mail.com',
                                                        rol_id: 1,
                                                    },
                                                    {
                                                        id: 2,
                                                        name: 'Regular User',
                                                        email: 'afd@mail.com',
                                                        rol_id: 2,
                                                    },
                                                ],
                                                pagination: {
                                                    page: 1,
                                                    limit: 20,
                                                    total: 2,
                                                    totalPages: 1,
                                                },
                                                message: 'users-retrieved',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description: 'Token de autenticación requerido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number' },
                                            text: { type: 'string' },
                                        },
                                    },
                                    examples: {
                                        'Token no válido': {
                                            description: 'Token JWT inválido o expirado',
                                            value: {
                                                code: 401,
                                                text: 'invalid-token',
                                            },
                                        },
                                        'Token faltante': {
                                            description: 'Header Authorization no enviado',
                                            value: {
                                                code: 401,
                                                text: 'authentication-required',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        403: {
                            description: 'Permisos insuficientes (solo administradores)',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 403 },
                                            text: { type: 'string', example: 'insufficient-permissions' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // DRIVERS
            '/drivers/drivers': {
                get: {
                    description: 'Obtiene la lista de todos los conductores disponibles',
                    tags: ['Conductores'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Lista de conductores obtenida exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'number', example: 1 },
                                                        cifnif: { type: 'string', example: '12345678A' },
                                                        name: { type: 'string', example: 'Carlos Conductor' },
                                                    },
                                                },
                                            },
                                            text: { type: 'string', example: 'drivers-retrieved' },
                                        },
                                    },
                                    examples: {
                                        'Lista de conductores': {
                                            description: 'Lista completa de conductores disponibles',
                                            value: {
                                                code: 200,
                                                data: [
                                                    {
                                                        id: 1,
                                                        cifnif: '12345678A',
                                                        name: 'Carlos Conductor',
                                                    },
                                                    {
                                                        id: 2,
                                                        cifnif: '87654321B',
                                                        name: 'María Transportista',
                                                    },
                                                ],
                                                text: 'drivers-retrieved',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description: 'Token de autenticación requerido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 401 },
                                            text: { type: 'string', example: 'invalid-token' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/drivers/create': {
                post: {
                    description: 'Crea un nuevo conductor en el sistema',
                    tags: ['Conductores'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['cifnif', 'name'],
                                    properties: {
                                        cifnif: {
                                            type: 'string',
                                            pattern: '^[0-9]{8}[A-Za-z]$',
                                            description: 'CIF/NIF del conductor (8 dígitos + letra)',
                                        },
                                        name: {
                                            type: 'string',
                                            minLength: 2,
                                            description: 'Nombre completo del conductor',
                                        },
                                    },
                                },
                                examples: {
                                    'Conductor nuevo': {
                                        description: 'Ejemplo de creación de conductor',
                                        value: {
                                            cifnif: '12345678A',
                                            name: 'Carlos Conductor',
                                        },
                                    },
                                    'Conductor femenino': {
                                        description: 'Ejemplo con conductora',
                                        value: {
                                            cifnif: '87654321B',
                                            name: 'María Transportista',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Conductor creado exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 201 },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'number', example: 1 },
                                                    cifnif: { type: 'string', example: '12345678A' },
                                                    name: { type: 'string', example: 'Carlos Conductor' },
                                                },
                                            },
                                            text: { type: 'string', example: 'driver-created' },
                                        },
                                    },
                                    examples: {
                                        'Conductor creado exitosamente': {
                                            description: 'Respuesta exitosa de creación',
                                            value: {
                                                code: 201,
                                                data: {
                                                    id: 3,
                                                    cifnif: '12345678A',
                                                    name: 'Carlos Conductor',
                                                },
                                                text: 'driver-created',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: 'Datos inválidos',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number' },
                                            text: { type: 'string' },
                                        },
                                    },
                                    examples: {
                                        'Error de validación': {
                                            description: 'Datos de entrada inválidos',
                                            value: {
                                                code: 400,
                                                text: 'Validation error: cifnif must match pattern',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        409: {
                            description: 'Conductor ya existe',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 409 },
                                            text: { type: 'string', example: 'existing-driver' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // TRACKING PÚBLICO
            '/home/tracking/{unique_id}': {
                get: {
                    description:
                        'Rastreo público de un envío específico mediante su unique_id. No requiere autenticación.',
                    tags: ['Tracking'],
                    parameters: [
                        {
                            name: 'unique_id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            description: 'ID único del envío',
                            example: '1634567890123',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Información del envío encontrada',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'number', example: 1 },
                                                    unique_id: { type: 'string', example: '1634567890123' },
                                                    user_id: { type: 'number', example: 2 },
                                                    reference: { type: 'string', example: 'REF-001' },
                                                    address: { type: 'string', example: 'Calle 123, Ciudad' },
                                                    state: { type: 'number', example: 2 },
                                                    create_datetime: { type: 'string', example: '2024-01-15 10:30:00' },
                                                    transit_datetime: {
                                                        type: 'string',
                                                        example: '2024-01-15 14:30:00',
                                                    },
                                                    deliver_datetime: { type: 'string', nullable: true, example: null },
                                                },
                                            },
                                            message: { type: 'string', example: 'tracking-found' },
                                        },
                                    },
                                    examples: {
                                        'Envío en tránsito': {
                                            description: 'Envío que está siendo transportado',
                                            value: {
                                                code: 200,
                                                data: {
                                                    id: 1,
                                                    unique_id: '1634567890123',
                                                    user_id: 2,
                                                    reference: 'REF-001',
                                                    address: 'Calle 123, Ciudad',
                                                    state: 2,
                                                    create_datetime: '2024-01-15 10:30:00',
                                                    transit_datetime: '2024-01-15 14:30:00',
                                                    deliver_datetime: null,
                                                },
                                                message: 'tracking-found',
                                            },
                                        },
                                        'Envío entregado': {
                                            description: 'Envío completamente entregado',
                                            value: {
                                                code: 200,
                                                data: {
                                                    id: 2,
                                                    unique_id: '1634567890124',
                                                    user_id: 2,
                                                    reference: 'REF-002',
                                                    address: 'Avenida 456, Ciudad',
                                                    state: 3,
                                                    create_datetime: '2024-01-14 09:00:00',
                                                    transit_datetime: '2024-01-14 13:00:00',
                                                    deliver_datetime: '2024-01-15 11:30:00',
                                                },
                                                message: 'tracking-found',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        404: {
                            description: 'Envío no encontrado',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 404 },
                                            message: { type: 'string', example: 'tracking-not-found' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // ENVÍOS
            '/sends/getSendsFiltered': {
                post: {
                    description: 'Obtiene una lista filtrada y paginada de envíos según criterios específicos',
                    tags: ['Envíos'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        state: {
                                            type: 'number',
                                            enum: [1, 2, 3, 4],
                                            description:
                                                'Estado del envío (1=En espera, 2=En tránsito, 3=Entregado, 4=Cancelado)',
                                        },
                                        user_id: {
                                            type: 'number',
                                            description: 'ID del usuario (solo admin puede filtrar por otros usuarios)',
                                        },
                                        page: {
                                            type: 'number',
                                            minimum: 1,
                                            default: 1,
                                            description: 'Número de página',
                                        },
                                        limit: {
                                            type: 'number',
                                            minimum: 1,
                                            maximum: 100,
                                            default: 20,
                                            description: 'Cantidad de envíos por página',
                                        },
                                    },
                                },
                                examples: {
                                    'Filtrar por estado en tránsito': {
                                        description: 'Obtener envíos que están en tránsito',
                                        value: {
                                            state: 2,
                                            page: 1,
                                            limit: 20,
                                        },
                                    },
                                    'Filtrar por usuario específico (admin)': {
                                        description: 'Admin filtrando envíos de un usuario específico',
                                        value: {
                                            user_id: 2,
                                            page: 1,
                                            limit: 10,
                                        },
                                    },
                                    'Todos los envíos entregados': {
                                        description: 'Obtener todos los envíos entregados',
                                        value: {
                                            state: 3,
                                            page: 1,
                                            limit: 50,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Lista de envíos obtenida exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'number', example: 1 },
                                                        unique_id: { type: 'string', example: '1634567890123' },
                                                        user_id: { type: 'number', example: 2 },
                                                        reference: { type: 'string', example: 'REF-001' },
                                                        address: { type: 'string', example: 'Calle 123, Ciudad' },
                                                        state: { type: 'number', example: 2 },
                                                        create_datetime: {
                                                            type: 'string',
                                                            example: '2024-01-15 10:30:00',
                                                        },
                                                        width: { type: 'number', example: 10.5 },
                                                        height: { type: 'number', example: 15.0 },
                                                        length: { type: 'number', example: 20.0 },
                                                    },
                                                },
                                            },
                                            pagination: {
                                                type: 'object',
                                                properties: {
                                                    page: { type: 'number', example: 1 },
                                                    limit: { type: 'number', example: 20 },
                                                    total: { type: 'number', example: 45 },
                                                    totalPages: { type: 'number', example: 3 },
                                                },
                                            },
                                            message: { type: 'string', example: 'sends-filtered' },
                                        },
                                    },
                                    examples: {
                                        'Envíos en tránsito': {
                                            description: 'Lista de envíos que están siendo transportados',
                                            value: {
                                                code: 200,
                                                data: [
                                                    {
                                                        id: 1,
                                                        unique_id: '1634567890123',
                                                        user_id: 2,
                                                        reference: 'REF-001',
                                                        address: 'Calle 123, Ciudad',
                                                        state: 2,
                                                        create_datetime: '2024-01-15 10:30:00',
                                                        width: 10.5,
                                                        height: 15.0,
                                                        length: 20.0,
                                                    },
                                                ],
                                                pagination: {
                                                    page: 1,
                                                    limit: 20,
                                                    total: 12,
                                                    totalPages: 1,
                                                },
                                                message: 'sends-filtered',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description: 'Token de autenticación requerido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 401 },
                                            text: { type: 'string', example: 'invalid-token' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/sends/create': {
                post: {
                    description:
                        'Crea un nuevo envío en estado "En espera". El envío se crea solo con datos básicos (referencia, dirección, dimensiones). Los conductores y rutas se asignan posteriormente usando el endpoint de actualización.',
                    tags: ['Envíos'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['reference', 'address', 'width', 'height', 'length'],
                                    properties: {
                                        reference: {
                                            type: 'string',
                                            description: 'Referencia del envío',
                                        },
                                        address: {
                                            type: 'string',
                                            description: 'Dirección de entrega',
                                        },
                                        width: {
                                            type: 'number',
                                            minimum: 0.1,
                                            description: 'Ancho en centímetros',
                                        },
                                        height: {
                                            type: 'number',
                                            minimum: 0.1,
                                            description: 'Alto en centímetros',
                                        },
                                        length: {
                                            type: 'number',
                                            minimum: 0.1,
                                            description: 'Largo en centímetros',
                                        },
                                    },
                                },
                                examples: {
                                    'Envío básico': {
                                        description:
                                            'Crear envío básico en estado "En espera" (solo datos básicos, sin conductor ni ruta)',
                                        value: {
                                            reference: 'REF-001',
                                            address: 'Calle 123, Ciudad, País',
                                            width: 10.5,
                                            height: 15.0,
                                            length: 20.0,
                                        },
                                    },
                                    'Envío con dimensiones grandes': {
                                        description: 'Crear envío con dimensiones más grandes',
                                        value: {
                                            reference: 'REF-002',
                                            address: 'Avenida 456, Ciudad, País',
                                            width: 25.0,
                                            height: 30.0,
                                            length: 40.0,
                                        },
                                    },
                                    'Envío con referencia detallada': {
                                        description: 'Crear envío con referencia más descriptiva',
                                        value: {
                                            reference: 'ORD-2024-001-ELECTRODOMESTICOS',
                                            address: 'Carrera 15 #85-23, Bogotá, Colombia',
                                            width: 60.0,
                                            height: 80.0,
                                            length: 120.0,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Envío creado exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            text: { type: 'string', example: 'send-created' },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: 'Error de validación o reglas de negocio',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number' },
                                            text: { type: 'string' },
                                            data: { type: 'object' },
                                        },
                                    },
                                    examples: {
                                        'Error de validación': {
                                            description: 'Datos de entrada inválidos',
                                            value: {
                                                code: 400,
                                                text: 'Validation error: reference is required',
                                            },
                                        },
                                        'Conductor no disponible': {
                                            description: 'El conductor ya tiene envíos activos',
                                            value: {
                                                code: 400,
                                                text: 'driver-not-available',
                                                data: {
                                                    driverName: 'Carlos Conductor',
                                                    conflictingSendId: '1634567890123',
                                                },
                                            },
                                        },
                                        'Capacidad del vehículo excedida': {
                                            description: 'El envío excede la capacidad del vehículo',
                                            value: {
                                                code: 400,
                                                text: 'vehicle-capacity-exceeded',
                                                data: {
                                                    vehicleCapacity: 100,
                                                    sendUnits: 1,
                                                    vehicleBrand: 'Toyota',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/sends/update/{id}': {
                put: {
                    description:
                        'Actualiza un envío existente. Permite asignar conductor/ruta (cambia automáticamente a "En tránsito") o cambiar estado. La dirección y dimensiones NO se pueden modificar después de la creación.',
                    tags: ['Envíos'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' },
                            description: 'ID del envío a actualizar',
                            example: 1,
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        route_id: {
                                            type: 'number',
                                            nullable: true,
                                            description: 'ID de la ruta a asignar',
                                        },
                                        driver_id: {
                                            type: 'number',
                                            nullable: true,
                                            description: 'ID del conductor a asignar',
                                        },
                                        state: {
                                            type: 'number',
                                            enum: [1, 2, 3, 4],
                                            description:
                                                'Estado del envío (1=En espera, 2=En tránsito, 3=Entregado, 4=Cancelado)',
                                        },
                                    },
                                },
                                examples: {
                                    'Asignar conductor y ruta': {
                                        description:
                                            'Asignar conductor y ruta a un envío (cambia automáticamente a "En tránsito")',
                                        value: {
                                            driver_id: 1,
                                            route_id: 1,
                                        },
                                    },
                                    'Marcar como entregado': {
                                        description: 'Finalizar envío como entregado (solo cambio de estado)',
                                        value: {
                                            state: 3,
                                        },
                                    },
                                    'Cancelar envío': {
                                        description: 'Cancelar un envío cambiando su estado',
                                        value: {
                                            state: 4,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Envío actualizado exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            text: { type: 'string', example: 'send-updated' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'number', example: 1 },
                                                    unique_id: { type: 'string', example: '1634567890123' },
                                                    user_id: { type: 'number', example: 2 },
                                                    reference: { type: 'string', example: 'REF-001-UPDATED' },
                                                    address: {
                                                        type: 'string',
                                                        example: 'Nueva Dirección 123, Ciudad Actualizada',
                                                    },
                                                    width: { type: 'number', example: 12.0 },
                                                    height: { type: 'number', example: 18.0 },
                                                    length: { type: 'number', example: 25.0 },
                                                    state: { type: 'number', example: 2 },
                                                    route_id: { type: 'number', example: 1 },
                                                    driver_id: { type: 'number', example: 1 },
                                                    create_datetime: { type: 'string', example: '2024-01-15 10:30:00' },
                                                    transit_datetime: {
                                                        type: 'string',
                                                        example: '2024-01-15 14:30:00',
                                                    },
                                                    deliver_datetime: { type: 'string', nullable: true, example: null },
                                                },
                                            },
                                        },
                                    },
                                    examples: {
                                        'Envío actualizado a en tránsito': {
                                            description:
                                                'Respuesta completa cuando el envío se actualiza con todos los datos',
                                            value: {
                                                code: 200,
                                                text: 'send-updated',
                                                data: {
                                                    id: 1,
                                                    unique_id: '1634567890123',
                                                    user_id: 2,
                                                    reference: 'REF-001-UPDATED',
                                                    address: 'Nueva Dirección 123, Ciudad Actualizada',
                                                    width: 12.0,
                                                    height: 18.0,
                                                    length: 25.0,
                                                    state: 2,
                                                    route_id: 1,
                                                    driver_id: 1,
                                                    create_datetime: '2024-01-15 10:30:00',
                                                    transit_datetime: '2024-01-15 14:30:00',
                                                    deliver_datetime: null,
                                                },
                                            },
                                        },
                                        'Envío marcado como entregado': {
                                            description: 'Respuesta cuando solo se cambia el estado a entregado',
                                            value: {
                                                code: 200,
                                                text: 'send-updated',
                                                data: {
                                                    id: 1,
                                                    unique_id: '1634567890123',
                                                    user_id: 2,
                                                    reference: 'REF-001',
                                                    address: 'Calle 123, Ciudad',
                                                    width: 10.5,
                                                    height: 15.0,
                                                    length: 20.0,
                                                    state: 3,
                                                    route_id: 1,
                                                    driver_id: 1,
                                                    create_datetime: '2024-01-15 10:30:00',
                                                    transit_datetime: '2024-01-15 14:30:00',
                                                    deliver_datetime: '2024-01-15 16:45:00',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        403: {
                            description: 'Permisos insuficientes',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 403 },
                                            text: { type: 'string', example: 'insufficient-permissions' },
                                        },
                                    },
                                },
                            },
                        },
                        404: {
                            description: 'Envío no encontrado',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 404 },
                                            text: { type: 'string', example: 'send-not-found' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // NOTIFICACIONES
            '/notifications/broadcast': {
                post: {
                    description: 'Envía una notificación a todos los usuarios conectados mediante Socket.IO',
                    tags: ['Notificaciones'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['message'],
                                    properties: {
                                        message: {
                                            type: 'string',
                                            description: 'Mensaje de la notificación',
                                        },
                                        type: {
                                            type: 'string',
                                            enum: ['info', 'success', 'warning', 'error'],
                                            default: 'info',
                                            description: 'Tipo de notificación',
                                        },
                                    },
                                },
                                examples: {
                                    'Notificación informativa': {
                                        description: 'Mensaje general para todos los usuarios',
                                        value: {
                                            message: 'El sistema estará en mantenimiento a las 2:00 AM',
                                            type: 'info',
                                        },
                                    },
                                    'Notificación de éxito': {
                                        description: 'Mensaje de operación exitosa',
                                        value: {
                                            message: 'Actualización del sistema completada exitosamente',
                                            type: 'success',
                                        },
                                    },
                                    'Alerta importante': {
                                        description: 'Mensaje de advertencia crítica',
                                        value: {
                                            message: 'Se detectó actividad inusual en el sistema',
                                            type: 'warning',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Notificación enviada exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            text: { type: 'string', example: 'notification-sent' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    message: { type: 'string' },
                                                    type: { type: 'string' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: 'Mensaje requerido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 400 },
                                            text: { type: 'string', example: 'message-required' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/notifications/private': {
                post: {
                    description: 'Envía un mensaje privado a un usuario específico por email',
                    tags: ['Notificaciones'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'message'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email',
                                            description: 'Email del usuario destinatario',
                                        },
                                        message: {
                                            type: 'string',
                                            description: 'Mensaje privado',
                                        },
                                        type: {
                                            type: 'string',
                                            enum: ['info', 'success', 'warning', 'error'],
                                            default: 'info',
                                            description: 'Tipo de notificación',
                                        },
                                    },
                                },
                                examples: {
                                    'Mensaje privado a admin': {
                                        description: 'Notificación específica para administrador',
                                        value: {
                                            email: 'a@mail.com',
                                            message: 'Tu reporte mensual está listo para revisión',
                                            type: 'info',
                                        },
                                    },
                                    'Alerta privada': {
                                        description: 'Mensaje de alerta para usuario específico',
                                        value: {
                                            email: 'afd@mail.com',
                                            message: 'Tu envío REF-001 ha sido entregado exitosamente',
                                            type: 'success',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Mensaje privado procesado',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            text: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    email: { type: 'string' },
                                                    message: { type: 'string' },
                                                    delivered: { type: 'boolean' },
                                                },
                                            },
                                        },
                                    },
                                    examples: {
                                        'Usuario conectado': {
                                            description: 'Mensaje entregado exitosamente',
                                            value: {
                                                code: 200,
                                                text: 'private-message-sent',
                                                data: {
                                                    email: 'a@mail.com',
                                                    message: 'Tu reporte mensual está listo',
                                                    delivered: true,
                                                },
                                            },
                                        },
                                        'Usuario desconectado': {
                                            description: 'Usuario no está en línea',
                                            value: {
                                                code: 200,
                                                text: 'user-not-connected',
                                                data: {
                                                    email: 'usuario@mail.com',
                                                    message: 'Mensaje de prueba',
                                                    delivered: false,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: {
                            description: 'Email y mensaje requeridos',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 400 },
                                            text: { type: 'string', example: 'email-and-message-required' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/notifications/connected-users': {
                get: {
                    description: 'Obtiene la lista de usuarios actualmente conectados via Socket.IO',
                    tags: ['Notificaciones'],
                    responses: {
                        200: {
                            description: 'Lista de usuarios conectados',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            text: { type: 'string', example: 'connected-users-retrieved' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    count: { type: 'number', example: 3 },
                                                    users: {
                                                        type: 'array',
                                                        items: { type: 'string' },
                                                        example: ['a@mail.com', 'afd@mail.com', 'user3@mail.com'],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    examples: {
                                        'Usuarios en línea': {
                                            description: 'Lista de usuarios actualmente conectados',
                                            value: {
                                                code: 200,
                                                text: 'connected-users-retrieved',
                                                data: {
                                                    count: 3,
                                                    users: ['a@mail.com', 'afd@mail.com', 'user3@mail.com'],
                                                },
                                            },
                                        },
                                        'Sin usuarios conectados': {
                                            description: 'No hay usuarios en línea',
                                            value: {
                                                code: 200,
                                                text: 'connected-users-retrieved',
                                                data: {
                                                    count: 0,
                                                    users: [],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/home/tracking': {
                get: {
                    description:
                        'Obtiene lista de envíos para usuarios autenticados. Los administradores ven todos los envíos, los usuarios normales solo los suyos.',
                    tags: ['Tracking'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Lista de envíos obtenida exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'number', example: 1 },
                                                        unique_id: { type: 'string', example: '1634567890123' },
                                                        user_id: { type: 'number', example: 2 },
                                                        reference: { type: 'string', example: 'REF-001' },
                                                        address: { type: 'string', example: 'Calle 123, Ciudad' },
                                                        state: { type: 'number', example: 2 },
                                                        create_datetime: {
                                                            type: 'string',
                                                            example: '2024-01-15 10:30:00',
                                                        },
                                                        transit_datetime: {
                                                            type: 'string',
                                                            nullable: true,
                                                            example: '2024-01-15 14:30:00',
                                                        },
                                                        deliver_datetime: {
                                                            type: 'string',
                                                            nullable: true,
                                                            example: null,
                                                        },
                                                        width: { type: 'number', example: 10.5 },
                                                        height: { type: 'number', example: 15.0 },
                                                        length: { type: 'number', example: 20.0 },
                                                    },
                                                },
                                            },
                                            message: { type: 'string', example: 'tracking-list-retrieved' },
                                        },
                                    },
                                    examples: {
                                        'Lista para administrador': {
                                            description: 'Administrador ve todos los envíos del sistema',
                                            value: {
                                                code: 200,
                                                data: [
                                                    {
                                                        id: 1,
                                                        unique_id: '1634567890123',
                                                        user_id: 2,
                                                        reference: 'REF-001',
                                                        address: 'Calle 123, Ciudad',
                                                        state: 2,
                                                        create_datetime: '2024-01-15 10:30:00',
                                                        transit_datetime: '2024-01-15 14:30:00',
                                                        deliver_datetime: null,
                                                        width: 10.5,
                                                        height: 15.0,
                                                        length: 20.0,
                                                    },
                                                    {
                                                        id: 2,
                                                        unique_id: '1634567890124',
                                                        user_id: 3,
                                                        reference: 'REF-002',
                                                        address: 'Avenida 456, Ciudad',
                                                        state: 3,
                                                        create_datetime: '2024-01-14 09:00:00',
                                                        transit_datetime: '2024-01-14 13:00:00',
                                                        deliver_datetime: '2024-01-15 11:30:00',
                                                        width: 25.0,
                                                        height: 30.0,
                                                        length: 40.0,
                                                    },
                                                ],
                                                message: 'tracking-list-retrieved',
                                            },
                                        },
                                        'Lista para usuario normal': {
                                            description: 'Usuario normal solo ve sus propios envíos',
                                            value: {
                                                code: 200,
                                                data: [
                                                    {
                                                        id: 1,
                                                        unique_id: '1634567890123',
                                                        user_id: 2,
                                                        reference: 'REF-001',
                                                        address: 'Calle 123, Ciudad',
                                                        state: 2,
                                                        create_datetime: '2024-01-15 10:30:00',
                                                        transit_datetime: '2024-01-15 14:30:00',
                                                        deliver_datetime: null,
                                                        width: 10.5,
                                                        height: 15.0,
                                                        length: 20.0,
                                                    },
                                                ],
                                                message: 'tracking-list-retrieved',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description: 'Token de autenticación requerido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 401 },
                                            message: { type: 'string', example: 'authentication-required-for-list' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // DASHBOARD - GRÁFICAS
            '/home/charts-data': {
                get: {
                    description:
                        'Obtiene datos para gráficas del dashboard con métricas de envíos por estado y período configurable',
                    tags: ['Dashboard'],
                    parameters: [
                        {
                            name: 'Authorization',
                            in: 'header',
                            required: true,
                            schema: { type: 'string' },
                            example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        {
                            name: 'period',
                            in: 'query',
                            schema: { type: 'integer', enum: [7, 15, 30], default: 7 },
                            description: 'Número de días para el rango de datos',
                        },
                        {
                            name: 'user_id',
                            in: 'query',
                            schema: { type: 'integer' },
                            description: 'ID de usuario específico para filtrar datos (solo administradores)',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Datos de gráficas obtenidos exitosamente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 200 },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    chartData: {
                                                        type: 'object',
                                                        properties: {
                                                            labels: {
                                                                type: 'array',
                                                                items: { type: 'string' },
                                                                example: ['2024-01-15', '2024-01-16', '2024-01-17'],
                                                            },
                                                            datasets: {
                                                                type: 'array',
                                                                items: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        label: { type: 'string' },
                                                                        data: {
                                                                            type: 'array',
                                                                            items: { type: 'number' },
                                                                        },
                                                                        borderColor: { type: 'string' },
                                                                        backgroundColor: { type: 'string' },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    stats: {
                                                        type: 'object',
                                                        properties: {
                                                            created: { type: 'number', example: 25 },
                                                            inTransit: { type: 'number', example: 12 },
                                                            delivered: { type: 'number', example: 8 },
                                                            cancelled: { type: 'number', example: 2 },
                                                            total: { type: 'number', example: 47 },
                                                        },
                                                    },
                                                },
                                            },
                                            message: { type: 'string', example: 'charts-data-retrieved' },
                                        },
                                    },
                                    examples: {
                                        'Datos 7 días - Admin': {
                                            description: 'Datos de gráficas para administrador (7 días)',
                                            value: {
                                                code: 200,
                                                data: {
                                                    chartData: {
                                                        labels: [
                                                            '2024-01-15',
                                                            '2024-01-16',
                                                            '2024-01-17',
                                                            '2024-01-18',
                                                            '2024-01-19',
                                                            '2024-01-20',
                                                            '2024-01-21',
                                                        ],
                                                        datasets: [
                                                            {
                                                                label: 'Creados',
                                                                data: [5, 8, 3, 7, 6, 4, 9],
                                                                borderColor: '#007bff',
                                                                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                                            },
                                                            {
                                                                label: 'En Tránsito',
                                                                data: [2, 4, 1, 3, 5, 2, 4],
                                                                borderColor: '#ffc107',
                                                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                                            },
                                                        ],
                                                    },
                                                    stats: {
                                                        created: 42,
                                                        inTransit: 21,
                                                        delivered: 15,
                                                        cancelled: 3,
                                                        total: 81,
                                                    },
                                                },
                                                message: 'charts-data-retrieved',
                                            },
                                        },
                                        'Datos filtrados por usuario': {
                                            description: 'Datos de gráficas filtrados para un usuario específico',
                                            value: {
                                                code: 200,
                                                data: {
                                                    chartData: {
                                                        labels: [
                                                            '2024-01-15',
                                                            '2024-01-16',
                                                            '2024-01-17',
                                                            '2024-01-18',
                                                            '2024-01-19',
                                                            '2024-01-20',
                                                            '2024-01-21',
                                                        ],
                                                        datasets: [
                                                            {
                                                                label: 'Creados',
                                                                data: [2, 3, 1, 2, 1, 0, 3],
                                                                borderColor: '#007bff',
                                                                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                                            },
                                                        ],
                                                    },
                                                    stats: {
                                                        created: 12,
                                                        inTransit: 5,
                                                        delivered: 3,
                                                        cancelled: 1,
                                                        total: 21,
                                                    },
                                                },
                                                message: 'charts-data-retrieved',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: {
                            description: 'Token de autenticación requerido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'number', example: 401 },
                                            message: { type: 'string', example: 'invalid-token' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT obtenido del endpoint /login/login',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Autenticación',
                description: 'Endpoints para login y registro de usuarios',
            },
            {
                name: 'Dashboard',
                description: 'Endpoints para datos del dashboard y gráficas',
            },
            {
                name: 'Envíos',
                description: 'Gestión completa de envíos (CRUD)',
            },
            {
                name: 'Tracking',
                description: 'Endpoints para rastreo público y privado',
            },
            {
                name: 'Conductores',
                description: 'Gestión de conductores (solo administradores)',
            },
            {
                name: 'Usuarios',
                description: 'Gestión de usuarios del sistema',
            },
            {
                name: 'Notificaciones',
                description: 'Sistema de notificaciones en tiempo real',
            },
        ],
    },
};
