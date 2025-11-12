import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Middleware para validar JWT
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    console.error('Token inválido:', err.message);
    res.status(401).json({ error: 'Token inválido' });
  }
}
