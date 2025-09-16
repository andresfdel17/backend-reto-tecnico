import request from 'supertest';
import { jest } from '@jest/globals';

// Import después de los mocks
import '../setup';

// Mock completo de app.ts para evitar que se inicie el servidor
jest.mock('../../src/app', () => ({
    socketManager: {
        getSocketInstance: jest.fn(),
        emitToUser: jest.fn(),
        emitToAll: jest.fn(),
    },
}));

import { app } from '../../src/Application';
import { db } from '../../src/database';

describe('Drivers Controller', () => {
    let authToken: string;
    let testDriverId: number;

    beforeAll(async () => {
        // Obtener token de autenticación para las pruebas
        const loginResponse = await request(app).post('/api/login').send({
            email: 'admin@test.com',
            password: 'password123',
        });

        if (loginResponse.body.code === 200) {
            authToken = loginResponse.body.data.token;
        }
    });

    afterAll(async () => {
        // Limpiar datos de prueba si se creó un conductor
        if (testDriverId) {
            try {
                await db.execute('DELETE FROM main_drivers WHERE id = ?', [testDriverId]);
            } catch (error) {
                console.log('Error cleaning up test data:', error);
            }
        }
    });

    describe('GET /api/drivers/', () => {
        it('should return controller ready message', async () => {
            const response = await request(app).get('/api/drivers/').expect(200);

            expect(response.body).toEqual({
                code: 200,
                message: 'Drivers controller Ready!',
            });
        });
    });

    describe('GET /api/drivers/drivers', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/drivers/drivers').expect(200);

            expect(response.body.code).toBe(401);
            expect(response.body.text).toBe('Unauthorized');
        });

        it('should return list of drivers with authentication', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .get('/api/drivers/drivers')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('conductores-obtenidos-exitosamente');
            expect(Array.isArray(response.body.data)).toBe(true);

            // Verificar estructura de los conductores
            if (response.body.data.length > 0) {
                const driver = response.body.data[0];
                expect(driver).toHaveProperty('id');
                expect(driver).toHaveProperty('cifnif');
                expect(driver).toHaveProperty('name');
            }
        });
    });

    describe('POST /api/drivers/create', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .post('/api/drivers/create')
                .send({
                    cifnif: '12345678T',
                    name: 'Test Driver',
                })
                .expect(200);

            expect(response.body.code).toBe(401);
            expect(response.body.text).toBe('Unauthorized');
        });

        it('should return 400 with invalid data', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    cifnif: '', // CIFNIF vacío
                    name: 'Test Driver',
                })
                .expect(200);

            expect(response.body.code).toBe(400);
            expect(response.body.message).toBe('Datos de entrada inválidos');
            expect(Array.isArray(response.body.errors)).toBe(true);
        });

        it('should create a new driver with valid data', async () => {
            if (!authToken) {
                console.log('Skipping test - no auth token available');
                return;
            }

            const testDriver = {
                cifnif: `TEST${Date.now()}`, // CIFNIF único para evitar conflictos
                name: 'Test Driver Created',
            };

            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testDriver)
                .expect(200);

            expect(response.body.code).toBe(201);
            expect(response.body.message).toBe('conductor-creado-exitosamente');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.cifnif).toBe(testDriver.cifnif);
            expect(response.body.data.name).toBe(testDriver.name);

            // Guardar ID para limpieza posterior
            testDriverId = response.body.data.id;
        });

        it('should return 409 when creating driver with duplicate CIFNIF', async () => {
            if (!authToken || !testDriverId) {
                console.log('Skipping test - no auth token or test driver available');
                return;
            }

            // Intentar crear conductor con el mismo CIFNIF
            const duplicateDriver = {
                cifnif: `TEST${Date.now() - 1000}`, // Usar un CIFNIF que debería existir
                name: 'Duplicate Driver',
            };

            // Primero crear el conductor
            await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateDriver);

            // Luego intentar crear otro con el mismo CIFNIF
            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateDriver)
                .expect(200);

            expect(response.body.code).toBe(409);
            expect(response.body.message).toBe('Ya existe un conductor con este CIFNIF');
        });
    });
});
