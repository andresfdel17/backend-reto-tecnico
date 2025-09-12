import mysql from 'mysql2/promise';
import { DB_HOST, DB_NAME, DB_PASS, DB_USER, DB_PORT } from '@util';

export const db = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: parseInt(DB_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
