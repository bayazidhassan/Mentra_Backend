import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { notificationController } from './notification_controller';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/mark-all-read', notificationController.markAllAsRead);

export const notificationRoutes = router;
