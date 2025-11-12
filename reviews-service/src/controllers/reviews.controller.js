import { pool } from '../utils/db.js';
import jwt from 'jsonwebtoken';

// 🧩 GET /api/games/:idOrCode/comments
// Solo devuelve los comentarios APROBADOS
export async function commentsList(req, res) {
  try {
    const key = req.params.idOrCode;
    const [[g]] = await pool.query(
      'SELECT id FROM games WHERE id=? OR game_code=?',
      [key, key]
    );
    if (!g) return res.json([]);

    const [rows] = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.username
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.game_id = ? AND c.approved = 1
       ORDER BY c.id DESC`,
      [g.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en commentsList:', err);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
}

// 🧩 POST /api/games/:idOrCode/comments
// Los usuarios crean reseñas → quedan como "pendientes" (approved=0)
export async function commentCreate(req, res) {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token' });

    const user = jwt.verify(token, process.env.JWT_SECRET);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Contenido vacío' });

    const key = req.params.idOrCode;
    const [[g]] = await pool.query(
      'SELECT id FROM games WHERE id=? OR game_code=?',
      [key, key]
    );
    if (!g) return res.status(404).json({ error: 'Juego no existe' });

    // Si el usuario es admin, la reseña se aprueba automáticamente
    const approved = user.role === 'admin' ? 1 : 0;

    await pool.query(
      'INSERT INTO comments (user_id, game_id, content, approved) VALUES (?, ?, ?, ?)',
      [user.id, g.id, content.trim(), approved]
    );

    if (approved === 1) {
      res.json({ message: 'Tu reseña ha sido publicada exitosamente ✅' });
    } else {
      res.json({
        message:
          'Tu reseña ha sido enviada a revisión. Será visible cuando un administrador la apruebe.',
      });
    }
  } catch (err) {
    console.error('Error en commentCreate:', err);
    res.status(500).json({ error: 'Error al publicar comentario' });
  }
}

// 🧩 PUT /api/games/:idOrCode/rating
// Permite a cualquier usuario votar (1–5) y actualiza si ya votó antes
export async function putRating(req, res) {
  try {
    const { rating } = req.body;
    const n = Number(rating);
    if (!(n >= 1 && n <= 5)) {
      return res.status(400).json({ error: 'El rating debe estar entre 1 y 5' });
    }

    const key = req.params.idOrCode;

    // Verificar si el juego existe
    const [[g]] = await pool.query(
      'SELECT id FROM games WHERE id=? OR game_code=?',
      [key, key]
    );
    if (!g) return res.status(404).json({ error: 'Juego no existe' });

    // Insertar o actualizar el voto del usuario
    await pool.query(
      `INSERT INTO ratings (user_id, game_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, g.id, n]
    );

    // Calcular nuevo promedio y cantidad de votos
    const [[stats]] = await pool.query(
      `SELECT ROUND(AVG(rating), 2) AS avg, COUNT(*) AS count
       FROM ratings
       WHERE game_id = ?`,
      [g.id]
    );

    res.json({
      message: 'Puntuación actualizada correctamente ✅',
      promedio: Number(stats.avg),
      votos: stats.count,
    });
  } catch (err) {
    console.error('Error en putRating:', err);
    res.status(500).json({ error: 'Error al actualizar puntuación' });
  }
}

// 🧩 GET /api/games/:idOrCode/rating
// Devuelve promedio y número de votos actuales
export async function ratingInfo(req, res) {
  try {
    const key = req.params.idOrCode;

    const [[g]] = await pool.query(
      'SELECT id FROM games WHERE id=? OR game_code=?',
      [key, key]
    );
    if (!g) return res.json({ promedio: 0, votos: 0 });

    const [[r]] = await pool.query(
      `SELECT ROUND(AVG(rating), 2) AS promedio, COUNT(*) AS votos
       FROM ratings
       WHERE game_id = ?`,
      [g.id]
    );

    res.json({
      promedio: Number(r.promedio || 0),
      votos: Number(r.votos || 0),
    });
  } catch (err) {
    console.error('Error en ratingInfo:', err);
    res.status(500).json({ error: 'Error al obtener puntuación' });
  }
}

// 🧩 GET /api/admin/comments/pending → Solo admin
export async function pendingComments(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, u.username, g.title, c.content, c.created_at
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN games g ON g.id = c.game_id
       WHERE c.approved = 0
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error en pendingComments:', err);
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
}

// 🧩 PUT /api/admin/comments/approve/:id → Solo admin
export async function approveComment(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE comments SET approved = 1 WHERE id = ?', [id]);
    res.json({ message: 'Comentario aprobado ✅' });
  } catch (err) {
    console.error('Error en approveComment:', err);
    res.status(500).json({ error: 'Error al aprobar comentario' });
  }
}

// 🧩 DELETE /api/admin/comments/delete/:id → Solo admin
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ message: 'Comentario eliminado ❌' });
  } catch (err) {
    console.error('Error en deleteComment:', err);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
}
