import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { userController } from './user_controller';

const router = Router();

router.post('/register', userController.register);
router.get('/getMe', authMiddleware, userController.getMe);
router.get(
  '/mentors/recommended',
  authMiddleware,
  userController.getRecommendedMentors,
);

export const userRoutes = router;
