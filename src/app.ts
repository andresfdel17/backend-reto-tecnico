import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { app } from './Application';
import { Logger, SocketManager } from '@lib';
import { NODE_ENV, VERSION } from '@util';

const port = app.get('port');
const server = createServer(app);

// Inicializar Socket.io
const socketManager = new SocketManager(server);

server.listen(port, () => {
    Logger.info('Server started successfully', {
        port,
        environment: NODE_ENV,
        version: VERSION,
        timestamp: new Date().toISOString(),
        features: {
            cors: 'configured',
            compression: 'enabled',
            rateLimit: 'enabled',
            securityHeaders: 'enabled',
            logging: 'enabled',
            socketIO: 'enabled',
        },
    });

    // Keep console log for immediate feedback in development
    if (NODE_ENV === 'development' || NODE_ENV === 'testing') {
        console.log(`🚀 Server running on port ${port}`);
        console.log('🛡️  Security features: CORS, Compression, Rate Limiting, Security Headers');
        console.log('🔌 Socket.IO enabled for real-time communication');
    }
});

// Exportar socketManager para uso en otros módulos si es necesario
export { socketManager };
