import { Router } from 'express';
import { login, refresh, me } from './auth.controller.js';
import { validateBody } from '../../middleware/validateBody.js';
import { loginSchema, refreshSchema } from './auth.schema.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// POST /auth/login — Staff login → JWT pair
router.post('/login', loginLimiter, validateBody(loginSchema), login);

// POST /auth/refresh — Rotate access token
router.post('/refresh', validateBody(refreshSchema), refresh);

// GET /auth/me — Introspect current token
router.get('/me', authenticate, me);

export default router;
