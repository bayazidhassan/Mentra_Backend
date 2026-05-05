import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { messageController } from './message_controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', messageController.getConversations);
router.get('/unread-count', messageController.getTotalUnreadCount);
router.get('/:otherUserId', messageController.getMessages);
router.post('/send', messageController.sendMessage);
router.get('/unread-conversations', messageController.getUnreadConversationIds);
router.patch('/read/:otherUserId', messageController.markAsRead);

export const messageRoutes = router;
