import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();

import { app } from './Application';
import { Logger } from '@lib';
import { NODE_ENV, VERSION } from '@util';

const port = app.get('port');
app.listen(port, () => {
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
        },
    });

    // Keep console log for immediate feedback in development
    if (NODE_ENV === 'development' || NODE_ENV === 'testing') {
        console.log(`🚀 Server running on port ${port}`);
        console.log('🛡️  Security features: CORS, Compression, Rate Limiting, Security Headers');
    }
});
