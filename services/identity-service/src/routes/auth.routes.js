// services/identity-service/src/routes/auth.routes.js
import { Router } from 'express';
import {
  register,
  login,
  me,
  verifyToken,
  listUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();

r.post('/auth/register', register);
r.post('/auth/login', login);
r.get('/auth/me', requireAuth, me);
r.get('/auth/verify', verifyToken);

// CRUD usuarios (admin)
r.get('/users', requireAuth, requireAdmin, listUsers);
r.get('/users/:id', requireAuth, requireAdmin, getUser);
r.put('/users/:id', requireAuth, requireAdmin, updateUser);
r.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

export default r;
