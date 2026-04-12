import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { roadmapController } from './roadmap_controller';

const router = Router();

router.get('/me', authMiddleware, roadmapController.getMyRoadmap);
router.post('/generate', authMiddleware, roadmapController.generateRoadmap);
router.post('/create', authMiddleware, roadmapController.createRoadmap);
router.patch(
  '/:id/steps/:stepId',
  authMiddleware,
  roadmapController.updateStepStatus,
);
router.delete('/:id', authMiddleware, roadmapController.deleteRoadmap);
export const roadmapRoutes = router;
