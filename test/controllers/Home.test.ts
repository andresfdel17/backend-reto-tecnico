import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/Application';

describe('Home Controller', () => {
    beforeAll(async () => {
        // Setup inicial si es necesario
    });

    beforeEach(() => {
        // Limpiar mocks antes de cada test
        global.mockExecute.mockClear();
        global.mockQuery.mockClear();
    });

    afterAll(async () => {
        // Cleanup si es necesario
    });

    describe('GET /api/home/', () => {
        it('should return controller ready message', async () => {
            const response = await request(app).get('/api/home/').expect(200);

            expect(response.body).toEqual({
                code: 200,
                message: 'Home controller Ready!',
            });
        });
    });

    describe('GET /api/home/tracking/:unique_id', () => {
        it('should return 404 for non-existent unique_id', async () => {
            // Mock: no se encuentra el envío
            global.mockExecute.mockResolvedValue([[]]);

            const response = await request(app).get('/api/home/tracking/NON_EXISTENT_ID').expect(200);

            expect(response.body.code).toBe(404);
            expect(response.body.message).toBe('tracking-not-found');
        });

        it('should return tracking data for existing unique_id', async () => {
            // Mock: se encuentra el envío
            const mockSend = {
                id: 1,
                user_id: 1,
                unique_id: 'TEST_UNIQUE_ID_123',
                route_id: null,
                driver_id: null,
                reference: 'TEST_REF_TRACKING',
                address: 'Test Address',
                units: 1,
                state: 1,
                create_datetime: '2024-01-01 10:00:00',
                transit_datetime: null,
                deliver_datetime: null,
                width: 10,
                height: 10,
                length: 10,
            };

            global.mockExecute.mockResolvedValue([[mockSend]]);

            const response = await request(app).get('/api/home/tracking/TEST_UNIQUE_ID_123').expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('tracking-found');
            expect(response.body.data).toHaveProperty('unique_id', 'TEST_UNIQUE_ID_123');
            expect(response.body.data).toHaveProperty('reference', 'TEST_REF_TRACKING');
        });
    });

    describe('GET /api/home/tracking', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/home/tracking').expect(200);

            expect(response.body.code).toBe(401);
            expect(response.body.message).toBe('authentication-required-for-list');
        });

        it('should return sends list for authenticated admin', async () => {
            // Mock: admin puede ver todos los envíos
            const mockSends = [
                {
                    id: 1,
                    user_id: 1,
                    unique_id: 'ADMIN_SEND_1',
                    reference: 'REF_001',
                    state: 1,
                },
                {
                    id: 2,
                    user_id: 2,
                    unique_id: 'USER_SEND_1',
                    reference: 'REF_002',
                    state: 2,
                },
            ];

            global.mockExecute.mockResolvedValue([mockSends]);

            const response = await request(app)
                .get('/api/home/tracking')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('sends-retrieved');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should return only user sends for authenticated user', async () => {
            // Mock: usuario normal solo ve sus envíos
            const mockUserSends = [
                {
                    id: 2,
                    user_id: 2,
                    unique_id: 'USER_SEND_1',
                    reference: 'REF_002',
                    state: 2,
                },
            ];

            // Mock para usuario normal (rol_id !== 1)
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const jwt = require('jsonwebtoken');
            jwt.verify.mockReturnValue({
                id: 2,
                email: 'afd@mail.com',
                rol_id: 2,
                name: 'Regular User',
            });

            global.mockExecute.mockResolvedValue([mockUserSends]);

            const response = await request(app)
                .get('/api/home/tracking')
                .set('Authorization', `Bearer mock-user-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('sends-retrieved');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toHaveLength(1);

            // Restaurar mock para admin
            jwt.verify.mockReturnValue({
                id: 1,
                email: 'a@mail.com',
                rol_id: 1,
                name: 'Admin User',
            });
        });
    });

    describe('GET /api/home/charts-data', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/home/charts-data').expect(200);

            expect(response.body.code).toBe(401);
            expect(response.body.text).toBe('Unauthorized');
        });

        it('should return chart data with default period for authenticated admin', async () => {
            // Mock: datos de gráficas por fecha y estado
            const mockChartRows = [
                { date: '2024-01-01', state: 1, count: 5 },
                { date: '2024-01-01', state: 2, count: 3 },
                { date: '2024-01-02', state: 1, count: 2 },
                { date: '2024-01-02', state: 3, count: 1 },
            ];

            // Mock: estadísticas totales
            const mockStatsRows = [
                { state: 1, total: 7 },
                { state: 2, total: 3 },
                { state: 3, total: 1 },
            ];

            global.mockExecute
                .mockResolvedValueOnce([mockChartRows]) // Primera consulta: datos de gráfica
                .mockResolvedValueOnce([mockStatsRows]); // Segunda consulta: estadísticas

            const response = await request(app)
                .get('/api/home/charts-data')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('charts-data-retrieved');
            expect(response.body.data).toHaveProperty('chartData');
            expect(response.body.data).toHaveProperty('stats');
            expect(response.body.data).toHaveProperty('period', 7);
            expect(response.body.data).toHaveProperty('dateRange');

            // Verificar estructura de chartData
            expect(response.body.data.chartData).toHaveProperty('labels');
            expect(response.body.data.chartData).toHaveProperty('datasets');
            expect(Array.isArray(response.body.data.chartData.labels)).toBe(true);
            expect(Array.isArray(response.body.data.chartData.datasets)).toBe(true);
            expect(response.body.data.chartData.datasets).toHaveLength(4);

            // Verificar estructura de stats
            expect(response.body.data.stats).toHaveProperty('created');
            expect(response.body.data.stats).toHaveProperty('inTransit');
            expect(response.body.data.stats).toHaveProperty('delivered');
            expect(response.body.data.stats).toHaveProperty('cancelled');
            expect(response.body.data.stats).toHaveProperty('total');
        });

        it('should return chart data with custom period', async () => {
            global.mockExecute
                .mockResolvedValueOnce([[]]) // Datos de gráfica vacíos
                .mockResolvedValueOnce([[]]); // Estadísticas vacías

            const response = await request(app)
                .get('/api/home/charts-data?period=15')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.data).toHaveProperty('period', 15);
            expect(response.body.data.chartData.labels).toHaveLength(15); // 15 días incluyendo hoy
        });

        it('should return chart data for authenticated user (filtered)', async () => {
            // Mock para usuario normal
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const jwt = require('jsonwebtoken');
            jwt.verify.mockReturnValue({
                id: 2,
                email: 'afd@mail.com',
                rol_id: 2,
                name: 'Regular User',
            });

            global.mockExecute
                .mockResolvedValueOnce([[]]) // Datos filtrados para usuario
                .mockResolvedValueOnce([[]]); // Estadísticas filtradas

            const response = await request(app)
                .get('/api/home/charts-data')
                .set('Authorization', `Bearer mock-user-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('charts-data-retrieved');
            expect(response.body.data).toHaveProperty('chartData');
            expect(response.body.data).toHaveProperty('stats');

            // Restaurar mock para admin
            jwt.verify.mockReturnValue({
                id: 1,
                email: 'a@mail.com',
                rol_id: 1,
                name: 'Admin User',
            });
        });

        it('should handle invalid period parameter', async () => {
            global.mockExecute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);

            const response = await request(app)
                .get('/api/home/charts-data?period=invalid')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.data).toHaveProperty('period', 7); // Default fallback
        });
    });

    describe('GET /api/home/tracking-auth/:unique_id', () => {
        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/home/tracking-auth/TEST_ID').expect(200);

            expect(response.body.code).toBe(401);
            expect(response.body.text).toBe('Unauthorized');
        });

        it('should return 404 for non-existent unique_id', async () => {
            // Mock: no se encuentra el envío
            global.mockExecute.mockResolvedValue([[]]);

            const response = await request(app)
                .get('/api/home/tracking-auth/NON_EXISTENT_ID')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(404);
            expect(response.body.message).toBe('tracking-not-found');
        });

        it('should return tracking data for admin', async () => {
            // Mock: admin encuentra el envío
            const mockSend = {
                id: 1,
                user_id: 1,
                unique_id: 'ADMIN_TRACKING_TEST',
                route_id: null,
                driver_id: null,
                reference: 'TEST_REF_AUTH_TRACKING',
                address: 'Test Address for Auth Tracking',
                units: 1,
                state: 1,
                create_datetime: '2024-01-01 10:00:00',
                transit_datetime: null,
                deliver_datetime: null,
                width: 10,
                height: 10,
                length: 10,
            };

            global.mockExecute.mockResolvedValue([[mockSend]]);

            const response = await request(app)
                .get('/api/home/tracking-auth/ADMIN_TRACKING_TEST')
                .set('Authorization', `Bearer mock-jwt-token`)
                .expect(200);

            expect(response.body.code).toBe(200);
            expect(response.body.message).toBe('tracking-found');
            expect(response.body.data).toHaveProperty('unique_id', 'ADMIN_TRACKING_TEST');
            expect(response.body.data).toHaveProperty('reference', 'TEST_REF_AUTH_TRACKING');
        });
    });
});
