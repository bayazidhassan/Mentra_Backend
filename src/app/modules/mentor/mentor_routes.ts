import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { mentorController } from './mentor_controller';

const router = Router();

// Protected routes
router.get('/suggested', authenticate, mentorController.getSuggestedMentors);
router.get('/stats', authenticate, mentorController.getMentorDashboardStats);
router.get('/availability', authenticate, mentorController.getAvailability);
router.patch(
  '/availability',
  authenticate,
  mentorController.updateAvailability,
);

// Public routes
router.get('/', mentorController.getMentors);
router.get('/topMentors', mentorController.getTopMentors);
router.get('/:id', mentorController.getMentorById);

export const mentorRoutes = router;
