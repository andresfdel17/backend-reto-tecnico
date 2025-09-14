export interface IQueryCondition {
    field: string;
    value: any;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
    type?: 'string' | 'number' | 'boolean' | 'array';
}

export interface IPaginationOptions<T> {
    fieldConfig?: Partial<Record<keyof T, { operator?: string; type?: string }>>;
    page?: number;
    limit?: number;
}

export class QueryBuilder {
    /**
     * Construye una consulta WHERE dinámica
     * @param baseQuery - Query base (ej: "SELECT * FROM table")
     * @param filters - Objeto con los filtros
     * @param fieldConfig - Configuración opcional de campos
     */
    static buildDynamicWhere<T extends Record<string, any>>(
        baseQuery: string,
        filters: T,
        fieldConfig?: Partial<Record<keyof T, { operator?: string; type?: string }>>,
    ): { query: string; params: any[] } {
        let query = `${baseQuery} WHERE 1=1`;
        const params: any[] = [];

        Object.entries(filters).forEach(([field, value]) => {
            if (this.shouldIncludeField(value)) {
                const config = fieldConfig?.[field as keyof T] || {};
                const operator = config.operator || '=';
                const type = config.type || this.inferType(value);

                query += ` AND ${field} ${operator} ?`;

                // Procesar valor según el tipo
                if (type === 'string' && operator === 'LIKE') {
                    params.push(`%${value}%`);
                } else if (type === 'array' && operator === 'IN') {
                    query = query.replace('?', `(${value.map(() => '?').join(', ')})`);
                    params.push(...value);
                } else {
                    params.push(value);
                }
            }
        });

        return { query, params };
    }

    /**
     * Construye filtros WHERE para queries complejos (con JOINs, GROUP BY, etc.)
     * @param baseQuery - Query complejo base
     * @param filters - Objeto con los filtros
     * @param fieldConfig - Configuración opcional de campos
     */
    static buildComplexWhere<T extends Record<string, any>>(
        baseQuery: string,
        filters: T,
        fieldConfig?: Partial<Record<keyof T, { operator?: string; type?: string }>>,
    ): { query: string; params: any[] } {
        const params: any[] = [];
        const whereConditions: string[] = [];

        Object.entries(filters).forEach(([field, value]) => {
            if (this.shouldIncludeField(value)) {
                const config = fieldConfig?.[field as keyof T] || {};
                const operator = config.operator || '=';
                const type = config.type || this.inferType(value);

                whereConditions.push(`${field} ${operator} ?`);

                // Procesar valor según el tipo
                if (type === 'string' && operator === 'LIKE') {
                    params.push(`%${value}%`);
                } else if (type === 'array' && operator === 'IN') {
                    const lastCondition = whereConditions.pop();
                    const placeholders = value.map(() => '?').join(', ');
                    whereConditions.push(lastCondition!.replace('?', `(${placeholders})`));
                    params.push(...value);
                } else {
                    params.push(value);
                }
            }
        });

        // Insertar WHERE antes de GROUP BY, ORDER BY, HAVING, etc.
        let query = baseQuery;
        if (whereConditions.length > 0) {
            const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

            // Buscar dónde insertar el WHERE
            const groupByIndex = query.toLowerCase().indexOf('group by');
            const orderByIndex = query.toLowerCase().indexOf('order by');
            const havingIndex = query.toLowerCase().indexOf('having');

            // Encontrar la primera ocurrencia de estas cláusulas
            const insertIndex = Math.min(
                ...[groupByIndex, orderByIndex, havingIndex].filter((index) => index !== -1).concat([query.length]),
            );

            if (insertIndex < query.length) {
                query = query.slice(0, insertIndex).trim() + ` ${whereClause} ` + query.slice(insertIndex);
            } else {
                query += ` ${whereClause}`;
            }
        }
        return { query, params };
    }

    /**
     * Determina si un campo debe incluirse en la consulta
     */
    private static shouldIncludeField(value: any): boolean {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (typeof value === 'number' && value < 0) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    }

