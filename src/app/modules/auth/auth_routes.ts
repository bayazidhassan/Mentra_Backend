import { Router } from 'express';
import { authController } from './auth_controller';

const router = Router();

router.post('/login', authController.login);
router.post('/googleLogin', authController.googleLogin);
router.post('/logout', authController.logout);

export const authRoutes = router;
