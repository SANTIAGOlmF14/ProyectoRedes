import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Servir /uploads (imágenes)
app.use('/uploads', express.static(path.resolve('src/upload')));

// Swagger (si no existe el yaml, omite la UI)
try {
  const swaggerDoc = YAML.load(path.resolve('src/docs/openapi.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch { /* opcional */ }

// Rutas API
app.use('/api', authRoutes);
app.use('/api', publicRoutes);
app.use('/api', userRoutes);
app.use('/api', adminRoutes);

// 404
app.use((req,res)=> res.status(404).json({error:'Not found'}));

app.listen(process.env.PORT || 3000, () => {
  console.log(`GamingCorner API en puerto ${process.env.PORT || 3000}`);
});
