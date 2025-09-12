/**
 * Funciones utilitarias generales para el proyecto
 */

/**
 * Convierte strings vacíos a null en un objeto
 * Útil para limpiar datos antes de guardar en la base de datos
 * @param obj - Objeto a procesar
 * @returns Objeto con strings vacíos convertidos a null
 */
export const processEmptyStrings = (obj: any): any => {
    const processed = { ...obj };
    for (const key in processed) {
        const value = processed[key] ?? null;
        if (typeof value === 'string' && value.trim() === '') {
            processed[key] = null;
        }
    }
    return processed;
};

/**
 * Verifica si un valor es null, undefined o string vacío
 * @param value - Valor a verificar
 * @returns true si el valor está vacío
 */
export const isEmpty = (value: any): boolean => {
    const normalizedValue = value ?? null;
    return normalizedValue === null || (typeof normalizedValue === 'string' && normalizedValue.trim() === '');
};

/**
 * Convierte un valor a número si es posible, sino retorna null
 * @param value - Valor a convertir
 * @returns Número o null
 */
export const toNumberOrNull = (value: any): number | null => {
    const normalizedValue = value ?? null;
    if (normalizedValue === null || normalizedValue === '') {
        return null;
    }
    const num = Number(normalizedValue);
    return isNaN(num) ? null : num;
};
