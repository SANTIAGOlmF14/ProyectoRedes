import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listGenres, createGenre, deleteGenre, createGame, updateGame, deleteGame } from '../controllers/admin.controller.js';
import { pool } from '../utils/db.js';

const r = Router();
r.use(requireAuth, requireAdmin);

// ---- Géneros
r.get('/admin/genres',  listGenres);
r.post('/admin/genres', createGenre);
r.delete('/admin/genres/:id', deleteGenre);

// ---- Juegos (CRUD)
r.post('/admin/games',  createGame);
r.put('/admin/games/:idOrCode', updateGame);
r.delete('/admin/games/:idOrCode', deleteGame);

// ---- Imágenes de juego (subir/borrar)
// guardamos en: src/upload/<GAME_CODE>/<archivo>
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const key = req.params.idOrCode;
    const [[g]] = await pool.query('SELECT id, game_code FROM games WHERE id=? OR game_code=? LIMIT 1',[key,key]);
    if (!g) return cb(new Error('Juego no existe'));
    const dir = path.join(__dirname, '..', 'upload', g.game_code);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, file.originalname.replace(/\s+/g,'_')),
});
const upload = multer({ storage });

r.post('/admin/games/:idOrCode/images', upload.array('files', 12), async (req,res)=>{
  const key = req.params.idOrCode;
  const [[g]] = await pool.query('SELECT id, game_code, hero_image FROM games WHERE id=? OR game_code=? LIMIT 1',[key,key]);
  if (!g) return res.status(404).json({error:'No existe'});

  const saved = [];
  for (const f of req.files || []) {
    const url = `/uploads/${g.game_code}/${f.filename}`;
    await pool.query('INSERT INTO game_images (game_id,image_url) VALUES (?,?)',[g.id, url]);
    saved.push(url);
  }

  // si viene un archivo "portada"/"cover"/"hero", úsalo; sino, si no hay hero_image, pon el primero subido
  const pick = saved.find(u => /portada|cover|hero/i.test(u)) || (g.hero_image ? null : saved[0]);
  if (pick) {
    await pool.query('UPDATE games SET hero_image=? WHERE id=?',[pick, g.id]);
  }

  res.json({ ok:true, images: saved });
});

r.delete('/admin/games/:idOrCode/images/:file', async (req,res)=>{
  const key = req.params.idOrCode;
  const file = path.basename(req.params.file);
  const [[g]] = await pool.query('SELECT id, game_code FROM games WHERE id=? OR game_code=? LIMIT 1',[key,key]);
  if (!g) return res.status(404).json({error:'No existe'});
  const abs = path.join(__dirname, '..', 'upload', g.game_code, file);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
  await pool.query('DELETE FROM game_images WHERE game_id=? AND image_url=?',[g.id, `/uploads/${g.game_code}/${file}`]);
  res.json({ ok:true });
});

export default r;
