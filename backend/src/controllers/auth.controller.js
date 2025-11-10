import { pool } from '../utils/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function register(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Datos incompletos' });
  const [rows] = await pool.query('SELECT id FROM users WHERE username=?', [username]);
  if (rows.length) return res.status(409).json({ error: 'Usuario existe' });
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username,password_hash) VALUES (?,?)', [username, hash]);
  res.json({ ok: true });
}

export async function login(req, res) {
  const { username, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE username=?', [username]);
  const u = rows[0];
  if (!u) return res.status(401).json({ error: 'Credenciales' });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales' });
  const token = jwt.sign({ id: u.id, username: u.username, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: u.id, username: u.username, role: u.role } });
}

// DEMO (sin token de verificación por email)
export async function resetPassword(req,res){
  const { username, newPassword } = req.body;
  if (!username || !newPassword) return res.status(400).json({error:'Datos incompletos'});
  const [rows] = await pool.query('SELECT id FROM users WHERE username=?',[username]);
  if (!rows.length) return res.status(404).json({ error:'Usuario no encontrado' });
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash=? WHERE username=?',[hash, username]);
  res.json({ ok:true, msg:'Contraseña actualizada' });
}
