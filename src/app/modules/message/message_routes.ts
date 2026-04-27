import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware';
import { messageController } from './message_controller';

const router = Router();

router.use(authMiddleware);

router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getTotalUnreadCount);
router.get('/:otherUserId', messageController.getMessages);
router.post('/send', messageController.sendMessage);
router.patch('/read/:otherUserId', messageController.markAsRead);

export const messageRoutes = router;
