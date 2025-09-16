import { QueryBuilder } from '../../src/util/QueryBuilder';

describe('QueryBuilder - Unit Tests', () => {
    describe('buildDynamicWhere', () => {
        it('debería construir query básico con filtros simples', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';
            const filters = {
                name: 'John',
                age: 25,
                active: true,
            };

            // Act
            const result = QueryBuilder.buildDynamicWhere(baseQuery, filters);

            // Assert
            expect(result.query).toContain('WHERE 1=1');
            expect(result.query).toContain('name = ?');
            expect(result.query).toContain('age = ?');
            expect(result.query).toContain('active = ?');
            expect(result.params).toEqual(['John', 25, true]);
        });

        it('debería ignorar valores null y undefined', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';
            const filters = {
                name: 'John',
                age: null,
                email: undefined,
                active: true,
            };

            // Act
            const result = QueryBuilder.buildDynamicWhere(baseQuery, filters);

            // Assert
            expect(result.query).toContain('name = ?');
            expect(result.query).toContain('active = ?');
            expect(result.query).not.toContain('age = ?');
            expect(result.query).not.toContain('email = ?');
            expect(result.params).toEqual(['John', true]);
        });

        it('debería manejar operador LIKE para strings', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';
            const filters = { name: 'John' };
            const fieldConfig = { name: { operator: 'LIKE', type: 'string' } };

            // Act
            const result = QueryBuilder.buildDynamicWhere(baseQuery, filters, fieldConfig);

            // Assert
            expect(result.query).toContain('name LIKE ?');
            expect(result.params).toEqual(['%John%']);
        });

        it('debería retornar query base cuando no hay filtros válidos', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';
            const filters = {
                name: null,
                age: undefined,
                email: '',
            };

            // Act
            const result = QueryBuilder.buildDynamicWhere(baseQuery, filters);

            // Assert
            expect(result.query).toBe('SELECT * FROM users WHERE 1=1');
            expect(result.params).toEqual([]);
        });
    });

    describe('buildComplexWhere', () => {
        it('debería construir condiciones WHERE para queries complejos', () => {
            // Arrange
            const baseQuery =
                'SELECT u.*, p.name as profile_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id';
            const filters = {
                'u.name': 'John',
                'u.age': 25,
                'p.active': true,
            };

            // Act
            const result = QueryBuilder.buildComplexWhere(baseQuery, filters);

            // Assert
            expect(result.query).toContain('u.name = ?');
            expect(result.query).toContain('u.age = ?');
            expect(result.query).toContain('p.active = ?');
            expect(result.params).toEqual(['John', 25, true]);
        });
    });

    describe('addPagination', () => {
        it('debería agregar paginación básica', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users WHERE active = 1';

            // Act
            const result = QueryBuilder.addPagination(baseQuery, 2, 10);

            // Assert
            expect(result.query).toContain('LIMIT ? OFFSET ?');
            expect(result.params).toEqual(['10', '10']);
        });

        it('debería usar valores por defecto', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';

            // Act
            const result = QueryBuilder.addPagination(baseQuery);

            // Assert
            expect(result.query).toContain('LIMIT ?');
            expect(result.params).toEqual(['20', '0']);
        });
    });

    describe('buildCountQuery', () => {
        it('debería construir query de conteo', () => {
            // Arrange
            const baseQuery = 'SELECT u.name, u.email FROM users u WHERE u.active = 1';
            const filters = { 'u.status': 'active' };

            // Act
            const result = QueryBuilder.buildCountQuery(baseQuery, filters);

            // Assert
            expect(result.query).toContain('SELECT COUNT(*) as total');
            expect(result.query).toContain('FROM users u');
            expect(result.params).toEqual(['active']);
        });

        it('debería fallar si no hay cláusula FROM', () => {
            // Arrange
            const baseQuery = 'SELECT COUNT(*)';
            const filters = {};

            // Act & Assert
            expect(() => {
                QueryBuilder.buildCountQuery(baseQuery, filters);
            }).toThrow('Query debe contener cláusula FROM para generar COUNT');
        });
    });

    describe('buildDynamicInsert', () => {
        it('debería construir query de INSERT básico', () => {
            // Arrange
            const data = {
                name: 'John',
                email: 'john@example.com',
                age: 30,
            };

            // Act
            const result = QueryBuilder.buildDynamicInsert('users', data);

            // Assert
            expect(result.query).toBe('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
            expect(result.params).toEqual(['John', 'john@example.com', 30]);
        });

        it('debería excluir campos especificados', () => {
            // Arrange
            const data = {
                id: 1,
                name: 'John',
                email: 'john@example.com',
                password: 'secret',
            };

            // Act
            const result = QueryBuilder.buildDynamicInsert('users', data, ['id', 'password']);

            // Assert
            expect(result.query).toBe('INSERT INTO users (name, email) VALUES (?, ?)');
            expect(result.params).toEqual(['John', 'john@example.com']);
        });

        it('debería excluir campos con valores null/undefined', () => {
            // Arrange
            const data = {
                name: 'John',
                email: null,
                age: undefined,
                active: true,
            };

            // Act
            const result = QueryBuilder.buildDynamicInsert('users', data);

            // Assert
            expect(result.query).toBe('INSERT INTO users (name, active) VALUES (?, ?)');
            expect(result.params).toEqual(['John', true]);
        });
    });

    describe('buildDynamicUpdate', () => {
        it('debería construir query de UPDATE básico', () => {
            // Arrange
            const data = {
                name: 'John Updated',
                email: 'john.new@example.com',
                age: 31,
            };

            // Act
            const result = QueryBuilder.buildDynamicUpdate('users', data, 'id = ?', [1]);

            // Assert
            expect(result.query).toBe('UPDATE users SET name = ?, email = ?, age = ? WHERE id = ?');
            expect(result.params).toEqual(['John Updated', 'john.new@example.com', 31, 1]);
        });

        it('debería excluir campo id automáticamente', () => {
            // Arrange
            const data = {
                id: 999, // Debería ser excluido
                name: 'John Updated',
                email: 'john.new@example.com',
            };

            // Act
            const result = QueryBuilder.buildDynamicUpdate('users', data, 'id = ?', [1]);

            // Assert
            expect(result.query).toBe('UPDATE users SET name = ?, email = ? WHERE id = ?');
            expect(result.params).toEqual(['John Updated', 'john.new@example.com', 1]);
        });

        it('debería manejar condiciones WHERE complejas', () => {
            // Arrange
            const data = { name: 'Updated' };

            // Act
            const result = QueryBuilder.buildDynamicUpdate('users', data, 'id = ? AND active = ?', [1, true]);

            // Assert
            expect(result.query).toBe('UPDATE users SET name = ? WHERE id = ? AND active = ?');
            expect(result.params).toEqual(['Updated', 1, true]);
        });
    });

    describe('buildComplexWhereWithPagination', () => {
        it('debería combinar filtros y paginación', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';
            const filters = { name: 'John', active: true };
            const options = { page: 2, limit: 5 };

            // Act
            const result = QueryBuilder.buildComplexWhereWithPagination(baseQuery, filters, options);

            // Assert
            expect(result.query).toContain('WHERE name = ? AND active = ?'); // buildComplexWhere usa = por defecto, no LIKE
            expect(result.query).toContain('LIMIT ? OFFSET ?');
            expect(result.params).toEqual(['John', true, '5', '5']); // Sin % porque no es LIKE
        });

        it('debería usar valores por defecto para paginación', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users';
            const filters = {};

            // Act
            const result = QueryBuilder.buildComplexWhereWithPagination(baseQuery, filters);

            // Assert
            expect(result.query).toContain('LIMIT ? OFFSET ?');
            expect(result.params).toEqual(['20', '0']); // defaults: page=1, limit=20
        });
    });

    describe('buildCountQuery - casos adicionales', () => {
        it('debería limpiar GROUP BY del query original', () => {
            // Arrange
            const baseQuery =
                'SELECT u.*, COUNT(p.id) FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id ORDER BY u.name';
            const filters = { active: true };

            // Act
            const result = QueryBuilder.buildCountQuery(baseQuery, filters);

            // Assert
            expect(result.query).toContain('SELECT COUNT(*) as total');
            expect(result.query).not.toContain('GROUP BY');
            expect(result.query).not.toContain('ORDER BY');
            expect(result.query).toContain('WHERE active = ?');
        });

        it('debería limpiar LIMIT y OFFSET del query original', () => {
            // Arrange
            const baseQuery = 'SELECT * FROM users ORDER BY created_at LIMIT 10 OFFSET 20';
            const filters = {};

            // Act
            const result = QueryBuilder.buildCountQuery(baseQuery, filters);

            // Assert
            // La regex actual tiene problemas con palabras que contienen las letras de "limit"
            // pero debería limpiar LIMIT y OFFSET correctamente
            expect(result.query).toContain('SELECT COUNT(*) as total FROM users');
            expect(result.query).not.toContain('LIMIT 10');
            expect(result.query).not.toContain('OFFSET 20');
        });
    });
});
