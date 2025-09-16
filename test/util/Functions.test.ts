import { processEmptyStrings, isEmpty, toNumberOrNull } from '../../src/util/Functions';

describe('Functions - Unit Tests', () => {
    describe('processEmptyStrings', () => {
        it('debería convertir strings vacíos a null', () => {
            // Arrange
            const input = {
                name: 'John',
                email: '',
                address: '   ',
                phone: 'valid',
            };

            // Act
            const result = processEmptyStrings(input);

            // Assert
            expect(result).toEqual({
                name: 'John',
                email: null,
                address: null,
                phone: 'valid',
            });
        });

        it('debería mantener valores no-string sin cambios', () => {
            // Arrange
            const input = {
                id: 123,
                active: true,
                data: null,
                count: 0,
                items: ['a', 'b'],
            };

            // Act
            const result = processEmptyStrings(input);

            // Assert
            expect(result).toEqual({
                id: 123,
                active: true,
                data: null,
                count: 0,
                items: ['a', 'b'],
            });
        });

        it('debería manejar objetos vacíos', () => {
            // Arrange
            const input = {};

            // Act
            const result = processEmptyStrings(input);

            // Assert
            expect(result).toEqual({});
        });

        it('debería crear una copia del objeto original', () => {
            // Arrange
            const input = { name: 'test', empty: '' };

            // Act
            const result = processEmptyStrings(input);

            // Assert
            expect(result).not.toBe(input); // Diferente referencia
            expect(input.empty).toBe(''); // Original sin cambios
            expect(result.empty).toBe(null); // Copia modificada
        });

        it('debería manejar valores null y undefined', () => {
            // Arrange
            const input = {
                nullValue: null,
                undefinedValue: undefined,
                emptyString: '',
            };

            // Act
            const result = processEmptyStrings(input);

            // Assert
            expect(result).toEqual({
                nullValue: null,
                undefinedValue: undefined, // undefined se mantiene como undefined
                emptyString: null,
            });
        });
    });

    describe('isEmpty', () => {
        it('debería retornar true para valores vacíos', () => {
            // Act & Assert
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
            expect(isEmpty('')).toBe(true);
            expect(isEmpty('   ')).toBe(true);
        });

        it('debería retornar false para valores no vacíos', () => {
            // Act & Assert
            expect(isEmpty('hello')).toBe(false);
            expect(isEmpty('0')).toBe(false);
            expect(isEmpty(0)).toBe(false);
            expect(isEmpty(false)).toBe(false);
            expect(isEmpty([])).toBe(false);
            expect(isEmpty({})).toBe(false);
        });

        it('debería manejar strings con solo espacios', () => {
            // Act & Assert
            expect(isEmpty('   ')).toBe(true);
            expect(isEmpty('\t\n  ')).toBe(true);
            expect(isEmpty(' a ')).toBe(false);
        });
    });

    describe('toNumberOrNull', () => {
        it('debería convertir strings numéricos válidos', () => {
            // Act & Assert
            expect(toNumberOrNull('123')).toBe(123);
            expect(toNumberOrNull('0')).toBe(0);
            expect(toNumberOrNull('-456')).toBe(-456);
            expect(toNumberOrNull('3.14')).toBe(3.14);
        });

        it('debería retornar null para valores no numéricos', () => {
            // Act & Assert
            expect(toNumberOrNull('abc')).toBe(null);
            expect(toNumberOrNull('12abc')).toBe(null);
            expect(toNumberOrNull('NaN')).toBe(null);
            expect(toNumberOrNull('Infinity')).toBe(Infinity); // Number('Infinity') es válido
        });

        it('debería retornar null para valores vacíos', () => {
            // Act & Assert
            expect(toNumberOrNull(null)).toBe(null);
            expect(toNumberOrNull(undefined)).toBe(null);
            expect(toNumberOrNull('')).toBe(null);
        });

        it('debería manejar números ya convertidos', () => {
            // Act & Assert
            expect(toNumberOrNull(123)).toBe(123);
            expect(toNumberOrNull(0)).toBe(0);
            expect(toNumberOrNull(-456)).toBe(-456);
            expect(toNumberOrNull(3.14)).toBe(3.14);
        });

        it('debería manejar valores booleanos', () => {
            // Act & Assert
            expect(toNumberOrNull(true)).toBe(1);
            expect(toNumberOrNull(false)).toBe(0);
        });
    });
});
