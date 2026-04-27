import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { mentorController } from './mentor_controller';

const router = Router();

router.get('/', mentorController.getMentors);
router.get('/suggested', authMiddleware, mentorController.getSuggestedMentors);
router.get('/:id', mentorController.getMentorById);

export const mentorRoutes = router;
