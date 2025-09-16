import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
import { db } from '@database';
import { ISend } from '@types';
import { RowDataPacket } from 'mysql2';

export const Home = Router();

// Endpoint de prueba
Home.get('/', (_req: Request, res: Response) => {
    res.json({
        code: 200,
        message: 'Home controller Ready!',
    });
    return;
});

// GET /home/tracking/:unique_id? - Endpoint de tracking
Home.get('/tracking/:unique_id?', async (req: Request, res: Response) => {
    try {
        const { unique_id } = req.params;

        // Si hay unique_id, buscar ese envío específico (público)
        if (unique_id) {
            const trackingQuery = `
                SELECT 
                    id,
                    user_id,
                    unique_id,
                    route_id,
                    driver_id,
                    reference,
                    address,
                    units,
                    state,
                    create_datetime,
                    transit_datetime,
                    deliver_datetime,
                    width,
                    height,
                    length
                FROM main_sends 
                WHERE unique_id = ?
            `;

            const [rows] = await db.execute<RowDataPacket[]>(trackingQuery, [unique_id]);

            if (rows.length === 0) {
                res.json({
                    code: 404,
                    message: 'tracking-not-found',
                });
                return;
            }

            const send: ISend = {
                id: rows[0].id,
                user_id: rows[0].user_id,
                unique_id: rows[0].unique_id,
                route_id: rows[0].route_id,
                driver_id: rows[0].driver_id,
                reference: rows[0].reference,
                address: rows[0].address,
                units: rows[0].units,
                state: rows[0].state,
                create_datetime: rows[0].create_datetime,
                transit_datetime: rows[0].transit_datetime,
                deliver_datetime: rows[0].deliver_datetime,
                width: rows[0].width,
                height: rows[0].height,
                length: rows[0].length,
            };

            res.json({
                code: 200,
                data: send,
                message: 'tracking-found',
            });
            return;
        }

        // Si no hay unique_id, requiere autenticación para obtener lista
        const { headers } = req;
        const [type, token] = headers?.authorization?.split(' ') ?? [];

        if (!type || type !== 'Bearer' || !token) {
            res.json({
                code: 401,
                message: 'authentication-required-for-list',
            });
            return;
        }

        // Validar token y obtener usuario
        const { JWTManager } = await import('@lib');
        const { JWT_SECRET } = await import('@util');

        const tokenData = JWTManager.decodeToken(token, JWT_SECRET);
        if (!tokenData) {
            res.json({
                code: 401,
                message: 'invalid-token',
            });
            return;
        }

        const { exp, data: user } = tokenData;
        if (!user || (exp ?? 0) < Date.now() / 1000) {
            res.json({
                code: 401,
                message: 'expired-token',
            });
            return;
        }

        // Construir query basado en rol del usuario
        let sendsQuery = `
            SELECT 
                id,
                user_id,
                unique_id,
                route_id,
                driver_id,
                reference,
                address,
                units,
                state,
                create_datetime,
                transit_datetime,
                deliver_datetime,
                width,
                height,
                length
            FROM main_sends
        `;

        const queryParams: any[] = [];

        // Si no es admin, filtrar solo sus envíos
        if (user?.rol_id !== 1) {
            sendsQuery += ' WHERE user_id = ?';
            queryParams.push(user?.id);
        }

        sendsQuery += ' ORDER BY create_datetime DESC';

        const [sendsRows] = await db.execute<RowDataPacket[]>(sendsQuery, queryParams);

        const sends: ISend[] = sendsRows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            unique_id: row.unique_id,
            route_id: row.route_id,
            driver_id: row.driver_id,
            reference: row.reference,
            address: row.address,
            units: row.units,
            state: row.state,
            create_datetime: row.create_datetime,
            transit_datetime: row.transit_datetime,
            deliver_datetime: row.deliver_datetime,
            width: row.width,
            height: row.height,
            length: row.length,
        }));

        res.json({
            code: 200,
            data: sends,
            message: 'sends-retrieved',
        });
        return;
    } catch (error) {
        console.error('Error in tracking endpoint:', error);
        res.json({
            code: 500,
            message: 'internal-server-error',
        });
        return;
    }
});

// GET /home/tracking-auth/:unique_id - Endpoint de tracking autenticado (para validar autoría)
Home.get('/tracking-auth/:unique_id', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    try {
        const { unique_id } = req.params;
        const user = req.actualUser;

        const trackingQuery = `
            SELECT 
                id,
                user_id,
                unique_id,
                route_id,
                driver_id,
                reference,
                address,
                units,
                state,
                create_datetime,
                transit_datetime,
                deliver_datetime,
                width,
                height,
                length
            FROM main_sends 
            WHERE unique_id = ?
        `;

        const [rows] = await db.execute<RowDataPacket[]>(trackingQuery, [unique_id]);

        if (rows.length === 0) {
            res.json({
                code: 404,
                message: 'tracking-not-found',
            });
            return;
        }

        const send = rows[0];

        // Si no es admin, validar que sea el propietario del envío
        if (user?.rol_id !== 1 && send.user_id !== user?.id) {
            res.json({
                code: 403,
                message: 'tracking-access-denied',
            });
            return;
        }

        const sendData: ISend = {
            id: send.id,
            user_id: send.user_id,
            unique_id: send.unique_id,
            route_id: send.route_id,
            driver_id: send.driver_id,
            reference: send.reference,
            address: send.address,
            units: send.units,
            state: send.state,
            create_datetime: send.create_datetime,
            transit_datetime: send.transit_datetime,
            deliver_datetime: send.deliver_datetime,
            width: send.width,
            height: send.height,
            length: send.length,
        };

        res.json({
            code: 200,
            data: sendData,
            message: 'tracking-found',
        });
        return;
    } catch (error) {
        console.error('Error in authenticated tracking endpoint:', error);
        res.json({
            code: 500,
            message: 'internal-server-error',
        });
        return;
    }
});
