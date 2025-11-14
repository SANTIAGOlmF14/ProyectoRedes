// services/catalog-service/src/middleware/auth.js
import fetch from 'node-fetch';

export async function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const url = `${process.env.IDENTITY_URL}/auth/verify`;
    const r = await fetch(url, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!r.ok) throw new Error('identity error');

    const data = await r.json();
    if (!data.valid) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = data.payload; // { id, username, role }
    next();
  } catch (err) {
    console.error('Error comunicando con identity-service:', err);
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo admin' });
  }
  next();
}

