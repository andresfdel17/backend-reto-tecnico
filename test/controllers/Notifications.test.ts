import request from 'supertest';
import express from 'express';

// Mock del socketManager ANTES de importar
jest.mock('../../src/app', () => ({
    socketManager: {
        emitToAll: jest.fn(),
        emitToUser: jest.fn(),
        getConnectedUsers: jest.fn(),
        isUserConnected: jest.fn(),
    }
}));

import { Notifications } from '../../src/controllers/Notifications';
import { socketManager } from '../../src/app';

describe('Notifications Controller - Unit Tests', () => {
    let app: express.Application;
    const mockSocketManager = socketManager as jest.Mocked<typeof socketManager>;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/notifications', Notifications);
    });

    beforeEach(() => {
        // Reset mocks antes de cada test
        jest.clearAllMocks();
    });

    describe('Controller Setup', () => {
        it('debería tener el controlador configurado correctamente', () => {
            // Assert - Verificar que el controlador existe
            expect(Notifications).toBeDefined();
            expect(typeof Notifications).toBe('function');
        });
    });

    describe('POST /broadcast', () => {
        it('debería enviar notificación broadcast exitosamente', async () => {
            // Arrange
            const notificationData = {
                message: 'Test broadcast message',
                type: 'info'
            };

            // Act
            const response = await request(app)
                .post('/api/notifications/broadcast')
                .send(notificationData)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'notification-sent',
                data: { message: 'Test broadcast message', type: 'info' }
            });

            expect(mockSocketManager.emitToAll).toHaveBeenCalledWith('notification', {
                message: 'Test broadcast message',
                type: 'info',
                timestamp: expect.any(String),
                from: 'system'
            });
        });

        it('debería usar tipo "info" por defecto', async () => {
            // Arrange
            const notificationData = {
                message: 'Test message without type'
            };

            // Act
            const response = await request(app)
                .post('/api/notifications/broadcast')
                .send(notificationData)
                .expect(200);

            // Assert
            expect(response.body.data.type).toBe('info');
            expect(mockSocketManager.emitToAll).toHaveBeenCalledWith('notification', {
                message: 'Test message without type',
                type: 'info',
                timestamp: expect.any(String),
                from: 'system'
            });
        });

        it('debería fallar cuando no se proporciona mensaje', async () => {
            // Arrange
            const notificationData = {
                type: 'warning'
            };

            // Act
            const response = await request(app)
                .post('/api/notifications/broadcast')
                .send(notificationData)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 400,
                text: 'message-required'
            });

            expect(mockSocketManager.emitToAll).not.toHaveBeenCalled();
        });
    });

    describe('POST /private', () => {
        it('debería enviar mensaje privado exitosamente cuando el usuario está conectado', async () => {
            // Arrange
            mockSocketManager.emitToUser.mockReturnValue(true);
            const privateData = {
                email: 'test@example.com',
                message: 'Private test message',
                type: 'success'
            };

            // Act
            const response = await request(app)
                .post('/api/notifications/private')
                .send(privateData)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'private-message-sent',
                data: { email: 'test@example.com', message: 'Private test message', delivered: true }
            });

            expect(mockSocketManager.emitToUser).toHaveBeenCalledWith('test@example.com', 'private-notification', {
                message: 'Private test message',
                type: 'success',
                timestamp: expect.any(String),
                from: 'system'
            });
        });

        it('debería manejar cuando el usuario no está conectado', async () => {
            // Arrange
            mockSocketManager.emitToUser.mockReturnValue(false);
            const privateData = {
                email: 'offline@example.com',
                message: 'Message for offline user'
            };

            // Act
            const response = await request(app)
                .post('/api/notifications/private')
                .send(privateData)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'user-not-connected',
                data: { email: 'offline@example.com', message: 'Message for offline user', delivered: false }
            });
        });

        it('debería fallar cuando faltan email o mensaje', async () => {
            // Test sin email
            const response1 = await request(app)
                .post('/api/notifications/private')
                .send({ message: 'Test message' })
                .expect(200);

            expect(response1.body).toEqual({
                code: 400,
                text: 'email-and-message-required'
            });

            // Test sin mensaje
            const response2 = await request(app)
                .post('/api/notifications/private')
                .send({ email: 'test@example.com' })
                .expect(200);

            expect(response2.body).toEqual({
                code: 400,
                text: 'email-and-message-required'
            });

            expect(mockSocketManager.emitToUser).not.toHaveBeenCalled();
        });
    });

    describe('POST /system-status', () => {
        it('debería enviar actualización de estado del sistema', async () => {
            // Arrange
            const statusData = {
                status: 'maintenance',
                details: 'System will be down for 30 minutes'
            };

            // Act
            const response = await request(app)
                .post('/api/notifications/system-status')
                .send(statusData)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'system-status-broadcasted',
                data: { status: 'maintenance', details: 'System will be down for 30 minutes' }
            });

            expect(mockSocketManager.emitToAll).toHaveBeenCalledWith('system-status-update', {
                message: 'system-status-changed',
                status: 'maintenance',
                details: 'System will be down for 30 minutes',
                timestamp: expect.any(String)
            });
        });
    });

    describe('GET /connected-users', () => {
        it('debería retornar lista de usuarios conectados', async () => {
            // Arrange
            const mockUsers = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
            mockSocketManager.getConnectedUsers.mockReturnValue(mockUsers);

            // Act
            const response = await request(app)
                .get('/api/notifications/connected-users')
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'connected-users-retrieved',
                data: {
                    count: 3,
                    users: mockUsers
                }
            });

            expect(mockSocketManager.getConnectedUsers).toHaveBeenCalledTimes(1);
        });

        it('debería manejar lista vacía de usuarios', async () => {
            // Arrange
            mockSocketManager.getConnectedUsers.mockReturnValue([]);

            // Act
            const response = await request(app)
                .get('/api/notifications/connected-users')
                .expect(200);

            // Assert
            expect(response.body.data.count).toBe(0);
            expect(response.body.data.users).toEqual([]);
        });
    });

    describe('GET /user-status/:email', () => {
        it('debería retornar estado conectado para usuario online', async () => {
            // Arrange
            mockSocketManager.isUserConnected.mockReturnValue(true);

            // Act
            const response = await request(app)
                .get('/api/notifications/user-status/online@example.com')
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'user-status-retrieved',
                data: {
                    email: 'online@example.com',
                    connected: true
                }
            });

            expect(mockSocketManager.isUserConnected).toHaveBeenCalledWith('online@example.com');
        });

        it('debería retornar estado desconectado para usuario offline', async () => {
            // Arrange
            mockSocketManager.isUserConnected.mockReturnValue(false);

            // Act
            const response = await request(app)
                .get('/api/notifications/user-status/offline@example.com')
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                text: 'user-status-retrieved',
                data: {
                    email: 'offline@example.com',
                    connected: false
                }
            });
        });
    });
});
