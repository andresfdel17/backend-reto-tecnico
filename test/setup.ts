// Setup global para tests
import { jest } from '@jest/globals';

// Mock de mysql2 antes de cualquier import
jest.mock('mysql2', () => ({
    createConnection: jest.fn(),
    createPool: jest.fn().mockReturnValue({
        execute: jest.fn(),
        query: jest.fn(),
        end: jest.fn(),
        release: jest.fn(),
        destroy: jest.fn(),
        getConnection: jest.fn(),
    }),
}));

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

// Mock del rate limiting
jest.mock('express-rate-limit', () => {
    return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
    genSalt: jest.fn(),
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
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
