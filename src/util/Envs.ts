export const NODE_ENV = process.env.NODE_ENV?.toLowerCase() ?? 'development';
export const APP_NAME = process.env.APP_NAME ?? 'NodeJS API';
export const VERSION = process.env.npm_package_version ?? 'N/A';
export const PACKAGE_NAME = process.env.npm_package_name ?? 'N/A';
export const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
export const PORT = process.env.PORT ?? '3000';
export const FRONT_DOMAIN = process.env.FRONT_DOMAIN ?? 'http://localhost:3001';
//Base de datos
export const DB_HOST = process.env.DB_HOST ?? 'localhost';
export const DB_PORT = process.env.DB_PORT ?? '3306';
export const DB_USER = process.env.DB_USER ?? '';
export const DB_PASS = process.env.DB_PASS ?? '';
export const DB_NAME = process.env.DB_NAME ?? 'reto_tecnico';

//Logging
export const LOG_LEVEL = process.env.LOG_LEVEL ?? (NODE_ENV === 'development' ? 'debug' : 'info');
export const LOG_TO_FILE = (process.env.LOG_TO_FILE ?? 'true') === 'true';
export const LOG_DIRECTORY = process.env.LOG_DIRECTORY ?? './logs';
export const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE ?? '20m';
export const LOG_MAX_FILES = process.env.LOG_MAX_FILES ?? '14d';
//--
export const APP_DEBUG = (process.env.APP_DEBUG ?? false) === 'true';
export const JWT_SECRET = process.env.JWT_SECRET ?? '';
