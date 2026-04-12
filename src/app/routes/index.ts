import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth_routes';
import { roadmapRoutes } from '../modules/roadmap/roadmap_routes';
import { sessionRoutes } from '../modules/session/session_routes';
import { userRoutes } from '../modules/user/user_routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/roadmap', roadmapRoutes);

export default router;
