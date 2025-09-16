// Setup global para tests
import { jest } from '@jest/globals';

// Mock de mysql2 antes de cualquier import
const mockExecute = jest.fn();
const mockQuery = jest.fn();

const mockPool = {
    execute: mockExecute,
    query: mockQuery,
    end: jest.fn(),
    release: jest.fn(),
    destroy: jest.fn(),
    getConnection: jest.fn(),
};

jest.mock('mysql2', () => ({
    createConnection: jest.fn(),
    createPool: jest.fn(() => mockPool),
}));

// Mock específico para la conexión de la base de datos
jest.mock('../src/database/connection', () => ({
    db: mockPool,
}));

// Exportar mocks para uso en tests
global.mockExecute = mockExecute;
global.mockQuery = mockQuery;

// Mock de socket.io
jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        sockets: {
            emit: jest.fn(),
        },
    })),
}));

// Mock de SocketManager class
jest.mock('../src/lib/Socket', () => ({
    SocketManager: jest.fn().mockImplementation(() => ({
        emitToAll: jest.fn(),
        emitToUser: jest.fn(),
        emitToRoom: jest.fn(),
        server: {},
        io: {
            emit: jest.fn(),
            to: jest.fn(() => ({ emit: jest.fn() })),
        },
    })),
}));

// Mock de app.ts para evitar que inicie el servidor
jest.mock('../src/app.ts', () => ({
    socketManager: {
        emitToAll: jest.fn(),
        emitToUser: jest.fn(),
        emitToRoom: jest.fn(),
    },
}));

// Mock específico para JWTManager
jest.mock('../src/lib/JWTManager', () => ({
    JWTManager: {
        createToken: jest.fn(() => 'mock-jwt-token'),
        decodeToken: jest.fn(() => ({
            data: {
                id: 1,
                email: 'a@mail.com',
                rol_id: 1,
                name: 'Admin User',
            },
            exp: Math.floor(Date.now() / 1000) + 3600, // Expira en 1 hora
            iss: 'test-app',
            sub: 'Login',
            aud: ['127.0.0.1'],
        })),
    },
}));

// Mock del rate limiting
jest.mock('express-rate-limit', () => {
    return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn(() => Promise.resolve('$2b$10$hashedpassword')),
    compare: jest.fn(() => Promise.resolve(true)),
    genSalt: jest.fn(() => Promise.resolve('$2b$10$')),
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(() => ({
        data: {
            id: 1,
            email: 'a@mail.com',
            rol_id: 1,
            name: 'Admin User',
        },
        exp: Math.floor(Date.now() / 1000) + 3600, // Expira en 1 hora
        iss: 'test-app',
        sub: 'Login',
        aud: ['127.0.0.1'],
    })),
    decode: jest.fn(() => ({
        data: {
            id: 1,
            email: 'a@mail.com',
            rol_id: 1,
            name: 'Admin User',
        },
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-app',
        sub: 'Login',
        aud: ['127.0.0.1'],
    })),
}));

// Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.PORT = '3001';

// Configurar timeout para tests
jest.setTimeout(10000);
