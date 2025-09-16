/* eslint-disable prettier/prettier */
import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';

// Import después de los mocks
import '../setup';
import { createMockDbResult, mockDrivers } from '../helpers/testHelpers';

// Mock completo de app.ts para evitar que se inicie el servidor
jest.mock('../../src/app', () => ({
    socketManager: {
        emitToAll: jest.fn(),
        emitToUser: jest.fn(),
    },
}));

// Mock del middleware getUserData
const mockGetUserData = jest.fn((_req: any, _res: any, next: any) => {
    next(); // Siempre permitir acceso para tests unitarios
});

jest.mock('../../src/middlewares/Users', () => ({
    getUserData: mockGetUserData,
}));

// Mock de rate limiting específico
jest.mock('../../src/middlewares/RateLimit', () => ({
    modifyDataRateLimit: (_req: any, _res: any, next: any) => next(),
}));

// Mock de la base de datos
const mockExecute = jest.fn() as any;
jest.mock('../../src/database', () => ({
    db: {
        execute: mockExecute,
        query: jest.fn(),
        end: jest.fn(),
    },
}));

// Ahora sí importar el controlador
import { General as GeneralController } from '../../src/controllers/General';

// Setup de la app de test
const app = express();
app.use(express.json());
app.use('/api/general', GeneralController);

describe('General Controller - Simple Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset del mock del middleware
        mockGetUserData.mockImplementation((_req: any, _res: any, next: any) => {
            next();
        });
    });

    describe('GET /', () => {
        it('debería retornar mensaje de que el controlador está listo', async () => {
            const response = await request(app).get('/api/general/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('message', 'General controller Ready!');
        }, 5000);
    });

    describe('GET /routes', () => {
        it('debería retornar lista de rutas con vehículos', async () => {
            // Arrange - Mock de rutas con vehículos asignados
            const routesWithVehicles = [{
                id: 1,
                code: 'COL001',
                desc_route: 'De sur a norte',
                vehicle_id: 1,
                vehicle: {
                    id: 1,
                    code: 'VEH001',
                    brand: 'Toyota',
                    capacity: 100
                }
            }];

            mockExecute.mockResolvedValueOnce(createMockDbResult(routesWithVehicles) as any);

            // Act
            const response = await request(app).get('/api/general/routes');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(Number),
                        code: expect.any(String),
                        desc_route: expect.any(String),
                        vehicle_id: expect.any(Number),
                        vehicle: expect.objectContaining({
                            id: expect.any(Number),
                            code: expect.any(String),
                            brand: expect.any(String),
                            capacity: expect.any(Number)
                        })
                    })
                ]),
                message: 'routes-with-vehicles'
            });
        }, 5000);

        it('debería retornar rutas sin vehículo asignado', async () => {
            // Arrange - Mock de ruta sin vehículo
            const routeWithoutVehicle = [
                {
                    id: 1,
                    code: 'R001',
                    desc_route: 'Ruta sin vehículo',
                    vehicle_id: null,
                    vehicle: null,
                },
            ];

            mockExecute.mockResolvedValueOnce(createMockDbResult(routeWithoutVehicle) as any);

            // Act
            const response = await request(app).get('/api/general/routes');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.data[0]).toEqual(
                expect.objectContaining({
                    vehicle: null,
                }),
            );
        }, 5000);
    });

    describe('GET /drivers', () => {
        it('debería retornar lista de conductores disponibles', async () => {
            // Arrange
            mockExecute.mockResolvedValueOnce(createMockDbResult(mockDrivers) as any);

            // Act
            const response = await request(app).get('/api/general/drivers');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(Number),
                        cifnif: expect.any(String),
                        name: expect.any(String),
                    }),
                ]),
                message: 'drivers-available',
            });

            // Verificar que se llamó a la base de datos
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT')
            );
        }, 5000);

        it('debería retornar lista vacía cuando no hay conductores', async () => {
            // Arrange
            mockExecute.mockResolvedValueOnce(createMockDbResult([]) as any);

            // Act
            const response = await request(app).get('/api/general/drivers');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                data: [],
                message: 'drivers-available',
            });
        }, 5000);
    });

    describe('Middleware Integration', () => {
        it('debería funcionar sin middlewares complejos', async () => {
            // Act
            const response = await request(app).get('/api/general/');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        }, 5000);
    });
});
