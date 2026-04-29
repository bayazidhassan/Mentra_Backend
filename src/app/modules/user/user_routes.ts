import { Router } from 'express';
import { authMiddleware } from '../../middleware/authenticate';
import { upload } from '../../utils/uploadImageToCloudinary';
import { userController } from './user_controller';

const router = Router();

router.get('/getMe', authMiddleware, userController.getMe);
router.patch(
  '/updateProfile',
  authMiddleware,
  upload.single('profileImage'),
  userController.updateProfile,
);
router.patch('/changePassword', authMiddleware, userController.changePassword);
router.get(
  '/mentors/recommended',
  authMiddleware,
  userController.getRecommendedMentors,
);
router.get('/mentors', authMiddleware, userController.getMentors);
router.get('/mentors/:id', authMiddleware, userController.getMentorById);

export const userRoutes = router;
