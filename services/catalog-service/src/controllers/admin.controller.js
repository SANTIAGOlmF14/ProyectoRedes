import { pool } from '../utils/db.js';
import { makeGameCode } from '../utils/makeGameCode.js';
import slugify from 'slugify';

function normalizeList(s) {
  const out = (s ?? '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .join(', ');
  return out || null;
}

export async function listGenres(_req, res) {
  const [rows] = await pool.query('SELECT id, name FROM genres ORDER BY name');
  res.json(rows);
}

export async function createGenre(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  await pool.query('INSERT INTO genres (name) VALUES (?)', [name]);
  res.json({ ok: true });
}

export async function deleteGenre(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM genres WHERE id=?', [id]);
  res.json({ ok: true });
}

export async function createGame(req, res) {
  let {
    title, platform, release_date,
    developer, publisher, trailer_url, description,
    steam_app_id, genre_ids = []
  } = req.body;

  if (!title || !platform || !release_date) {
    return res.status(400).json({ error: 'title, platform, release_date requeridos' });
  }

  developer = normalizeList(developer);
  publisher = normalizeList(publisher);

  const game_code = makeGameCode(platform, title, release_date);
  const slug = slugify(title, { lower: true, strict: true });

  const [r] = await pool.query(
    `INSERT INTO games
     (game_code,title,slug,platform,developer,publisher,release_date,trailer_url,description,steam_app_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [game_code, title, slug, platform, developer, publisher, release_date || null, trailer_url, description, steam_app_id || null]
  );

  if (genre_ids?.length) {
    const values = genre_ids.map(id => [r.insertId, id]);
    await pool.query('INSERT INTO games_genres (game_id, genre_id) VALUES ?', [values]);
  }

  res.json({ ok: true, game_code });
}

export async function updateGame(req, res) {
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(
    'SELECT id FROM games WHERE id=? OR game_code=? LIMIT 1',
    [key, key]
  );
  if (!g) return res.status(404).json({ error: 'No existe' });

  let {
    title, platform, release_date,
    developer, publisher, trailer_url, description,
    steam_app_id, genre_ids = []
  } = req.body;

  developer = normalizeList(developer);
  publisher = normalizeList(publisher);

  await pool.query(
    `UPDATE games SET title=?, platform=?, release_date=?, developer=?, publisher=?,
     trailer_url=?, description=?, steam_app_id=? WHERE id=?`,
    [title, platform, release_date || null, developer, publisher, trailer_url, description, steam_app_id || null, g.id]
  );

  await pool.query('DELETE FROM games_genres WHERE game_id=?', [g.id]);
  if (genre_ids?.length) {
    const values = genre_ids.map(id => [g.id, id]);
    await pool.query('INSERT INTO games_genres (game_id, genre_id) VALUES ?', [values]);
  }

  res.json({ ok: true });
}

export async function deleteGame(req, res) {
  const key = req.params.idOrCode;
  const [r] = await pool.query('DELETE FROM games WHERE id=? OR game_code=?', [key, key]);
  if (!r.affectedRows) return res.status(404).json({ error: 'No existe' });
  res.json({ ok: true });
}
