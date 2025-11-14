// favorites-service/src/middleware/auth.js
import dotenv from 'dotenv';
dotenv.config();

export async function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const url = `${process.env.IDENTITY_URL}/auth/verify`;

    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!resp.ok) {
      throw new Error('Error llamando a identity-service');
    }

    const data = await resp.json();
    if (!data.valid) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = data.payload; // { id, username, role }
    next();
  } catch (err) {
    console.error('Error verificando token con identity-service:', err.message);
    res.status(401).json({ error: 'Token inválido' });
  }
}
