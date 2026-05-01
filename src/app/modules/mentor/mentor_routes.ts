import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { mentorController } from './mentor_controller';

const router = Router();

router.use(authenticate);

router.get('/', mentorController.getMentors);
router.get('/suggested', mentorController.getSuggestedMentors);
router.get('/stats', mentorController.getMentorDashboardStats);
router.get('/availability', mentorController.getAvailability);
router.patch('/availability', mentorController.updateAvailability);
router.get('/:id', mentorController.getMentorById);

export const mentorRoutes = router;
