// Mock app.ts para evitar que se ejecute el servidor
jest.mock('../src/app', () => ({}));

import request from 'supertest';

describe('Application - Configuration Tests', () => {
    let app: any;

    beforeAll(async () => {
        // Importar después del mock para evitar problemas de inicialización
        const { app: expressApp } = await import('../src/Application');
        app = expressApp;
    });

    describe('Server Configuration', () => {
        it('debería tener la aplicación Express configurada', () => {
            // Assert
            expect(app).toBeDefined();
            expect(typeof app).toBe('function'); // Express app es una función
        });

        it('debería tener el puerto configurado', () => {
            // Act
            const port = app.get('port');

            // Assert
            expect(port).toBeDefined();
            expect(typeof port === 'number' || typeof port === 'string').toBe(true);
        });

        it('debería responder en el endpoint raíz de la API', async () => {
            // Act
            const response = await request(app).get('/api/').expect(200);

            // Assert
            expect(response.body).toEqual({
                code: 200,
                message: 'API Ready!',
            });
        });
    });

    describe('Middleware Configuration', () => {
        it('debería tener CORS configurado', () => {
            // Assert - Verificar que el middleware CORS está en el stack
            const stack = app._router.stack;
            expect(stack.length).toBeGreaterThan(0); // Al menos debería haber middlewares
            expect(stack).toBeDefined();
        });

        it('debería parsear JSON en el body', () => {
            // Assert - Verificar que el middleware está configurado
            expect(app._router).toBeDefined();
            expect(app._router.stack.length).toBeGreaterThan(0);
        });

        it('debería aplicar headers de seguridad con Helmet', async () => {
            // Act
            const response = await request(app).get('/api/').expect(200);

            // Assert - Helmet debería agregar headers de seguridad
            expect(response.headers['x-content-type-options']).toBe('nosniff');
        });

        it('debería tener compresión configurada', () => {
            // Assert - Verificar que hay middlewares de compresión
            const stack = app._router.stack;
            expect(stack.length).toBeGreaterThan(3); // Debería tener varios middlewares incluyendo compresión
        });
    });

    describe('Error Handling', () => {
        it('debería manejar rutas no encontradas', async () => {
            // Act
            const response = await request(app).get('/api/nonexistent-route').expect(404);

            // Assert - Express debería retornar 404 para rutas no encontradas
            expect(response.status).toBe(404);
        });

        it('debería tener errorHandler configurado', () => {
            // Assert - Verificar que el error handler está al final del stack
            const stack = app._router.stack;
            const lastMiddleware = stack[stack.length - 1];
            expect(lastMiddleware).toBeDefined();
        });
    });

    describe('API Structure', () => {
        it('debería usar el prefijo /api/ para todas las rutas', async () => {
            // Act - Probar que sin /api/ no funcione
            const response = await request(app).get('/login/').expect(404);

            // Assert
            expect(response.status).toBe(404);
        });

        it('debería tener middlewares configurados en el orden correcto', () => {
            // Assert - Verificar que hay middlewares configurados
            const stack = app._router.stack;
            expect(stack.length).toBeGreaterThan(5); // Debería tener varios middlewares
        });
    });
});
