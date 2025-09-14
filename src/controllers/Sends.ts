import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
export const Sends = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { validateData } from '@util';
import { createSendSchema, getSendsFilteredSchema, updateSendSchema } from '@schemas';
import { ISendCreatebody, ISendGetFilteredbody, ISendUpdateBody } from '@types';
import { RowDataPacket } from 'mysql2';
import moment from 'moment-timezone';
import { socketManager } from '../app';

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
    const { state, page = 1, limit = 20 } = data;
    let { user_id } = data;

    // Construir query manualmente para evitar problemas
    let whereClause = '';
    const params: any[] = [];

    // Agregar filtros si existen
    const conditions: string[] = [];
    if (req?.actualUser?.rol_id !== 1) user_id = req?.actualUser?.id;
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
        ms.*
    FROM main_sends ms
    ${whereClause}
    ${paginationClause}`;
    // Agregar parámetros de paginación
    const finalParams = [...params, ...paginationParams];

    // Query de conteo
    const countQuery = `SELECT COUNT(DISTINCT ms.id) as total
    FROM main_sends ms
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
    const saveData = {
        ...data,
        unique_id: Date.now(),
        user_id: req.actualUser?.id ?? null,
        state: 1,
        create_datetime: moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss'),
        units: 1,
    };
    const insertQuery = `INSERT INTO main_sends (
        unique_id,
        reference, 
        address, 
        width, 
        height, 
        length, 
        user_id, 
        state, 
        create_datetime, 
        units
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertParams = [
        saveData.unique_id,
        saveData.reference,
        saveData.address,
        saveData.width,
        saveData.height,
        saveData.length,
        saveData.user_id,
        saveData.state,
        saveData.create_datetime,
        saveData.units,
    ];

    const [result] = await db.execute<RowDataPacket[]>(insertQuery, insertParams);

    const newSendId = (result as any).insertId;
    const newSendData = {
        id: newSendId,
        ...saveData,
    };

    // Enviar notificación por socket a todos los usuarios conectados
    socketManager.emitToUser(req.actualUser?.email || '', 'new-send-notification', {
        message: 'new-send-notification',
        unique_id: newSendData.unique_id,
        username: req.actualUser?.name || 'Usuario',
        timestamp: new Date().toISOString(),
        createdBy: req.actualUser?.name || 'Usuario',
    });

    res.json({
        code: 200,
        text: 'send-created',
    });
    return;
});

Sends.put('/update/:id', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    const sendId = parseInt(req.params.id);
    if (isNaN(sendId) || sendId <= 0) {
        res.json({
            code: 400,
            text: 'invalid-send-id',
        });
        return;
    }
    const { isError, error, data } = validateData<ISendUpdateBody>(updateSendSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }
    const checkQuery = `SELECT * FROM main_sends WHERE id = ?`;
    const [existingRows] = await db.execute<RowDataPacket[]>(checkQuery, [sendId]);

    if (existingRows.length === 0) {
        res.json({
            code: 404,
            text: 'send-not-found',
        });
        return;
    }
    const existingSend = existingRows[0];
    if (req.actualUser?.rol_id !== 1 && existingSend.user_id !== req.actualUser?.id) {
        res.json({
            code: 403,
            text: 'insufficient-permissions',
        });
        return;
    }
    const fieldsToUpdate: string[] = [];
    const updateParams: any[] = [];
    const currentTimestamp = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
    const simpleFields = ['reference', 'address', 'width', 'height', 'length', 'units', 'route_id', 'driver_id'];
    simpleFields.forEach((field) => {
        if (data[field as keyof ISendUpdateBody] !== undefined) {
            fieldsToUpdate.push(`${field} = ?`);
            updateParams.push(data[field as keyof ISendUpdateBody]);
        }
    });
    if (data.state !== undefined) {
        fieldsToUpdate.push('state = ?');
        updateParams.push(data.state);
        const stateTimestamps: Record<number, string> = {
            2: 'transit_datetime', // En tránsito
            3: 'deliver_datetime', // Entregado
            // Estado 4 (cancelado) no tiene timestamp específico en la BD
        };

        if (stateTimestamps[data.state]) {
            fieldsToUpdate.push(`${stateTimestamps[data.state]} = ?`);
            updateParams.push(currentTimestamp);
        }
    }
    if (fieldsToUpdate.length === 0) {
        res.json({
            code: 400,
            text: 'no-fields-to-update',
        });
        return;
    }
    updateParams.push(sendId);
    const updateQuery = `UPDATE main_sends SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);
    const [updatedRows] = await db.execute<RowDataPacket[]>(checkQuery, [sendId]);
    const updatedSend = updatedRows[0];
    // Enviar notificación por socket
    const notificationData = {
        message: 'send-updated-notification',
        unique_id: updatedSend.unique_id,
        newState: data.state,
        username: req.actualUser?.name || 'Usuario',
        timestamp: new Date().toISOString(),
    };
    socketManager.emitToUser(req.actualUser?.email || '', 'send-updated-notification', notificationData);
    res.json({
        code: 200,
        data: updatedSend,
        text: 'send-updated',
    });
    return;
});
