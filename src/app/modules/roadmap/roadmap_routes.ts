import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { roadmapController } from './roadmap_controller';

const router = Router();

router.get('/me', authMiddleware, roadmapController.getMyRoadmap);

export const roadmapRoutes = router;
