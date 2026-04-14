import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { userController } from './user_controller';

const router = Router();

router.get('/getMe', authMiddleware, userController.getMe);
router.get(
  '/mentors/recommended',
  authMiddleware,
  userController.getRecommendedMentors,
);
router.get('/mentors', authMiddleware, userController.getMentors);
router.get('/mentors/:id', authMiddleware, userController.getMentorById);

export const userRoutes = router;
