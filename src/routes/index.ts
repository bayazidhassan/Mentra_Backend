import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth_routes';
import { userRoutes } from '../modules/user/user_routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);

export default router;
