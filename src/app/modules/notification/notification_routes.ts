import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { notificationController } from './notification_controller';

const router = Router();

router.use(authMiddleware);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);

export const notificationRoutes = router;
