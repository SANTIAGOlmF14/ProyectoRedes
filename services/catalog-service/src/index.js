import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// estáticos para imágenes
app.use('/uploads', express.static(path.resolve('services/catalog-service/src/upload')));

// Swagger UI (opcional si existe el YAML)
try {
  const swaggerDoc = YAML.load(path.resolve('services/catalog-service/src/docs/openapi.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch { /* opcional */ }

// Prefijo del microservicio catálogo
app.use('/api/catalog', publicRoutes);
app.use('/api/catalog', adminRoutes);

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Catalog-service escuchando en puerto ${PORT}`);
});
