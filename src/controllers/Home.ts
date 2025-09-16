import { Router, Request, Response } from 'express';
import { getUserData, modifyDataRateLimit } from '@middlewares';
import { db } from '@database';
import { ISend } from '@types';
import { RowDataPacket } from 'mysql2';
import moment from 'moment-timezone';

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

// GET /home/charts-data - Endpoint para obtener datos de gráficas
Home.get('/charts-data', [getUserData, modifyDataRateLimit], async (req: Request, res: Response) => {
    try {
        const user = req.actualUser;
        const { period = '7', user_id } = req.query; // Período en días y filtro de usuario
        const periodDays = parseInt(period as string) || 7;
        // Configurar timezone (ajustar según tu zona horaria)
        const timezone = 'America/Bogota'; // Cambia según tu ubicación

        // Calcular fechas usando moment-timezone
        const endDate = moment().tz(timezone).startOf('day');
        const startDate = moment(endDate).subtract(periodDays - 1, 'days');

        // Formatear fechas para MySQL
        const startDateStr = startDate.format('YYYY-MM-DD');
        const endDateStr = endDate.format('YYYY-MM-DD');

        // Query simplificada - obtener datos por estado y fecha correspondiente (como texto)
        let chartsQuery = `
            SELECT 
                DATE_FORMAT(create_datetime, '%Y-%m-%d') as date,
                1 as state,
                COUNT(*) as count
            FROM main_sends 
            WHERE state = 1 AND DATE(create_datetime) BETWEEN ? AND ?
            GROUP BY create_datetime
            
            UNION ALL
            
            SELECT 
                DATE_FORMAT(transit_datetime, '%Y-%m-%d') as date,
                2 as state,
                COUNT(*) as count
            FROM main_sends 
            WHERE state = 2 AND transit_datetime IS NOT NULL 
            AND DATE(transit_datetime) BETWEEN ? AND ?
            GROUP BY transit_datetime
            
            UNION ALL
            
            SELECT 
                DATE_FORMAT(deliver_datetime, '%Y-%m-%d') as date,
                3 as state,
                COUNT(*) as count
            FROM main_sends 
            WHERE state = 3 AND deliver_datetime IS NOT NULL 
            AND DATE(deliver_datetime) BETWEEN ? AND ?
            GROUP BY deliver_datetime
            
            UNION ALL
            
            SELECT 
                DATE_FORMAT(create_datetime, '%Y-%m-%d') as date,
                4 as state,
                COUNT(*) as count
            FROM main_sends 
            WHERE state = 4 AND DATE(create_datetime) BETWEEN ? AND ?
            GROUP BY create_datetime
        `;

        // Parámetros para las fechas (8 parámetros: startDate y endDate para cada estado)
        const queryParams: any[] = [
            startDateStr,
            endDateStr, // Para estado 1 (En espera)
            startDateStr,
            endDateStr, // Para estado 2 (En tránsito)
            startDateStr,
            endDateStr, // Para estado 3 (Entregado)
            startDateStr,
            endDateStr, // Para estado 4 (Cancelado)
        ];

        // Agregar filtrado por usuario a cada parte del UNION
        let userFilter = '';
        let userFilterParams: any[] = [];

        if (user?.rol_id !== 1) {
            // Usuario normal: solo sus envíos
            userFilter = ' AND user_id = ?';
            userFilterParams = [user?.id, user?.id, user?.id, user?.id];
        } else if (user_id) {
            // Admin con filtro específico de usuario
            const targetUserId = parseInt(user_id as string);
            if (targetUserId && !isNaN(targetUserId)) {
                userFilter = ' AND user_id = ?';
                userFilterParams = [targetUserId, targetUserId, targetUserId, targetUserId];
            }
        }

        // Aplicar filtro de usuario a cada parte del UNION si es necesario
        if (userFilter) {
            chartsQuery = chartsQuery.replace(/WHERE state = 1 AND/g, `WHERE state = 1 AND user_id = ? AND`);
            chartsQuery = chartsQuery.replace(/WHERE state = 2 AND/g, `WHERE state = 2 AND user_id = ? AND`);
            chartsQuery = chartsQuery.replace(/WHERE state = 3 AND/g, `WHERE state = 3 AND user_id = ? AND`);
            chartsQuery = chartsQuery.replace(/WHERE state = 4 AND/g, `WHERE state = 4 AND user_id = ? AND`);

            // Insertar parámetros de usuario en las posiciones correctas
            const finalParams: any[] = [];
            for (let i = 0; i < 4; i++) {
                if (userFilterParams.length > 0) {
                    finalParams.push(userFilterParams[i]);
                }
                finalParams.push(queryParams[i * 2]); // startDate
                finalParams.push(queryParams[i * 2 + 1]); // endDate
            }
            queryParams.splice(0, queryParams.length, ...finalParams);
        }

        chartsQuery += ' ORDER BY date ASC, state ASC';
        const [rows] = await db.execute<RowDataPacket[]>(chartsQuery, queryParams);
        // Crear array de fechas para el período usando moment
        const dates: string[] = [];
        const currentDate = moment(startDate);
        while (currentDate.isSameOrBefore(endDate, 'day')) {
            dates.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'day');
        }
        // Inicializar datos por estado
        const chartData = {
            labels: dates.map((date) => moment(date).format('YYYY-MM-DD')),
            datasets: [
                {
                    label: 'Creados',
                    data: dates.map(() => 0),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                },
                {
                    label: 'En Tránsito',
                    data: dates.map(() => 0),
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4,
                },
                {
                    label: 'Entregados',
                    data: dates.map(() => 0),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                },
                {
                    label: 'Cancelados',
                    data: dates.map(() => 0),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                },
            ],
        };

        // Llenar datos basados en los resultados de la consulta
        rows.forEach((row) => {
            const dateIndex = dates.indexOf(row.date);
            if (dateIndex !== -1) {
                const state = row.state;
                const count = row.count;

                // Mapear estados a índices de datasets
                switch (state) {
                    case 1: // En espera (Creados)
                        chartData.datasets[0].data[dateIndex] = count;
                        break;
                    case 2: // En tránsito
                        chartData.datasets[1].data[dateIndex] = count;
                        break;
                    case 3: // Entregados
                        chartData.datasets[2].data[dateIndex] = count;
                        break;
                    case 4: // Cancelados
                        chartData.datasets[3].data[dateIndex] = count;
                        break;
                }
            }
        });

        // Obtener estadísticas generales usando las fechas correspondientes a cada estado
        let statsQuery = `
            SELECT 
                state,
                COUNT(*) as total
            FROM main_sends
            WHERE (
                (state = 1 AND DATE(create_datetime) BETWEEN ? AND ?) OR
                (state = 2 AND transit_datetime IS NOT NULL AND DATE(transit_datetime) BETWEEN ? AND ?) OR
                (state = 3 AND deliver_datetime IS NOT NULL AND DATE(deliver_datetime) BETWEEN ? AND ?) OR
                (state = 4 AND DATE(create_datetime) BETWEEN ? AND ?)
            )
        `;

        const statsParams: any[] = [
            startDateStr,
            endDateStr, // Para estado 1 (En espera)
            startDateStr,
            endDateStr, // Para estado 2 (En tránsito)
            startDateStr,
            endDateStr, // Para estado 3 (Entregado)
            startDateStr,
            endDateStr, // Para estado 4 (Cancelado)
        ];

        // Aplicar el mismo filtrado de usuario que en la query principal
        if (user?.rol_id !== 1) {
            // Usuario normal: solo sus envíos
            statsQuery += ' AND user_id = ?';
            statsParams.push(user?.id);
        } else if (user_id) {
            // Admin con filtro específico de usuario
            const targetUserId = parseInt(user_id as string);
            if (targetUserId && !isNaN(targetUserId)) {
                statsQuery += ' AND user_id = ?';
                statsParams.push(targetUserId);
            }
        }

        statsQuery += ' GROUP BY state';

        const [statsRows] = await db.execute<RowDataPacket[]>(statsQuery, statsParams);

        const stats = {
            created: 0,
            inTransit: 0,
            delivered: 0,
            cancelled: 0,
            total: 0,
        };

        statsRows.forEach((row) => {
            const count = row.total;
            stats.total += count;

            switch (row.state) {
                case 1:
                    stats.created = count;
                    break;
                case 2:
                    stats.inTransit = count;
                    break;
                case 3:
                    stats.delivered = count;
                    break;
                case 4:
                    stats.cancelled = count;
                    break;
            }
        });
        res.json({
            code: 200,
            data: {
                chartData,
                stats,
                period: periodDays,
                dateRange: {
                    start: startDateStr,
                    end: endDateStr,
                },
                filters: {
                    user_id: user_id ? parseInt(user_id as string) : null,
                    isAdmin: user?.rol_id === 1,
                },
            },
            message: 'charts-data-retrieved',
        });
        return;
    } catch (error) {
        console.error('Error in charts-data endpoint:', error);
        res.json({
            code: 500,
            message: 'internal-server-error',
        });
        return;
    }
});
