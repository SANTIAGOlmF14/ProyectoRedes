// favorites-service/src/routes/favorites.routes.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addFavorite,
  removeFavorite,
  listFavorites
} from '../controllers/favorites.controller.js';

const r = Router();

// Todas las rutas de favoritos exigen usuario logueado
r.use(requireAuth);

r.post('/favorites/:idOrCode', addFavorite);
r.delete('/favorites/:idOrCode', removeFavorite);
r.get('/favorites', listFavorites);

export default r;
