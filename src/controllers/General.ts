import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
export const General = Router();
//-- Importar tablas de conexion de bd
import { db } from '@database';
import { IRouteWithVehicle } from '@types';
import { RowDataPacket } from 'mysql2';

General.get('/', (_req: Request, res: Response) => {
    res.json({
        code: 200,
        message: 'General controller Ready!',
    });
    return;
});

General.get('/routes', [getUserData, modifyDataRateLimit], async (_req: Request, res: Response) => {
    // Query principal con LEFT JOIN y JSON_OBJECT para crear el vehicle directamente
    const mainQuery = `
        SELECT 
            r.id,
            r.code,
            r.desc_route,
            r.vehicle_id,
            CASE 
                WHEN r.vehicle_id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', v.id,
                        'code', v.code,
                        'brand', v.brand,
                        'capacity', v.capacity
                    )
                ELSE NULL
            END as vehicle
        FROM main_routes r
        LEFT JOIN main_vehicles v ON r.vehicle_id = v.id
        ORDER BY r.id ASC
    `;

    // Ejecutar consulta
    const [rows] = await db.execute<RowDataPacket[]>(mainQuery);

    // Los resultados ya vienen con el formato deseado
    const routesWithVehicles: IRouteWithVehicle[] = rows.map((row) => ({
        id: row.id,
        code: row.code,
        desc_route: row.desc_route,
        vehicle_id: row.vehicle_id,
        vehicle: row.vehicle ?? null,
    }));

    res.json({
        code: 200,
        data: routesWithVehicles,
        message: 'routes-with-vehicles',
    });
    return;
});
