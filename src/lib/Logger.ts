import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { NODE_ENV, LOG_LEVEL, LOG_TO_FILE, LOG_DIRECTORY, LOG_MAX_SIZE, LOG_MAX_FILES } from '@util';

// Custom format for development (colorful and readable)
const developmentFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    }),
);

// Custom format for production (JSON structured)
const productionFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

// Create transports array
const transports: winston.transport[] = [];

// Always add console transport
transports.push(
    new winston.transports.Console({
        format: NODE_ENV === 'development' ? developmentFormat : productionFormat,
        level: LOG_LEVEL,
    }),
);

// Add file transports only if enabled
if (LOG_TO_FILE && NODE_ENV !== 'development') {
    // General application log
    transports.push(
        new DailyRotateFile({
            filename: path.join(LOG_DIRECTORY, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: LOG_MAX_SIZE,
            maxFiles: LOG_MAX_FILES,
            level: 'info',
            format: productionFormat,
            zippedArchive: true,
        }),
    );

    // Error log (only errors)
    transports.push(
        new DailyRotateFile({
            filename: path.join(LOG_DIRECTORY, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: LOG_MAX_SIZE,
            maxFiles: LOG_MAX_FILES,
            level: 'error',
            format: productionFormat,
            zippedArchive: true,
        }),
    );

    // Authentication events log
    transports.push(
        new DailyRotateFile({
            filename: path.join(LOG_DIRECTORY, 'auth-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: LOG_MAX_SIZE,
            maxFiles: LOG_MAX_FILES,
            level: 'info',
            format: productionFormat,
            zippedArchive: true,
        }),
    );
}

// Create winston logger instance
const winstonLogger = winston.createLogger({
    level: LOG_LEVEL,
    transports,
    exceptionHandlers: [
        new winston.transports.Console({
            format: developmentFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.Console({
            format: developmentFormat,
        }),
    ],
});

// Logger class with static methods for easy usage
export class Logger {
    /**
     * Log error level messages
     */
    static error(message: string, meta?: any): void {
        winstonLogger.error(message, meta);
    }

    /**
     * Log warning level messages
     */
    static warn(message: string, meta?: any): void {
        winstonLogger.warn(message, meta);
    }

    /**
     * Log info level messages
     */
    static info(message: string, meta?: any): void {
        winstonLogger.info(message, meta);
    }

    /**
     * Log debug level messages (only in development)
     */
    static debug(message: string, meta?: any): void {
        winstonLogger.debug(message, meta);
    }

    /**
     * Log authentication events
     */
    static auth(action: string, identifier: string, success: boolean, meta?: any): void {
        const logData = {
            action,
            identifier,
            success,
            timestamp: new Date().toISOString(),
            ...meta,
        };

        if (success) {
            winstonLogger.info(`Auth: ${action} successful`, logData);
        } else {
            winstonLogger.warn(`Auth: ${action} failed`, logData);
        }
    }

    /**
     * Log API requests and responses
     */
    static api(method: string, route: string, statusCode: number, meta?: any): void {
        const logData = {
            method,
            route,
            statusCode,
            timestamp: new Date().toISOString(),
            ...meta,
        };

        if (statusCode >= 500) {
            winstonLogger.error(`API: ${method} ${route}`, logData);
        } else if (statusCode >= 400) {
            winstonLogger.warn(`API: ${method} ${route}`, logData);
        } else {
            winstonLogger.info(`API: ${method} ${route}`, logData);
        }
    }

    /**
     * Log database operations
     */
    static database(operation: string, duration: number, error?: any, meta?: any): void {
        const logData = {
            operation,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            ...meta,
        };

        if (error) {
            winstonLogger.error(`DB: ${operation} failed`, { ...logData, error: error.message });
        } else {
            winstonLogger.debug(`DB: ${operation}`, logData);
        }
    }

    /**
     * Log rate limiting events
     */
    static rateLimit(ip: string, route: string, limitType: string, meta?: any): void {
        const logData = {
            ip,
            route,
            limitType,
            timestamp: new Date().toISOString(),
            ...meta,
        };

        winstonLogger.warn(`Rate limit exceeded`, logData);
    }

    /**
     * Get the underlying winston logger instance if needed
     */
    static getWinstonInstance(): winston.Logger {
        return winstonLogger;
    }
}
