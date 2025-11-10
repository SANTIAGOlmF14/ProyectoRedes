import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { commentCreate, putRating } from '../controllers/games.controller.js';

const r = Router();
r.post('/games/:idOrCode/comments', requireAuth, commentCreate);
r.put('/games/:idOrCode/rating',    requireAuth, putRating);
export default r;
