import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
export const Sends = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { validateData } from '@util';
import { createSendSchema, getSendsFilteredSchema } from '@schemas';
import { ISendCreatebody, ISendGetFilteredbody } from '@types';
import { RowDataPacket } from 'mysql2';
//import { socketManager } from '../app';

Sends.get('/', (_req: Request, res: Response) => {
    res.json({
        code: 200,
        message: 'Sends controller Ready!',
    });
    return;
});

Sends.post('/getSendsFiltered', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    const { isError, error, data } = validateData<ISendGetFilteredbody>(getSendsFilteredSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }
    const { user_id, state, page = 1, limit = 20 } = data;

    // Construir query manualmente para evitar problemas
    let whereClause = '';
    const params: any[] = [];

    // Agregar filtros si existen
    const conditions: string[] = [];
    if (user_id !== undefined && user_id !== null) {
        conditions.push('ms.user_id = ?');
        params.push(user_id);
    }
    if (state !== undefined && state !== null) {
        conditions.push('ms.state = ?');
        params.push(state);
    }

    if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')} `;
    }

    // Query principal con paginación
    const offset = (page - 1) * limit;

    // Construir query de paginación dinámicamente
    let paginationClause: string;
    let paginationParams: any[];

    if (offset === 0) {
        paginationClause = 'LIMIT ?';
        paginationParams = [limit?.toString()];
    } else {
        paginationClause = 'LIMIT ? OFFSET ?';
        paginationParams = [limit?.toString(), offset?.toString()];
    }

    const mainQuery = `SELECT 
        ms.*,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', msd.id,
                'quantity', msd.quantity,
                'width', msd.width,
                'height', msd.height,
                'length', msd.length,
                'reference', msd.reference
            )
        ) AS details
    FROM main_sends ms
    JOIN main_send_details msd ON ms.id = msd.send_id
    ${whereClause}GROUP BY ms.id
    ${paginationClause}`;
    // Agregar parámetros de paginación
    const finalParams = [...params, ...paginationParams];

    // Query de conteo
    const countQuery = `SELECT COUNT(DISTINCT ms.id) as total
    FROM main_sends ms
    JOIN main_send_details msd ON ms.id = msd.send_id
    ${whereClause}`;
    // Ejecutar consultas
    const [rows] = await db.execute<RowDataPacket[]>(mainQuery, finalParams);
    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, params);

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
        message: 'sends-filtered',
    });
    return;
});

Sends.post('/create', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    const { isError, error, data } = validateData<ISendCreatebody>(createSendSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }
    const { user_id } = data;
    //const [rows] = await db.execute<RowDataPacket[]>(`INSERT INTO sends (user_id) VALUES (?)`, [user_id]);
    console.log({ user_id });
    res.json({
        code: 200,
        message: 'send-created',
    });
    return;
});
