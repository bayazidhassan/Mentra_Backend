import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { roadmapController } from './roadmap_controller';

const router = Router();

router.use(authenticate);

router.get('/me', roadmapController.getMyRoadmap);
router.post('/generate', roadmapController.generateRoadmap);
router.post('/create', roadmapController.createRoadmap);
router.get('/completed', roadmapController.getCompletedRoadmaps);
router.patch('/:id/steps/:stepId', roadmapController.updateStepStatus);
router.delete('/:id', roadmapController.deleteRoadmap);

export const roadmapRoutes = router;