    /**
     * Infiere el tipo de dato
     */
    private static inferType(value: any): string {
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'string';
    }

    /**
     * Construye una consulta de inserción dinámica
     */
    static buildDynamicInsert<T extends Record<string, any>>(
        tableName: string,
        data: T,
        excludeFields: (keyof T)[] = [],
    ): { query: string; params: any[] } {
        const fields = Object.keys(data).filter(
            (field) => !excludeFields.includes(field) && this.shouldIncludeField(data[field]),
        );

        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const params = fields.map((field) => data[field]);

        return { query, params };
    }

    /**
     * Construye una consulta de actualización dinámica
     */
    static buildDynamicUpdate<T extends Record<string, any>>(
        tableName: string,
        data: T,
        whereCondition: string,
        whereParams: any[],
    ): { query: string; params: any[] } {
        const excludeFields: (keyof T)[] = ['id'];
        const fields = Object.keys(data).filter(
            (field) => !excludeFields.includes(field) && this.shouldIncludeField(data[field]),
        );

        const setClause = fields.map((field) => `${field} = ?`).join(', ');
        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereCondition}`;
        const params = [...fields.map((field) => data[field]), ...whereParams];

        return { query, params };
    }

    /**
     * Agrega paginación a una consulta
     * @param baseQuery - Query base
     * @param page - Número de página (1-based)
     * @param limit - Número de registros por página
     */
    static addPagination(baseQuery: string, page: number = 1, limit: number = 20): { query: string; params: any[] } {
        const offset = (page - 1) * limit;
        const query = `${baseQuery} LIMIT ? OFFSET ?`;
        const params = [limit?.toString(), offset?.toString()];
        return { query, params };
    }

    /**
     * Construye query completo con filtros y paginación
     * @param baseQuery - Query base
     * @param filters - Filtros (excluyendo page y limit)
     * @param options - Opciones de paginación y configuración
     */
    static buildComplexWhereWithPagination<T extends Record<string, any>>(
        baseQuery: string,
        filters: Omit<T, 'page' | 'limit'>,
        options: IPaginationOptions<T> = {},
    ): { query: string; params: any[] } {
        const { fieldConfig, page = 1, limit = 20 } = options;
        // Primero aplicar filtros WHERE
        const { query: filteredQuery, params: filterParams } = this.buildComplexWhere(baseQuery, filters, fieldConfig);

        // Luego agregar paginación
        const { query: finalQuery, params: paginationParams } = this.addPagination(filteredQuery, page, limit);

        return {
            query: finalQuery,
            params: [...filterParams, ...paginationParams],
        };
    }

    /**
     * Construye query de conteo para paginación
     * @param baseQuery - Query base (SELECT será reemplazado por COUNT)
     * @param filters - Filtros aplicados
     * @param fieldConfig - Configuración de campos
     */
    static buildCountQuery<T extends Record<string, any>>(
        baseQuery: string,
        filters: T,
        fieldConfig?: Partial<Record<keyof T, { operator?: string; type?: string }>>,
    ): { query: string; params: any[] } {
        // Extraer la parte FROM en adelante del query original
        const fromIndex = baseQuery.toLowerCase().indexOf('from');
        if (fromIndex === -1) {
            throw new Error('Query debe contener cláusula FROM para generar COUNT');
        }

        const fromClause = baseQuery.substring(fromIndex);

        // Remover GROUP BY, ORDER BY, LIMIT para el conteo
        const cleanFromClause = fromClause
            .replace(/\s+group\s+by\s+[^order\s]+/gi, '')
            .replace(/\s+order\s+by\s+[^limit\s]+/gi, '')
            .replace(/\s+limit\s+\d+(\s+offset\s+\d+)?/gi, '');

        const countQuery = `SELECT COUNT(*) as total ${cleanFromClause}`;

        return this.buildComplexWhere(countQuery, filters, fieldConfig);
    }
}
