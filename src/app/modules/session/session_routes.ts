import { Router } from 'express';
import { authMiddleware } from '../../middleware/authenticate';
import { sessionController } from './session_controller';

const router = Router();

router.use(authMiddleware);

router.get('/slots/:mentorId', sessionController.getAvailableSlots);
router.get('/my-sessions', sessionController.getMySessions);
router.post('/book', sessionController.bookSession);
router.patch('/:id/accept', sessionController.acceptSession);
router.patch('/:id/cancel', sessionController.cancelSession);
router.patch('/:id/meeting-link', sessionController.addMeetingLink);
router.patch('/:id/complete', sessionController.completeSession);
router.patch('/:id/rate', sessionController.rateSession);

export const sessionRoutes = router;
