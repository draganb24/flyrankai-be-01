import express from 'express';
import next from 'next';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import fs from 'node:fs';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = 'localhost';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const openapiPath = path.join(import.meta.dirname, 'openapi.json');
const swaggerDocument = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));

app.prepare().then(() => {
    const server = express();

    server.use(
        '/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customSiteTitle: 'Task API — Swagger UI'
        })
    );

    server.get('/openapi.json', (_req, res) => {
        res.json(swaggerDocument);
    });

    server.all(/.*/, (req, res) => handle(req, res));

    server.listen(port, () => {
        console.log(`> Ready on http://${ hostname }:${ port }`);
        console.log(`> Swagger UI at http://${ hostname }:${ port }/docs`);
    });
});
