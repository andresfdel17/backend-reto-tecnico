import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
export const Users = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { QueryBuilder } from '@util';
import { RowDataPacket } from 'mysql2';

Users.get('/', (_req: Request, res: Response) => {
    res.json({
        code: 200,
        message: 'Users controller Ready!',
    });
    return;
});

Users.get('/getAllUsers', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Query con paginación
    const { query, params } = QueryBuilder.addPagination(
        `SELECT id, name, email, rol_id FROM main_users ORDER BY id DESC`,
        page,
        limit,
    );

    // Query para contar total
    const [countResult] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM main_users`);
    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
        code: 200,
        data: rows,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
        message: 'users-retrieved',
    });
    return;
});
