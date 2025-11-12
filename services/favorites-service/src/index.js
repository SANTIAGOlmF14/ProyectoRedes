import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import favoritesRoutes from './routes/favorites.routes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', favoritesRoutes);

app.use((_, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Favorites Service en puerto ${PORT}`));
