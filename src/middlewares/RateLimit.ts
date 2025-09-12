import rateLimit from 'express-rate-limit';
import { NODE_ENV } from '@util';
import { Logger } from '@lib';

// Rate limiter general para todas las rutas
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: NODE_ENV === 'development' || NODE_ENV === 'testing' ? 1000 : 100, // Más permisivo en dev/test
    message: {
        code: 429,
        text: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Custom response para mantener consistencia con tu API
    handler: (req, res) => {
        Logger.rateLimit(req.ip || 'unknown', req.url, 'general', {
            userAgent: req.get('User-Agent'),
        });
        res.status(200).json({
            code: 429,
            text: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
        });
    },
});

// Rate limiter estricto para rutas de autenticación
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: NODE_ENV === 'development' || NODE_ENV === 'testing' ? 100 : 5, // Solo 5 intentos en prod
    message: {
        code: 429,
        text: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Aplicar solo a requests que fallan
    skipSuccessfulRequests: true,
    // Custom response
    handler: (req, res) => {
        Logger.rateLimit(req.ip || 'unknown', req.url, 'auth', {
            userAgent: req.get('User-Agent'),
        });
        res.status(200).json({
            code: 429,
            text: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
        });
    },
});

// Rate limiter para operaciones que modifican datos
export const modifyDataRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: NODE_ENV === 'development' || NODE_ENV === 'testing' ? 100 : 10, // 10 operaciones por minuto en prod
    message: {
        code: 429,
        text: 'Demasiadas operaciones. Intenta de nuevo en 1 minuto.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        Logger.rateLimit(req.ip || 'unknown', req.url, 'modify_data', {
            userAgent: req.get('User-Agent'),
        });
        res.status(200).json({
            code: 429,
            text: 'Demasiadas operaciones. Intenta de nuevo en 1 minuto.',
        });
    },
});
