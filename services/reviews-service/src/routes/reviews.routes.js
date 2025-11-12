import { Router } from 'express';
import {
  commentsList,
  commentCreate,
  putRating,
  ratingInfo,
  pendingComments,
  approveComment,
  deleteComment,
} from '../controllers/reviews.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();

// 🧩 Rutas públicas y protegidas
r.get('/games/:idOrCode/comments', commentsList);
r.post('/games/:idOrCode/comments', requireAuth, commentCreate);
r.put('/games/:idOrCode/rating', requireAuth, putRating);
r.get('/games/:idOrCode/rating', ratingInfo);

// 🧩 Rutas para administradores
r.get('/admin/comments/pending', requireAuth, requireAdmin, pendingComments);
r.put('/admin/comments/approve/:id', requireAuth, requireAdmin, approveComment);
r.delete('/admin/comments/delete/:id', requireAuth, requireAdmin, deleteComment);

export default r;
