import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { mentorController } from './mentor_controller';

const router = Router();

// Public routes — no auth needed
router.get('/', mentorController.getMentors);
router.get('/:id', mentorController.getMentorById);

// Protected routes — auth required
router.use(authenticate);
router.get('/suggested', mentorController.getSuggestedMentors);
router.get('/stats', mentorController.getMentorDashboardStats);
router.get('/availability', mentorController.getAvailability);
router.patch('/availability', mentorController.updateAvailability);

export const mentorRoutes = router;
