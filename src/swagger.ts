import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { swaggerConfig } from './docs';

export const setupSwagger = (app: Express): void => {
    // Swagger UI
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerConfig.document, {
            explorer: true,
            customCss: `
            .swagger-ui .topbar { display: none }
            .swagger-ui .info .title { color: #3b82f6 }
            .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 5px; }
            .swagger-ui .info { margin: 20px 0; }
            .swagger-ui .info .description { margin: 10px 0; }
            .swagger-ui .info .description h1 { color: #1a202c; }
            .swagger-ui .info .description h2 { color: #2d3748; margin-top: 20px; }
        `,
            customSiteTitle: 'API Docs - Reto Técnico',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                docExpansion: 'list',
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
                operationsSorter: 'alpha',
                tagsSorter: 'alpha',
            },
        }),
    );

    // Swagger JSON endpoint
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerConfig.document);
    });

    console.log('📚 Swagger documentation available at: http://localhost:3000/api-docs');
    console.log('📄 Swagger JSON available at: http://localhost:3000/api-docs.json');
};

export default swaggerConfig;
