import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { learnerController } from './learner_controller';

const router = Router();

router.get('/my-learners', authenticate, learnerController.getMyLearners);
router.get('/all-learners', learnerController.getAllLearners);
router.get('/top-learners', learnerController.getTopLearners);

export const learnerRoutes = router;
