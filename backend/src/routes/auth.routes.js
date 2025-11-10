import { Router } from 'express';
import { login, register, resetPassword } from '../controllers/auth.controller.js';

const r = Router();
r.post('/auth/register', register);
r.post('/auth/login',    login);
r.post('/auth/reset',    resetPassword); // solo demo
export default r;
