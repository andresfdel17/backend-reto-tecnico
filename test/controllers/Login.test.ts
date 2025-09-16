import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';
import mysql from 'mysql2';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import después de los mocks
import '../setup';
import { mockUsers, createMockDbResult, createMockInsertResult } from '../helpers/testHelpers';

// Mock de dependencias ANTES de importar el controlador
const mockExecute = jest.fn() as any;
const mockPool = {
    execute: mockExecute,
    query: jest.fn(),
    end: jest.fn(),
    release: jest.fn(),
    destroy: jest.fn(),
    getConnection: jest.fn(),
};

(mysql.createPool as any).mockReturnValue(mockPool);

// Mock del socketManager SIN importar app.ts
const mockSocketManager = {
    emitToAll: jest.fn(),
    emitToUser: jest.fn(),
};

// Mock completo de app.ts para evitar que se inicie el servidor
jest.mock('../../src/app', () => ({
    socketManager: mockSocketManager,
    default: undefined, // Evitar export default
}));

// Mock de rate limiting específico para este test
jest.mock('../../src/middlewares/RateLimit', () => ({
    authRateLimit: (_req: any, _res: any, next: any) => next(),
}));

// Mock de la base de datos
jest.mock('../../src/database', () => ({
    db: {
        execute: mockExecute,
        query: jest.fn(),
        end: jest.fn(),
    },
}));

// Ahora sí importar el controlador
import { Login as LoginController } from '../../src/controllers/Login';

// Setup de la app de test
const app = express();
app.use(express.json());
app.use('/api/login', LoginController);

describe('Login Controller - Isolated Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        (jwt.sign as any).mockReturnValue('mock-jwt-token');
        (jwt.verify as any).mockReturnValue({ userId: 1, email: 'a@mail.com' });
        (bcryptjs.hash as any).mockResolvedValue('hashed-password');
        (bcryptjs.compare as any).mockResolvedValue(true);
    });

    describe('GET /', () => {
        it('debería retornar mensaje de que el controlador está listo', async () => {
            const response = await request(app).get('/api/login/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('message', 'Login controller Ready!');
        }, 5000); // Timeout específico
    });

    describe('POST /login', () => {
        it('debería hacer login exitoso con credenciales válidas', async () => {
            // Arrange
            const loginData = {
                email: 'a@mail.com',
                password: '123456',
            };

            // Mock user con rol_name incluido (como en el query real)
            const mockUserWithRole = { ...mockUsers[0], rol_name: 'admin' };
            mockExecute.mockResolvedValueOnce(createMockDbResult([mockUserWithRole]) as any);
            (bcryptjs.compare as any).mockResolvedValueOnce(true);

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('text', 'session-started');
            expect(response.body.user.email).toBe(loginData.email);
            expect(response.body.user).not.toHaveProperty('password');
        }, 5000);

        it('debería fallar con email inexistente', async () => {
            // Arrange
            const loginData = {
                email: 'noexiste@mail.com',
                password: '123456',
            };

            mockExecute.mockResolvedValueOnce(createMockDbResult([]) as any);

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 401);
            expect(response.body).toHaveProperty('text', 'user-pass-unk');
        }, 5000);

        it('debería fallar con contraseña incorrecta', async () => {
            // Arrange
            const loginData = {
                email: 'a@mail.com',
                password: 'wrongpassword',
            };

            const mockUserWithRole = { ...mockUsers[0], rol_name: 'admin' };
            mockExecute.mockResolvedValueOnce(createMockDbResult([mockUserWithRole]) as any);
            (bcryptjs.compare as any).mockResolvedValueOnce(false);

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 400);
            expect(response.body).toHaveProperty('text', 'user-pass-unk');
        }, 5000);

        it('debería fallar cuando falta email', async () => {
            // Arrange
            const loginData = {
                password: '123456',
            };

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"email" is required',
            });
        }, 5000);

        it('debería fallar cuando falta contraseña', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
            };

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"password" is required',
            });
        }, 5000);

        it('debería fallar con email inválido', async () => {
            // Arrange
            const loginData = {
                email: 'invalid-email',
                password: '123456',
            };

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"email" must be a valid email',
            });
        }, 5000);

        it('debería fallar con contraseña muy corta', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: '123', // Menos de 6 caracteres
            };

            // Act
            const response = await request(app).post('/api/login/login').send(loginData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"password" length must be at least 6 characters long',
            });
        }, 5000);
    });

    describe('POST /register', () => {
        it('debería registrar un usuario exitosamente', async () => {
            // Arrange
            const registerData = {
                name: 'Nuevo Usuario',
                email: 'nuevo@mail.com',
                password: 'password123',
            };

            mockExecute
                .mockResolvedValueOnce(createMockDbResult([]) as any) // Usuario no existe
                .mockResolvedValueOnce(createMockInsertResult(3, 1) as any); // INSERT exitoso

            (bcryptjs.hash as any).mockResolvedValueOnce('hashed-password123');

            // Act
            const response = await request(app).post('/api/login/register').send(registerData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 201);
            expect(response.body).toHaveProperty('text', 'user-created');

            // Verificar que se emitió la notificación socket
            expect(mockSocketManager.emitToAll).toHaveBeenCalledWith(
                'user-registered',
                expect.objectContaining({
                    message: 'new-user-registered',
                    userEmail: registerData.email,
                    userName: registerData.name,
                    timestamp: expect.any(String),
                }),
            );
        }, 5000);

        it('debería fallar si el usuario ya existe', async () => {
            // Arrange
            const registerData = {
                name: 'Usuario Existente',
                email: 'a@mail.com', // Email que ya existe
                password: 'password123',
            };

            mockExecute.mockResolvedValueOnce(createMockDbResult([{ user_exists: 1 }]) as any);

            // Act
            const response = await request(app).post('/api/login/register').send(registerData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 400);
            expect(response.body).toHaveProperty('text', 'user-exists');
        }, 5000);

        it('debería fallar cuando falta nombre en register', async () => {
            // Arrange
            const registerData = {
                email: 'test@example.com',
                password: 'password123',
            };

            // Act
            const response = await request(app).post('/api/login/register').send(registerData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"name" is required',
            });
        }, 5000);

        it('debería fallar cuando falta email en register', async () => {
            // Arrange
            const registerData = {
                name: 'Test User',
                password: 'password123',
            };

            // Act
            const response = await request(app).post('/api/login/register').send(registerData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"email" is required',
            });
        }, 5000);

        it('debería fallar con contraseña muy corta en register', async () => {
            // Arrange
            const registerData = {
                name: 'Test User',
                email: 'test@example.com',
                password: '123', // Menos de 8 caracteres
            };

            // Act
            const response = await request(app).post('/api/login/register').send(registerData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"password" length must be at least 8 characters long',
            });
        }, 5000);

        it('debería fallar con email inválido en register', async () => {
            // Arrange
            const registerData = {
                name: 'Test User',
                email: 'invalid-email',
                password: 'password123',
            };

            // Act
            const response = await request(app).post('/api/login/register').send(registerData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"email" must be a valid email',
            });
        }, 5000);
    });
});
