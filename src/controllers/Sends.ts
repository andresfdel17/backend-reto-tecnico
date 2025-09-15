import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
export const Sends = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { validateData } from '@util';
import { createSendSchema, getSendsFilteredSchema, updateSendSchema } from '@schemas';
import { ISendCreateBody, ISendGetFilteredBody, ISendUpdateBody } from '@types';
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
    const { isError, error, data } = validateData<ISendGetFilteredBody>(getSendsFilteredSchema, req.body);
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
    const { isError, error, data } = validateData<ISendCreateBody>(createSendSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }
    // VALIDACIONES DE NEGOCIO PARA CREACIÓN

    // Validar capacidad del vehículo si se está asignando una ruta
    if (data.route_id !== undefined && data.route_id !== null) {
        const vehicleQuery = `
            SELECT v.capacity, v.brand, v.code
            FROM main_routes r
            LEFT JOIN main_vehicles v ON r.vehicle_id = v.id
            WHERE r.id = ?
        `;
        const [vehicleRows] = await db.execute<RowDataPacket[]>(vehicleQuery, [data.route_id]);

        if (vehicleRows.length === 0) {
            res.json({
                code: 400,
                text: 'route-not-found',
            });
            return;
        }

        const vehicle = vehicleRows[0];
        if (!vehicle.capacity) {
            res.json({
                code: 400,
                text: 'route-has-no-vehicle-assigned',
            });
            return;
        }

        // Verificar capacidad vs unidades del envío (por defecto 1)
        const sendUnits = data.units || 1;
        if (sendUnits > vehicle.capacity) {
            res.json({
                code: 400,
                text: 'vehicle-capacity-exceeded',
                data: {
                    vehicleCapacity: vehicle.capacity,
                    sendUnits: sendUnits,
                    vehicleBrand: vehicle.brand,
                    vehicleCode: vehicle.code,
                },
            });
            return;
        }
    }

    // Validar disponibilidad del conductor si se está asignando
    if (data.driver_id !== undefined && data.driver_id !== null) {
        const driverAvailabilityQuery = `
            SELECT ms.id, ms.unique_id, ms.reference, d.name as driver_name
            FROM main_sends ms
            JOIN main_drivers d ON ms.driver_id = d.id
            WHERE ms.driver_id = ? 
            AND ms.state IN (1, 2)
        `;
        const [driverRows] = await db.execute<RowDataPacket[]>(driverAvailabilityQuery, [data.driver_id]);

        if (driverRows.length > 0) {
            const conflictingSend = driverRows[0];
            res.json({
                code: 400,
                text: 'driver-not-available',
                data: {
                    driverName: conflictingSend.driver_name,
                    conflictingSendId: conflictingSend.unique_id,
                    conflictingSendReference: conflictingSend.reference,
                },
            });
            return;
        }

        // Verificar que el conductor existe
        const driverExistsQuery = `SELECT id, name FROM main_drivers WHERE id = ?`;
        const [driverExistsRows] = await db.execute<RowDataPacket[]>(driverExistsQuery, [data.driver_id]);

        if (driverExistsRows.length === 0) {
            res.json({
                code: 400,
                text: 'driver-not-found',
            });
            return;
        }
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

    // Enviar notificación por socket al usuario propietario del envío
    if (req.actualUser?.email) {
        socketManager.emitToUser(req.actualUser.email, 'new-send-notification', {
            message: 'new-send-notification',
            unique_id: newSendData.unique_id,
            username: req.actualUser.name || 'Usuario',
            timestamp: new Date().toISOString(),
            createdBy: req.actualUser.name || 'Usuario',
        });
    }

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

    if (data.route_id !== undefined && data.route_id !== null) {
        const vehicleQuery = `
            SELECT v.capacity, v.brand, v.code
            FROM main_routes r
            LEFT JOIN main_vehicles v ON r.vehicle_id = v.id
            WHERE r.id = ?
        `;
        const [vehicleRows] = await db.execute<RowDataPacket[]>(vehicleQuery, [data.route_id]);

        if (vehicleRows.length === 0) {
            res.json({
                code: 400,
                text: 'route-not-found',
            });
            return;
        }

        const vehicle = vehicleRows[0];
        if (!vehicle) {
            res.json({
                code: 400,
                text: 'route-has-no-vehicle-assigned',
            });
            return;
        }

        const sendUnits = data.units || existingSend.units || 1;
        if (sendUnits > vehicle.capacity) {
            res.json({
                code: 400,
                text: 'vehicle-capacity-exceeded',
                data: {
                    vehicleCapacity: vehicle.capacity,
                    sendUnits: sendUnits,
                    vehicleBrand: vehicle.brand,
                    vehicleCode: vehicle.code,
                },
            });
            return;
        }
    }

    // Validar disponibilidad del conductor si se está asignando
    if (data.driver_id !== undefined && data.driver_id !== null) {
        const driverAvailabilityQuery = `
            SELECT ms.id, ms.unique_id, ms.reference, d.name as driver_name
            FROM main_sends ms
            JOIN main_drivers d ON ms.driver_id = d.id
            WHERE ms.driver_id = ? 
            AND ms.id != ? 
            AND ms.state IN (1, 2)
        `;
        const [driverRows] = await db.execute<RowDataPacket[]>(driverAvailabilityQuery, [data.driver_id, sendId]);

        if (driverRows.length > 0) {
            const conflictingSend = driverRows[0];
            res.json({
                code: 400,
                text: 'driver-not-available',
                data: {
                    driverName: conflictingSend.driver_name,
                    conflictingSendId: conflictingSend.unique_id,
                    conflictingSendReference: conflictingSend.reference,
                },
            });
            return;
        }

        // Verificar que el conductor existe
        const driverExistsQuery = `SELECT id, name FROM main_drivers WHERE id = ?`;
        const [driverExistsRows] = await db.execute<RowDataPacket[]>(driverExistsQuery, [data.driver_id]);

        if (driverExistsRows.length === 0) {
            res.json({
                code: 400,
                text: 'driver-not-found',
            });
            return;
        }
    }
    const fieldsToUpdate: string[] = [];
    const updateParams: any[] = [];
    const currentTimestamp = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');

    const isAssigningDriverOrRoute =
        (data.driver_id !== undefined || data.route_id !== undefined) && existingSend.state === 1;
    let finalState = data.state;
    if (isAssigningDriverOrRoute && data.state === undefined) {
        finalState = 2; // Cambiar automáticamente a "en tránsito"
        fieldsToUpdate.push('state = ?');
        updateParams.push(finalState);
    }
    const simpleFields = ['reference', 'address', 'width', 'height', 'length', 'units', 'route_id', 'driver_id'];
    simpleFields.forEach((field) => {
        if (data[field as keyof ISendUpdateBody] !== undefined) {
            fieldsToUpdate.push(`${field} = ?`);
            updateParams.push(data[field as keyof ISendUpdateBody]);
        }
    });

    // Manejar el campo state si viene explícitamente
    if (data.state !== undefined) {
        fieldsToUpdate.push('state = ?');
        updateParams.push(data.state);
        finalState = data.state;
    }

    // Manejar timestamps automáticos según el estado final
    if (finalState !== undefined) {
        const stateTimestamps: Record<number, string> = {
            2: 'transit_datetime', // En tránsito
            3: 'deliver_datetime', // Entregado
            // Estado 4 (cancelado) no tiene timestamp específico en la BD
        };

        if (stateTimestamps[finalState]) {
            fieldsToUpdate.push(`${stateTimestamps[finalState]} = ?`);
            updateParams.push(currentTimestamp);
        }
    }

    // Verificar que hay al menos un campo para actualizar
    if (fieldsToUpdate.length === 0) {
        res.json({
            code: 400,
            text: 'no-fields-to-update',
        });
        return;
    }

    // Ejecutar actualización
    updateParams.push(sendId);
    const updateQuery = `UPDATE main_sends SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);

    // Obtener datos actualizados
    const [updatedRows] = await db.execute<RowDataPacket[]>(checkQuery, [sendId]);
    const updatedSend = updatedRows[0];

    // Obtener email del usuario propietario del envío
    const ownerQuery = `SELECT email, name FROM main_users WHERE id = ?`;
    const [ownerRows] = await db.execute<RowDataPacket[]>(ownerQuery, [updatedSend.user_id]);
    const ownerEmail = ownerRows.length > 0 ? ownerRows[0].email : '';
    const ownerName = ownerRows.length > 0 ? ownerRows[0].name : 'Usuario';

    // Enviar notificación al propietario del envío
    if (ownerEmail) {
        socketManager.emitToUser(ownerEmail, 'send-updated-notification', {
            newState: finalState,
            unique_id: updatedSend.unique_id,
            username: ownerName,
            updatedBy: req.actualUser?.name || 'Usuario',
            timestamp: new Date().toISOString(),
        });
    }

    res.json({
        code: 200,
        data: updatedSend,
        text: 'send-updated',
    });
    return;
});
