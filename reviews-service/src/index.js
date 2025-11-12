import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewsRoutes from './routes/reviews.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// prefijo API
app.use('/api', reviewsRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Reviews service listening on ${PORT}`));

