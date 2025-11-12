import { pool } from '../utils/db.js';

// Añadir juego a favoritos
export async function addFavorite(req, res) {
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(
    'SELECT id FROM games WHERE id=? OR game_code=? LIMIT 1',
    [key, key]
  );
  if (!g) return res.status(404).json({ error: 'Juego no encontrado' });

  await pool.query(
    'INSERT IGNORE INTO favorites (user_id, game_id) VALUES (?, ?)',
    [req.user.id, g.id]
  );
  res.json({ ok: true, message: 'Añadido a favoritos ❤️' });
}

// Eliminar de favoritos
export async function removeFavorite(req, res) {
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(
    'SELECT id FROM games WHERE id=? OR game_code=? LIMIT 1',
    [key, key]
  );
  if (!g) return res.status(404).json({ error: 'Juego no encontrado' });

  await pool.query('DELETE FROM favorites WHERE user_id=? AND game_id=?', [
    req.user.id,
    g.id,
  ]);
  res.json({ ok: true, message: 'Eliminado de favoritos 💔' });
}

// Listar favoritos del usuario
export async function listFavorites(req, res) {
  const [rows] = await pool.query(
    `SELECT g.game_code, g.title, g.platform, g.hero_image, g.release_date
     FROM favorites f
     JOIN games g ON g.id=f.game_id
     WHERE f.user_id=? ORDER BY f.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
}
