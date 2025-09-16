// Test básico para verificar configuración
import { mockUsers, createMockDbResult } from './helpers/testHelpers';

describe('Configuración básica de tests', () => {
    it('debería ejecutar tests correctamente', () => {
        expect(true).toBe(true);
    });

    it('debería tener variables de entorno configuradas', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.JWT_SECRET).toBeDefined();
    });

    it('debería poder importar helpers', () => {
        const mockUser = mockUsers[0];
        const mockDbResult = createMockDbResult([mockUser]);

        expect(mockUsers).toBeDefined();
        expect(mockUsers.length).toBeGreaterThan(0);
        expect(mockDbResult).toBeDefined();
    });
});
