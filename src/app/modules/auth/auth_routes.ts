import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authController } from './auth_controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-Login', authController.googleLogin);
router.patch('/setRole', authenticate, authController.setRole);
router.post('/refreshToken', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authenticate, authController.logout);
router.get('/verify-email/:token', authController.verifyEmail);

export const authRoutes = router;
