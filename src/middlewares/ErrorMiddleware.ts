import { APP_DEBUG, NODE_ENV } from '@util';
import { ErrorRequestHandler } from 'express';
import { Logger } from '@lib';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    // Log the error with context
    Logger.error('Unhandled application error', {
        error: err.message,
        code: err.code,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });

    // Debug console log in development/test
    if (APP_DEBUG || NODE_ENV === 'development') {
        console.error({ err });
    }
    // Error genérico
    res.status(200).json({
        code: 500,
        text: 'server-error',
    });
};
