import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { adminController } from './admin_controller';

const router = Router();

router.use(authenticate);

router.get('/stats', adminController.getDashboardStats);

router.get('/learners', adminController.getLearners);
router.patch('/learners/:id/ban', adminController.banUser);
router.patch('/learners/:id/unban', adminController.unbanUser);

router.get('/mentors', adminController.getMentors);
router.patch('/mentors/:id/approve', adminController.approveMentor);
router.patch('/mentors/:id/ban', adminController.banUser);
router.patch('/mentors/:id/unban', adminController.unbanUser);

router.get('/sessions', adminController.getSessions);

export const adminRoutes = router;
