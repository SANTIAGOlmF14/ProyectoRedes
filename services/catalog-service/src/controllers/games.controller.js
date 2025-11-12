import { pool } from '../utils/db.js';
import fetch from 'node-fetch';

// Cambiar el helper a "codes"
async function fetchAverageMapByCodes(codes) {
  const base = process.env.REVIEWS_URL;
  if (!base || !codes.length) return {};
  try {
    const url = `${base}/reviews/average?codes=${encodeURIComponent(codes.join(','))}`;
    const r = await fetch(url);
    if (!r.ok) return {};
    return await r.json(); // { CODE: 4.2, ... }
  } catch { return {}; }
}

export async function listGames(req, res) {
  const { search='', genre, platform, page=1, limit=12 } = req.query;
  const off = (Number(page)-1) * Number(limit);

  let sql = `
    SELECT DISTINCT g.*
    FROM games g
    LEFT JOIN games_genres gg ON gg.game_id=g.id
    LEFT JOIN genres ge      ON ge.id=gg.genre_id
    WHERE g.title LIKE ?
  `;
  const params = [`%${search}%`];
  if (platform) { sql += ' AND g.platform=?'; params.push(platform); }
  if (genre)    { sql += ' AND ge.name=?';   params.push(genre); }
  sql += ' ORDER BY g.release_date DESC, g.id DESC LIMIT ?,?';
  params.push(off, Number(limit));

  const [rows] = await pool.query(sql, params);

  // Promedios desde reviews por code (fallback a cache local si no hay)
  const codes = rows.map(r => r.game_code);
  const avgMap = await fetchAverageMapByCodes(codes);

  res.json(rows.map(r => ({
    ...r,
    avg_rating: avgMap[r.game_code] ?? Number(r.avg_rating_cache ?? 0)
  })));
}

export async function topGames(req, res) {
  const limit = Number(req.query.limit || 10);
  const [rows] = await pool.query(
    'SELECT * FROM games ORDER BY avg_rating_cache DESC, id DESC LIMIT ?',
    [limit]
  );
  const codes = rows.map(r => r.game_code);
  const avgMap = await fetchAverageMapByCodes(codes);

  const out = rows
    .map(r => ({ ...r, avg_rating: avgMap[r.game_code] ?? Number(r.avg_rating_cache ?? 0) }))
    .sort((a, b) => (b.avg_rating - a.avg_rating) || (b.id - a.id))
    .slice(0, limit);

  res.json(out);
}

export async function gameDetail(req, res) {
  const key = req.params.idOrCode;
  const [rows] = await pool.query(
    'SELECT * FROM games WHERE id=? OR game_code=? LIMIT 1',
    [key, key]
  );
  if (!rows.length) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
}

export async function gameImages(req, res) {
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(
    'SELECT id FROM games WHERE id=? OR game_code=? LIMIT 1',
    [key, key]
  );
  if (!g) return res.json([]);
  const [rows] = await pool.query(
    'SELECT image_url FROM game_images WHERE game_id=? ORDER BY id',
    [g.id]
  );
  res.json(rows.map(r => r.image_url));
}

export async function searchCodes(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const [rows] = await pool.query(
    `SELECT game_code AS code, title
     FROM games
     WHERE game_code LIKE CONCAT(?, '%') OR title LIKE CONCAT('%', ?, '%')
     LIMIT 10`,
    [q, q]
  );
  res.json(rows);
}

const cache = new Map();
export async function patchNotes(req, res) {
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(
    'SELECT steam_app_id FROM games WHERE id=? OR game_code=? LIMIT 1',
    [key, key]
  );
  if (!g?.steam_app_id) return res.json({ note: null });

  const now = Date.now();
  if (cache.has(g.steam_app_id) && now - cache.get(g.steam_app_id).ts < 10 * 60 * 1000) {
    return res.json(cache.get(g.steam_app_id).data);
  }

  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.steam_app_id}&count=1`;
  const r = await fetch(url);
  const j = await r.json();
  const item = j?.appnews?.newsitems?.[0];
  const data = item ? { title: item.title, contents: item.contents, date: item.date } : { note: null };
  cache.set(g.steam_app_id, { ts: now, data });
  res.json(data);
}
