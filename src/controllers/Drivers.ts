import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
import { db } from '@database';
import { IDriver } from '@types';
import { createDriverSchema } from '@schemas';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { validateData } from '@util';

export const Drivers = Router();

// Endpoint de prueba
Drivers.get('/', (_req: Request, res: Response) => {
    res.json({
        code: 200,
        message: 'Drivers controller Ready!',
    });
    return;
});

Drivers.get('/drivers', [getUserData, modifyDataRateLimit], async (_req: Request, res: Response) => {
    // Query para obtener todos los conductores
    const driversQuery = `
            SELECT 
                id,
                cifnif,
                name
            FROM main_drivers
            ORDER BY name ASC
        `;

    // Ejecutar consulta
    const [rows] = await db.execute<RowDataPacket[]>(driversQuery);

    // Mapear resultados al tipo IDriver
    const drivers: IDriver[] = rows.map((row) => ({
        id: row.id,
        cifnif: row.cifnif,
        name: row.name,
    }));

    res.json({
        code: 200,
        data: drivers,
        text: 'drivers-retrieved',
    });
    return;
});

Drivers.post('/create', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    // Validar datos de entrada
    const { isError, error, data } = validateData(createDriverSchema, req.body);
    if (isError || !data) {
        res.json({
            code: 400,
            text: error,
        });
        return;
    }

    const { cifnif, name } = data;

    // Verificar si ya existe un conductor con el mismo CIFNIF
    const checkExistingQuery = `SELECT id FROM main_drivers WHERE cifnif = ?`;
    const [existingRows] = await db.execute<RowDataPacket[]>(checkExistingQuery, [cifnif]);

    if (existingRows.length > 0) {
        res.json({
            code: 409,
            text: 'existing-driver',
        });
        return;
    }

    // Insertar nuevo conductor
    const insertQuery = `
            INSERT INTO main_drivers (cifnif, name)
            VALUES (?, ?)
        `;

    const [result] = await db.execute<ResultSetHeader>(insertQuery, [cifnif, name]);

    // Obtener el conductor recién creado
    const getNewDriverQuery = `
            SELECT id, cifnif, name 
            FROM main_drivers 
            WHERE id = ?
        `;

    const [newDriverRows] = await db.execute<RowDataPacket[]>(getNewDriverQuery, [result.insertId]);

    if (newDriverRows.length === 0) {
        res.json({
            code: 500,
            text: 'error-retrieving-created-driver',
        });
        return;
    }

    const newDriver: IDriver = {
        id: newDriverRows[0].id,
        cifnif: newDriverRows[0].cifnif,
        name: newDriverRows[0].name,
    };

    res.json({
        code: 201,
        data: newDriver,
        text: 'driver-created',
    });
    return;
});
