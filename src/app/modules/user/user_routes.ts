import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { upload } from '../../utils/uploadImageToCloudinary';
import { userController } from './user_controller';

const router = Router();

router.use(authenticate);

router.get('/getMe', userController.getMe);
router.patch(
  '/updateProfile',
  upload.single('profileImage'),
  userController.updateProfile,
);
router.patch('/changePassword', userController.changePassword);
router.get('/mentors/recommended', userController.getRecommendedMentors);
router.get('/mentors', userController.getMentors);
router.get('/mentors/:id', userController.getMentorById);

export const userRoutes = router;
