import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { learnerController } from './learner_controller';

const router = Router();

router.use(authenticate);

router.get('/my-learners', authenticate, learnerController.getMyLearners);
router.get('/all-learners', authenticate, learnerController.getAllLearners);

export const learnerRoutes = router;
