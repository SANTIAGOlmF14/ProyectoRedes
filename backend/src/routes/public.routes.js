import { Router } from 'express';
import { listGames, topGames, gameDetail, gameImages, commentsList, patchNotes, searchCodes } from '../controllers/games.controller.js';
import { pool } from '../utils/db.js';

const r = Router();

// Juegos
r.get('/games', listGames);
r.get('/games/top', topGames);
r.get('/games/search-codes', searchCodes);
r.get('/games/:idOrCode', gameDetail);
r.get('/games/:idOrCode/images', gameImages);
r.get('/games/:idOrCode/comments', commentsList);
r.get('/games/:idOrCode/patchnotes', patchNotes);

// Géneros (público)
r.get('/genres', async (_req,res) => {
  const [rows] = await pool.query('SELECT id,name FROM genres ORDER BY name');
  res.json(rows);
});

export default r;
