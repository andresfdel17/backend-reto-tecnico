import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/Application';

describe('Drivers Controller', () => {
    beforeEach(() => {
        // Limpiar mocks antes de cada test
        global.mockExecute.mockClear();
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
            // Mock: lista de conductores
            const mockDrivers = [
                { id: 1, cifnif: '12345678A', name: 'Juan Pérez' },
                { id: 2, cifnif: '87654321B', name: 'María García' },
            ];
            global.mockExecute.mockResolvedValue([mockDrivers]);

            const response = await request(app)
                .get('/api/drivers/drivers')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.text).toBe('drivers-retrieved');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0]).toHaveProperty('id', 1);
            expect(response.body.data[0]).toHaveProperty('cifnif', '12345678A');
            expect(response.body.data[0]).toHaveProperty('name', 'Juan Pérez');
        });

        it('should return empty list when no drivers exist', async () => {
            // Mock: lista vacía
            global.mockExecute.mockResolvedValue([[]]);

            const response = await request(app)
                .get('/api/drivers/drivers')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.text).toBe('drivers-retrieved');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(0);
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

        it('should return 400 with invalid data - missing cifnif', async () => {
            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer mock-jwt-token`)
                .send({
                    cifnif: '', // CIFNIF vacío
                    name: 'Test Driver',
                })
                .expect(200);

            expect(response.body.code).toBe(400);
            expect(response.body.text).toContain('El CIFNIF es obligatorio');
        });

        it('should return 400 with invalid data - missing name', async () => {
            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer mock-jwt-token`)
                .send({
                    cifnif: '12345678A',
                    name: '', // Nombre vacío
                })
                .expect(200);

            expect(response.body.code).toBe(400);
            expect(response.body.text).toContain('El nombre es obligatorio');
        });

        it('should return 400 with invalid cifnif format', async () => {
            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer mock-jwt-token`)
                .send({
                    cifnif: '123', // CIFNIF muy corto
                    name: 'Test Driver',
                })
                .expect(200);

            expect(response.body.code).toBe(400);
            expect(response.body.text).toContain('El CIFNIF debe tener al menos 8 caracteres');
        });

        it('should create a new driver with valid data', async () => {
            // Mock: verificar que no existe conductor con ese CIFNIF
            global.mockExecute
                .mockResolvedValueOnce([[]]) // No existe conductor con ese CIFNIF
                .mockResolvedValueOnce([{ insertId: 1 }]) // Resultado de INSERT
                .mockResolvedValueOnce([[{ id: 1, cifnif: '12345678A', name: 'Test Driver' }]]); // Conductor creado

            const testDriver = {
                cifnif: '12345678A',
                name: 'Test Driver',
            };

            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer mock-jwt-token`)
                .send(testDriver)
                .expect(200);

            expect(response.body.code).toBe(201);
            expect(response.body.text).toBe('driver-created');
            expect(response.body.data).toHaveProperty('id', 1);
            expect(response.body.data.cifnif).toBe(testDriver.cifnif);
            expect(response.body.data.name).toBe(testDriver.name);
        });

        it('should return 409 when creating driver with duplicate CIFNIF', async () => {
            // Mock: conductor ya existe con ese CIFNIF
            global.mockExecute.mockResolvedValue([[{ id: 1 }]]);

            const duplicateDriver = {
                cifnif: '12345678A',
                name: 'Duplicate Driver',
            };

            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer mock-jwt-token`)
                .send(duplicateDriver)
                .expect(200);

            expect(response.body.code).toBe(409);
            expect(response.body.text).toBe('existing-driver');
        });

        it('should return 500 when failing to retrieve created driver', async () => {
            // Mock: verificar que no existe conductor, insertar exitoso, pero fallar al recuperar
            global.mockExecute
                .mockResolvedValueOnce([[]]) // No existe conductor con ese CIFNIF
                .mockResolvedValueOnce([{ insertId: 1 }]) // Resultado de INSERT
                .mockResolvedValueOnce([[]]); // Falla al recuperar el conductor creado

            const testDriver = {
                cifnif: '12345678A',
                name: 'Test Driver',
            };

            const response = await request(app)
                .post('/api/drivers/create')
                .set('Authorization', `Bearer mock-jwt-token`)
                .send(testDriver)
                .expect(200);

            expect(response.body.code).toBe(500);
            expect(response.body.text).toBe('error-retrieving-created-driver');
        });
    });
});
