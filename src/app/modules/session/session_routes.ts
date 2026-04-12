import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { sessionController } from './session_controller';

const router = Router();

router.get(
  '/upcomingSession',
  authMiddleware,
  sessionController.getUpcomingSessions,
);

export const sessionRoutes = router;
