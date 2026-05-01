import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authController } from './auth_controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/googleLogin', authController.googleLogin);
router.patch('/setRole', authenticate, authController.setRole);
router.post('/refreshToken', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify_email/:token', authController.verifyEmail);

export const authRoutes = router;
