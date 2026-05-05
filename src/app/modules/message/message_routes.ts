import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { messageController } from './message_controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getTotalUnreadCount);
router.post('/send', messageController.sendMessage);
router.patch('/read/:otherUserId', messageController.markAsRead);
router.get('/:otherUserId', messageController.getMessages);

export const messageRoutes = router;
