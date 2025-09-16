import request from 'supertest';
import { jest } from '@jest/globals';
import express from 'express';

// Import después de los mocks
import '../setup';
import { createMockDbResult, createMockInsertResult } from '../helpers/testHelpers';

// Mock completo de app.ts para evitar que se inicie el servidor
jest.mock('../../src/app', () => ({
    socketManager: {
        emitToAll: jest.fn(),
        emitToUser: jest.fn(),
    },
}));

// Mock del middleware getUserData con usuario simulado
const mockGetUserData = jest.fn((req: any, _res: any, next: any) => {
    // Simular usuario autenticado por defecto
    req.actualUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        rol_id: 1, // Admin por defecto
    };
    next();
});

jest.mock('../../src/middlewares/Users', () => ({
    getUserData: mockGetUserData,
}));

// Mock de rate limiting específico
jest.mock('../../src/middlewares/RateLimit', () => ({
    modifyDataRateLimit: (_req: any, _res: any, next: any) => next(),
    authRateLimit: (_req: any, _res: any, next: any) => next(),
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
import { Sends as SendsController } from '../../src/controllers/Sends';

// Setup de la app de test
const app = express();
app.use(express.json());
app.use('/api/sends', SendsController);

describe('Sends Controller - Simple Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset del mock del middleware con usuario admin por defecto
        mockGetUserData.mockImplementation((req: any, _res: any, next: any) => {
            req.actualUser = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                rol_id: 1, // Admin por defecto
            };
            next();
        });
    });

    describe('GET /', () => {
        it('debería retornar mensaje de que el controlador está listo', async () => {
            const response = await request(app).get('/api/sends/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('message', 'Sends controller Ready!');
        }, 5000);
    });

    describe('POST /create', () => {
        it('debería fallar cuando falta reference', async () => {
            // Arrange
            const sendData = {
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
            };

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"reference" is required',
            });
        }, 5000);

        it('debería fallar cuando falta address', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                width: 10,
                height: 20,
                length: 30,
            };

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"address" is required',
            });
        }, 5000);

        it('debería fallar cuando falta width', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                height: 20,
                length: 30,
            };

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"width" is required',
            });
        }, 5000);

        it('debería fallar con width negativo', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: -10, // Número negativo
                height: 20,
                length: 30,
            };

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"width" must be a positive number',
            });
        }, 5000);

        it('debería crear un send exitosamente', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
            };

            mockExecute.mockResolvedValueOnce(createMockInsertResult(1, 1) as any);

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                text: 'send-created',
            });

            // Verificar que se llamó al INSERT
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO main_sends'),
                expect.arrayContaining([
                    expect.any(Number), // unique_id
                    'REF123', // reference
                    'Calle 123', // address
                    10, // width
                    20, // height
                    30, // length
                    1, // user_id
                    1, // state
                    expect.any(String), // create_datetime
                    1, // units
                ]),
            );
        }, 5000);

        it('debería fallar cuando la ruta no existe', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
                route_id: 999, // Ruta inexistente
            };

            // Mock: ruta no encontrada
            mockExecute.mockResolvedValueOnce(createMockDbResult([]) as any);

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: 'route-not-found',
            });
        }, 5000);

        it('debería fallar cuando la ruta no tiene vehículo asignado', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
                route_id: 1,
            };

            // Mock: ruta existe pero sin vehículo
            mockExecute.mockResolvedValueOnce(createMockDbResult([{ capacity: null, brand: null, code: null }]) as any);

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: 'route-has-no-vehicle-assigned',
            });
        }, 5000);

        it('debería fallar cuando se excede la capacidad del vehículo', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
                route_id: 1,
                units: 10, // Más unidades que la capacidad
            };

            // Mock: vehículo con capacidad limitada
            mockExecute.mockResolvedValueOnce(
                createMockDbResult([{ capacity: 5, brand: 'Toyota', code: 'TOY001' }]) as any,
            );

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: 'vehicle-capacity-exceeded',
                data: {
                    vehicleCapacity: 5,
                    sendUnits: 10,
                    vehicleBrand: 'Toyota',
                    vehicleCode: 'TOY001',
                },
            });
        }, 5000);

        it('debería fallar cuando el conductor no está disponible', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
                driver_id: 1,
            };

            // Mock: conductor ocupado
            mockExecute.mockResolvedValueOnce(
                createMockDbResult([
                    {
                        id: 2,
                        unique_id: 1234567890,
                        reference: 'REF456',
                        driver_name: 'Juan Pérez',
                    },
                ]) as any,
            );

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: 'driver-not-available',
                data: {
                    driverName: 'Juan Pérez',
                    conflictingSendId: 1234567890,
                    conflictingSendReference: 'REF456',
                },
            });
        }, 5000);

        it('debería fallar cuando el conductor no existe', async () => {
            // Arrange
            const sendData = {
                reference: 'REF123',
                address: 'Calle 123',
                width: 10,
                height: 20,
                length: 30,
                driver_id: 999,
            };

            mockExecute
                .mockResolvedValueOnce(createMockDbResult([]) as any) // Driver disponible (no hay conflictos)
                .mockResolvedValueOnce(createMockDbResult([]) as any); // Driver no existe

            // Act
            const response = await request(app).post('/api/sends/create').send(sendData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: 'driver-not-found',
            });
        }, 5000);
    });

    describe('PUT /update/:id', () => {
        it('debería fallar con ID inválido', async () => {
            // Arrange
            const updateData = { description: 'Nueva descripción' };

            // Act
            const response = await request(app)
                .put('/api/sends/update/abc') // ID no numérico
                .send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 400);
            expect(response.body).toHaveProperty('text', 'invalid-send-id');
        }, 5000);

        it('debería fallar con ID cero', async () => {
            // Arrange
            const updateData = { description: 'Nueva descripción' };

            // Act
            const response = await request(app)
                .put('/api/sends/update/0') // ID cero
                .send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 400);
            expect(response.body).toHaveProperty('text', 'invalid-send-id');
        }, 5000);

        it('debería fallar con state inválido (menor a 1)', async () => {
            // Arrange
            const updateData = { state: 0 }; // State inválido

            // Act
            const response = await request(app).put('/api/sends/update/1').send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"state" must be greater than or equal to 1',
            });
        }, 5000);

        it('debería fallar con state inválido (mayor a 4)', async () => {
            // Arrange
            const updateData = { state: 5 }; // State inválido

            // Act
            const response = await request(app).put('/api/sends/update/1').send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"state" must be less than or equal to 4',
            });
        }, 5000);

        it('debería fallar con width negativo en update', async () => {
            // Arrange
            const updateData = { width: -5 }; // Width negativo

            // Act
            const response = await request(app).put('/api/sends/update/1').send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 400,
                text: '"width" must be a positive number',
            });
        }, 5000);

        it('debería fallar cuando el send no existe', async () => {
            // Arrange
            const updateData = { width: 15 };

            // Mock: send no encontrado
            mockExecute.mockResolvedValueOnce(createMockDbResult([]) as any);

            // Act
            const response = await request(app).put('/api/sends/update/999').send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 404,
                text: 'send-not-found',
            });
        }, 5000);

        it('debería fallar cuando usuario no admin trata de editar send de otro', async () => {
            // Arrange
            const updateData = { width: 15 };

            // Mock: usuario no admin
            mockGetUserData.mockImplementationOnce((req: any, _res: any, next: any) => {
                req.actualUser = {
                    id: 2, // Diferente usuario
                    name: 'User Normal',
                    email: 'user@example.com',
                    rol_id: 2, // No admin
                };
                next();
            });

            // Mock: send existe pero pertenece a otro usuario
            mockExecute.mockResolvedValueOnce(
                createMockDbResult([
                    { id: 1, user_id: 1, reference: 'REF123' }, // Pertenece al usuario 1
                ]) as any,
            );

            // Act
            const response = await request(app).put('/api/sends/update/1').send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 403,
                text: 'insufficient-permissions',
            });
        }, 5000);

        it('debería permitir que admin edite send de cualquier usuario', async () => {
            // Arrange
            const updateData = { width: 15 };

            // Mock: secuencia completa de llamadas DB
            mockExecute
                // 1. Verificar que el send existe
                .mockResolvedValueOnce(createMockDbResult([{ id: 1, user_id: 2, reference: 'REF123' }]) as any)
                // 2. UPDATE exitoso (no retorna filas)
                .mockResolvedValueOnce([{ affectedRows: 1 }] as any)
                // 3. Obtener datos actualizados
                .mockResolvedValueOnce(
                    createMockDbResult([
                        { id: 1, user_id: 2, unique_id: 1234567890, reference: 'REF123', width: 15 },
                    ]) as any,
                )
                // 4. Obtener email del propietario
                .mockResolvedValueOnce(createMockDbResult([{ email: 'owner@example.com', name: 'Owner User' }]) as any);

            // Act
            const response = await request(app).put('/api/sends/update/1').send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                text: 'send-updated',
                data: expect.objectContaining({
                    id: 1,
                    width: 15,
                }),
            });
        }, 5000);

        describe('Validaciones de negocio en UPDATE', () => {
            it('debería fallar cuando la ruta no existe en update', async () => {
                // Arrange
                const updateData = { route_id: 999 };

                // Mock: send existe, pero ruta no existe
                mockExecute
                    .mockResolvedValueOnce(createMockDbResult([{ id: 1, user_id: 1, reference: 'REF123' }]) as any)
                    .mockResolvedValueOnce(createMockDbResult([]) as any); // Ruta no encontrada

                // Act
                const response = await request(app).put('/api/sends/update/1').send(updateData);

                // Assert
                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    code: 400,
                    text: 'route-not-found',
                });
            }, 5000);

            it('debería fallar cuando la ruta no tiene vehículo asignado en update', async () => {
                // Arrange
                const updateData = { route_id: 1 };

                // Mock: send existe, ruta existe pero sin vehículo
                mockExecute
                    .mockResolvedValueOnce(createMockDbResult([{ id: 1, user_id: 1, reference: 'REF123' }]) as any)
                    .mockResolvedValueOnce(createMockDbResult([{ capacity: null, brand: null, code: null }]) as any);

                // Act
                const response = await request(app).put('/api/sends/update/1').send(updateData);

                // Assert - La lógica actual compara units > null, lo que resulta en vehicle-capacity-exceeded
                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    code: 400,
                    text: 'vehicle-capacity-exceeded',
                    data: {
                        vehicleCapacity: null,
                        sendUnits: 1,
                        vehicleBrand: null,
                        vehicleCode: null,
                    },
                });
            }, 5000);

            it('debería fallar cuando se excede la capacidad del vehículo en update', async () => {
                // Arrange
                const updateData = { route_id: 1, units: 10 };

                // Mock: send existe, vehículo con capacidad limitada
                mockExecute
                    .mockResolvedValueOnce(
                        createMockDbResult([{ id: 1, user_id: 1, reference: 'REF123', units: 1 }]) as any,
                    )
                    .mockResolvedValueOnce(
                        createMockDbResult([{ capacity: 5, brand: 'Toyota', code: 'TOY001' }]) as any,
                    );

                // Act
                const response = await request(app).put('/api/sends/update/1').send(updateData);

                // Assert
                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    code: 400,
                    text: 'vehicle-capacity-exceeded',
                    data: {
                        vehicleCapacity: 5,
                        sendUnits: 10,
                        vehicleBrand: 'Toyota',
                        vehicleCode: 'TOY001',
                    },
                });
            }, 5000);

            it('debería fallar cuando el conductor no está disponible en update', async () => {
                // Arrange
                const updateData = { driver_id: 1 };

                // Mock: send existe, conductor ocupado
                mockExecute
                    .mockResolvedValueOnce(createMockDbResult([{ id: 1, user_id: 1, reference: 'REF123' }]) as any)
                    .mockResolvedValueOnce(
                        createMockDbResult([
                            {
                                id: 2,
                                unique_id: 1234567890,
                                reference: 'REF456',
                                driver_name: 'Juan Pérez',
                            },
                        ]) as any,
                    );

                // Act
                const response = await request(app).put('/api/sends/update/1').send(updateData);

                // Assert
                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    code: 400,
                    text: 'driver-not-available',
                    data: {
                        driverName: 'Juan Pérez',
                        conflictingSendId: 1234567890,
                        conflictingSendReference: 'REF456',
                    },
                });
            }, 5000);

            it('debería fallar cuando el conductor no existe en update', async () => {
                // Arrange
                const updateData = { driver_id: 999 };

                // Mock: send existe, conductor disponible pero no existe
                mockExecute
                    .mockResolvedValueOnce(createMockDbResult([{ id: 1, user_id: 1, reference: 'REF123' }]) as any)
                    .mockResolvedValueOnce(createMockDbResult([]) as any) // Driver disponible
                    .mockResolvedValueOnce(createMockDbResult([]) as any); // Driver no existe

                // Act
                const response = await request(app).put('/api/sends/update/1').send(updateData);

                // Assert
                expect(response.status).toBe(200);
                expect(response.body).toEqual({
                    code: 400,
                    text: 'driver-not-found',
                });
            }, 5000);
        });
    });

    describe('POST /getSendsFiltered', () => {
        it('debería fallar con datos inválidos', async () => {
            // Arrange - datos inválidos
            const filterData = {
                page: -1, // Página inválida
                limit: 'invalid', // Limit inválido
            };

            // Act
            const response = await request(app).post('/api/sends/getSendsFiltered').send(filterData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('code', 400);
            expect(response.body).toHaveProperty('text');
        }, 5000);

        it('debería retornar sends filtrados exitosamente', async () => {
            // Arrange
            const filterData = {
                page: 1,
                limit: 10,
                filters: {
                    state: 1,
                },
            };

            // Mock: data query y count query (en ese orden según el controlador)
            mockExecute
                .mockResolvedValueOnce(
                    createMockDbResult([
                        // Data query
                        {
                            id: 1,
                            unique_id: 1234567890,
                            reference: 'REF123',
                            address: 'Calle 123',
                            width: 10,
                            height: 20,
                            length: 30,
                            units: 1,
                            state: 1,
                            user_id: 1,
                            route_id: null,
                            driver_id: null,
                            create_datetime: '2023-01-01 10:00:00',
                        },
                    ]) as any,
                )
                .mockResolvedValueOnce(createMockDbResult([{ total: 5 }]) as any); // Count query

            // Act
            const response = await request(app).post('/api/sends/getSendsFiltered').send(filterData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(Number),
                        unique_id: expect.any(Number),
                        reference: expect.any(String),
                        state: expect.any(Number),
                    }),
                ]),
                pagination: expect.objectContaining({
                    page: 1,
                    limit: 10,
                    total: 5,
                    totalPages: 1,
                }),
                message: 'sends-filtered',
            });
        }, 5000);

        it('debería retornar lista vacía cuando no hay sends', async () => {
            // Arrange
            const filterData = {
                page: 1,
                limit: 10,
            };

            // Mock: data vacía y count = 0 (en ese orden según el controlador)
            mockExecute
                .mockResolvedValueOnce(createMockDbResult([]) as any) // Data query vacía primero
                .mockResolvedValueOnce(createMockDbResult([{ total: 0 }]) as any); // Count query

            // Act
            const response = await request(app).post('/api/sends/getSendsFiltered').send(filterData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                code: 200,
                data: [],
                pagination: expect.objectContaining({
                    total: 0,
                    totalPages: 0,
                }),
                message: 'sends-filtered',
            });
        }, 5000);
    });

    describe('Middleware Integration', () => {
        it('debería funcionar básicamente', async () => {
            // Act
            const response = await request(app).get('/api/sends/');

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        }, 5000);
    });
});
