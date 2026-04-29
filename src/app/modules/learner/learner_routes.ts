import { Router } from 'express';
import { authMiddleware } from '../../middleware/authenticate';
import { learnerController } from './learner_controller';

const router = Router();

router.get('/getLearner', authMiddleware, learnerController.getLearner);

export const learnerRoutes = router;
