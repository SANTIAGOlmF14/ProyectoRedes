// services/identity-service/src/controllers/auth.controller.js
import { pool } from '../utils/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ---------- HELPER PARA ARMAR TOKEN ----------
function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ---------- REGISTRO ----------
export async function register(req, res) {
  try {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username y password requeridos' });
    }

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (rows.length) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [r] = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?,?,?)',
      [username, hash, role]
    );

    const user = { id: r.insertId, username, role };
    const token = createToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

// ---------- LOGIN ----------
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username y password requeridos' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    const u = rows[0];
    if (!u) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = createToken(u);

    res.json({
      token,
      user: { id: u.id, username: u.username, role: u.role }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

// ---------- PERFIL DEL USUARIO AUTENTICADO ----------
export async function me(req, res) {
  res.json(req.user);
}

// ---------- VERIFICAR TOKEN (para otros microservicios) ----------
export async function verifyToken(req, res) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) return res.json({ valid: false });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, payload });
  } catch (err) {
    res.json({ valid: false });
  }
}

// ---------- CRUD EXTRA (opcional para el taller) ----------

export async function listUsers(_req, res) {
  const [rows] = await pool.query(
    'SELECT id, username, role, created_at FROM users ORDER BY id'
  );
  res.json(rows);
}

export async function getUser(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query(
    'SELECT id, username, role, created_at FROM users WHERE id = ?',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No existe' });
  res.json(rows[0]);
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  res.json({ ok: true });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ ok: true });
}
