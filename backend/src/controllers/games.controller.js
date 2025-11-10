import { pool } from '../utils/db.js';
import fetch from 'node-fetch';

export async function listGames(req,res){
  const { search='', genre, platform, page=1, limit=12 } = req.query;
  const off = (Number(page)-1)*Number(limit);
  let sql = `
    SELECT g.*, IFNULL(AVG(r.rating),0) AS avg_rating, COUNT(r.user_id) AS ratings
    FROM games g
    LEFT JOIN ratings r ON r.game_id=g.id
    LEFT JOIN games_genres gg ON gg.game_id=g.id
    LEFT JOIN genres ge ON ge.id=gg.genre_id
    WHERE g.title LIKE ?`;
  const params = [`%${search}%`];
  if (platform) { sql += ' AND g.platform=?'; params.push(platform); }
  if (genre)    { sql += ' AND ge.name=?';   params.push(genre); }
  sql += ' GROUP BY g.id ORDER BY avg_rating DESC LIMIT ?,?';
  params.push(off, Number(limit));
  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

export async function topGames(req,res){
  const limit = Number(req.query.limit || 10);
  const [rows] = await pool.query(`
    SELECT g.*, IFNULL(AVG(r.rating),0) AS avg_rating, COUNT(r.user_id) as ratings
    FROM games g LEFT JOIN ratings r ON r.game_id=g.id
    GROUP BY g.id ORDER BY avg_rating DESC, ratings DESC
    LIMIT ?`, [limit]);
  res.json(rows);
}

export async function gameDetail(req,res){
  const key = req.params.idOrCode;
  const [rows] = await pool.query(`SELECT * FROM games WHERE id=? OR game_code=? LIMIT 1`, [key, key]);
  if (!rows.length) return res.status(404).json({ error:'No existe' });
  res.json(rows[0]);
}

export async function gameImages(req,res){
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(`SELECT id, game_code FROM games WHERE id=? OR game_code=? LIMIT 1`,[key,key]);
  if (!g) return res.json([]);
  const [rows] = await pool.query(`SELECT image_url FROM game_images WHERE game_id=? ORDER BY id`,[g.id]);
  // Si no hubiera registros, devolvemos array vacío
  res.json(rows.map(r => r.image_url));
}

export async function searchCodes(req,res){
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const [rows] = await pool.query(
    `SELECT game_code AS code, title FROM games WHERE game_code LIKE CONCAT(?, '%') OR title LIKE CONCAT('%', ?, '%') LIMIT 10`,
    [q, q]
  );
  res.json(rows);
}

export async function commentsList(req,res){
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(`SELECT id FROM games WHERE id=? OR game_code=?`,[key,key]);
  if (!g) return res.json([]);
  const [rows] = await pool.query(
    `SELECT c.id, c.content, c.created_at, u.username
     FROM comments c JOIN users u ON u.id=c.user_id
     WHERE c.game_id=? ORDER BY c.id DESC`,[g.id]);
  res.json(rows);
}

export async function commentCreate(req,res){
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({error:'Contenido vacío'});
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(`SELECT id FROM games WHERE id=? OR game_code=?`,[key,key]);
  if (!g) return res.status(404).json({error:'Juego no existe'});
  await pool.query(`INSERT INTO comments (user_id,game_id,content) VALUES (?,?,?)`, [req.user.id, g.id, content.trim()]);
  res.json({ ok:true });
}

export async function putRating(req,res){
  const { rating } = req.body; // 1..5
  const n = Number(rating);
  if (!(n>=1 && n<=5)) return res.status(400).json({error:'rating 1..5'});
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(`SELECT id FROM games WHERE id=? OR game_code=?`,[key,key]);
  if (!g) return res.status(404).json({error:'Juego no existe'});
  await pool.query(
    `INSERT INTO ratings (user_id,game_id,rating) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE rating=VALUES(rating), updated_at=CURRENT_TIMESTAMP`,
    [req.user.id, g.id, n]
  );
  res.json({ ok:true });
}

const cache = new Map();
export async function patchNotes(req,res){
  const key = req.params.idOrCode;
  const [[g]] = await pool.query(`SELECT steam_app_id FROM games WHERE id=? OR game_code=?`,[key,key]);
  if (!g?.steam_app_id) return res.json({ note:null });
  const now = Date.now();
  if (cache.has(g.steam_app_id) && now-cache.get(g.steam_app_id).ts < 10*60*1000)
    return res.json(cache.get(g.steam_app_id).data);
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${g.steam_app_id}&count=1`;
  const r = await fetch(url);
  const j = await r.json();
  const item = j?.appnews?.newsitems?.[0];
  const data = item ? { title:item.title, contents:item.contents, date:item.date } : { note:null };
  cache.set(g.steam_app_id, { ts: now, data });
  res.json(data);
}
