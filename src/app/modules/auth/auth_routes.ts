import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { authController } from './auth_controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/googleLogin', authController.googleLogin);
router.patch('/setRole', authMiddleware, authController.setRole);
router.post('/refreshToken', authController.refreshToken);
router.post('/logout', authController.logout);

export const authRoutes = router;
