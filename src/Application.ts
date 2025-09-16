/* eslint-disable quotes */
import 'reflect-metadata';
import 'module-alias/register';
import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors, { CorsOptions } from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import path from 'node:path';
import { PORT, NODE_ENV, FRONT_DOMAIN } from '@util';
import { errorHandler, generalRateLimit } from '@middlewares';
import { Logger } from '@lib';
import { General, Login, Notifications, Sends, Users, Drivers, Home } from '@controllers';
import { setupSwagger } from './swagger';

export const app = express();

const developmentCSP = {
    directives: {
        defaultSrc: ["'self'", 'localhost:*', '127.0.0.1:*', '*.localhost:*'],
        styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'localhost:*',
            '127.0.0.1:*',
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com',
            'https://unpkg.com',
        ],
        fontSrc: ["'self'", 'localhost:*', '127.0.0.1:*', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'localhost:*', '127.0.0.1:*', 'https://unpkg.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'localhost:*', '127.0.0.1:*', 'https:'],
        connectSrc: [
            "'self'",
            'localhost:*',
            '127.0.0.1:*',
            'ws://localhost:*',
            'ws://127.0.0.1:*',
            'wss://localhost:*',
            FRONT_DOMAIN,
        ],
        frameSrc: ["'self'", 'localhost:*', '127.0.0.1:*'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", 'localhost:*', '127.0.0.1:*'],
        manifestSrc: ["'self'", 'localhost:*', '127.0.0.1:*'],
    },
};

const productionCSP = {
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", FRONT_DOMAIN],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        manifestSrc: ["'self'"],
    },
};

const isDevelopment = NODE_ENV === 'development' || NODE_ENV === 'testing';

const productionHSTS = {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
};

app.use(
    helmet({
        contentSecurityPolicy: isDevelopment ? developmentCSP : productionCSP,
        crossOriginEmbedderPolicy: false, // Puede interferir con CORS
        hsts: NODE_ENV === 'production' ? productionHSTS : false,
        frameguard: { action: 'deny' },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'same-origin' },
        hidePoweredBy: true,
    }),
);

app.use(
    compression({
        threshold: 1024,
        // Compression level: 1 (fastest) to 9 (best compression)
        level: 6, // Good balance between speed and compression
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
    }),
);

const getAllowedOrigins = (): string | string[] => {
    if (NODE_ENV === 'development' || NODE_ENV === 'testing') {
        return '*'; // Allow all origins in development and testing
    }
    return [FRONT_DOMAIN];
};

const corsConfig: CorsOptions = {
    origin: getAllowedOrigins(),
    credentials: true,
};
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
app.use(generalRateLimit);
if (NODE_ENV === 'development' || NODE_ENV === 'testing') {
    app.use((req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            const contentLength = Buffer.byteLength(data);
            const contentEncoding = res.get('content-encoding');

            // Log compression info
            if (contentLength > 1024 && contentEncoding === 'gzip') {
                Logger.debug('Response compressed', {
                    method: req.method,
                    url: req.url,
                    originalSize: `${(contentLength / 1024).toFixed(2)}KB`,
                    compressed: true,
                });
            }

            if (Math.random() < 0.1) {
                const securityHeaders = {
                    'x-content-type-options': res.get('x-content-type-options'),
                    'x-frame-options': res.get('x-frame-options'),
                    'x-xss-protection': res.get('x-xss-protection'),
                    'strict-transport-security': res.get('strict-transport-security'),
                    'referrer-policy': res.get('referrer-policy'),
                };

                Logger.debug('Security headers applied', {
                    method: req.method,
                    url: req.url,
                    headers: securityHeaders,
                });
            }

            return originalSend.call(this, data);
        };
        next();
    });
}
app.set('port', PORT || 3000);
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/img', express.static(path.join(__dirname, './uploads')));

//Controladores
const route = (controller: string) => `/api/${controller}`;
app.use(route('login'), Login);
app.use(route('notifications'), Notifications);
app.use(route('sends'), Sends);
app.use(route('users'), Users);
app.use(route('general'), General);
app.use(route('drivers'), Drivers);
app.use(route('home'), Home);

app.get('/api/', (_req, res) => {
    res.json({
        code: 200,
        message: 'API Ready!',
    });
    return;
});

// Configurar Swagger (disponible en todos los entornos)
setupSwagger(app);

//Manejo de errores - DEBE IR AL FINAL
app.use(errorHandler);
