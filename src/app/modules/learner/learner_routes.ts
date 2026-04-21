import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { learnerController } from './learner_controller';

const router = Router();

router.get('/getLearner', authMiddleware, learnerController.getLearner);

export const learnerRoutes = router;
