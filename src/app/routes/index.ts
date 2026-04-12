import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth_routes';
import { sessionRoutes } from '../modules/session/session_routes';
import { userRoutes } from '../modules/user/user_routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);

export default router;
