import { Router } from 'express';
import { userRoutes } from '../modules/user/user_routes';

const router = Router();

router.use('/users', userRoutes);

export default router;
