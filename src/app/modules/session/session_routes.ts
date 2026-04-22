import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { sessionController } from './session_controller';

const router = Router();

router.use(authMiddleware);

router.get('/slots/:mentorId', sessionController.getAvailableSlots);
router.post('/book', sessionController.bookSession);

export const sessionRoutes = router;
