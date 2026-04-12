import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { sessionController } from './session_controller';

const router = Router();

router.get('/upcoming', authMiddleware, sessionController.getUpcomingSessions);
router.get('/', authMiddleware, sessionController.getMySessions);
router.get('/:id', authMiddleware, sessionController.getSessionById);
router.post('/', authMiddleware, sessionController.bookSession);
router.patch(
  '/:id/status',
  authMiddleware,
  sessionController.updateSessionStatus,
);

export const sessionRoutes = router;
