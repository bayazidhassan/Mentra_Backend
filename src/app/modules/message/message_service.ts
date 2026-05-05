import { Types } from 'mongoose';
import { Session } from '../session/session_model';
import { User } from '../user/user_model';
import { Message } from './message_model';

// ─── Helper: build deterministic conversationId ───────────────────────────────

export const buildConversationId = (
  userIdA: string,
  userIdB: string,
): string => {
  return [userIdA, userIdB].sort().join('_');
};

// ─── checkChatAccess ──────────────────────────────────────────────────────────
// Verifies that at least one accepted+paid session exists between the two users

const checkChatAccess = async (
  userAId: string,
  userBId: string,
): Promise<boolean> => {
  const session = await Session.findOne({
    $or: [
      {
        learner: new Types.ObjectId(userAId),
        mentor: new Types.ObjectId(userBId),
      },
      {
        learner: new Types.ObjectId(userBId),
        mentor: new Types.ObjectId(userAId),
      },
    ],
    status: { $in: ['accepted', 'completed'] },
    paymentStatus: 'paid',
  });

  return !!session;
};

// ─── sendMessage ──────────────────────────────────────────────────────────────

const sendMessage = async (
  senderId: string,
  receiverId: string,
  text: string,
) => {
  // Verify access
  const hasAccess = await checkChatAccess(senderId, receiverId);
  if (!hasAccess) {
    throw new Error(
      'Chat is only available after a session is accepted and paid.',
    );
  }

  const conversationId = buildConversationId(senderId, receiverId);

  const message = await Message.create({
    conversationId,
    senderId: new Types.ObjectId(senderId),
    receiverId: new Types.ObjectId(receiverId),
    text: text.trim(),
    isRead: false,
  });

  return message;
};

// ─── getMessages ──────────────────────────────────────────────────────────────

const getMessages = async (
  userId: string,
  otherUserId: string,
  page = 1,
  limit = 50,
) => {
  const hasAccess = await checkChatAccess(userId, otherUserId);
  if (!hasAccess) throw new Error('Chat access denied.');

  const conversationId = buildConversationId(userId, otherUserId);

  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 }) // newest first
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Return oldest first for display
  return messages.reverse();
};

// ─── markAsRead ───────────────────────────────────────────────────────────────

const markAsRead = async (userId: string, otherUserId: string) => {
  const conversationId = buildConversationId(userId, otherUserId);

  await Message.updateMany(
    {
      conversationId,
      receiverId: new Types.ObjectId(userId), // only mark messages sent TO me
      isRead: false,
    },
    { $set: { isRead: true } },
  );
};

// ─── getConversations ─────────────────────────────────────────────────────────
// Returns all unique conversations for a user with last message + unread count

const getConversations = async (userId: string) => {
  // Find all accepted+paid sessions where user is learner or mentor
  const sessions = await Session.find({
    $or: [
      { learner: new Types.ObjectId(userId) },
      { mentor: new Types.ObjectId(userId) },
    ],
    status: { $in: ['accepted', 'completed'] },
    paymentStatus: 'paid',
  })
    .select('learner mentor')
    .lean();

  if (!sessions.length) return [];

  // Get unique other user IDs
  const otherUserIds = [
    ...new Set(
      sessions.map((s) => {
        const learnerId = s.learner.toString();
        const mentorId = s.mentor.toString();
        return learnerId === userId ? mentorId : learnerId;
      }),
    ),
  ];

  // For each conversation, get last message + unread count
  const conversations = await Promise.all(
    otherUserIds.map(async (otherUserId) => {
      const conversationId = buildConversationId(userId, otherUserId);

      const lastMessage = await Message.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .lean();

      const unreadCount = await Message.countDocuments({
        conversationId,
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      });

      const otherUser = await User.findById(otherUserId)
        .select('name email profileImage')
        .lean();

      return {
        conversationId,
        otherUser: otherUser
          ? {
              _id: otherUser._id.toString(),
              name: otherUser.name,
              email: otherUser.email,
              profileImage: otherUser.profileImage,
            }
          : null,
        lastMessage: lastMessage
          ? {
              text: lastMessage.text,
              senderId: lastMessage.senderId.toString(),
              createdAt: lastMessage.createdAt.toISOString(),
              isRead: lastMessage.isRead,
            }
          : null,
        unreadCount,
      };
    }),
  );

  // Sort by last message date (most recent first)
  return conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? '';
    const bTime = b.lastMessage?.createdAt ?? '';
    return bTime.localeCompare(aTime);
  });
};

// ─── getTotalUnreadCount ──────────────────────────────────────────────────────

const getTotalUnreadCount = async (userId: string) => {
  const conversations = await Message.distinct('conversationId', {
    receiverId: new Types.ObjectId(userId),
    isRead: false,
  });

  return conversations.length;
};

const getUnreadConversationIds = async (userId: string) => {
  const conversationIds = await Message.distinct('conversationId', {
    receiverId: new Types.ObjectId(userId),
    isRead: false,
  });

  return conversationIds;
};

export const messageService = {
  buildConversationId,
  checkChatAccess,
  sendMessage,
  getMessages,
  markAsRead,
  getConversations,
  getTotalUnreadCount,
  getUnreadConversationIds
};
