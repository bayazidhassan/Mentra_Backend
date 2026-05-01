import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { learnerController } from './learner_controller';

const router = Router();

router.get('/getLearner', authenticate, learnerController.getLearner);

export const learnerRoutes = router;
