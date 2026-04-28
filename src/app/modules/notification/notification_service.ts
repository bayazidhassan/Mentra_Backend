import { Types } from 'mongoose';
import { getIO } from '../../../socket';
import { Notification } from './notification_model';

// ─── createNotification ───────────────────────────────────────────────────────
// Internal helper — called by session, payment services etc.
// Saves to DB + emits real-time event to the user's personal Socket.IO room

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  actionUrl,
}: {
  userId: string | Types.ObjectId;
  type: 'session' | 'roadmap' | 'payment' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
}) => {
  const notification = await Notification.create({
    user: new Types.ObjectId(userId.toString()),
    type,
    title,
    message,
    isRead: false,
    actionUrl,
  });

  // Emit real-time event to the user's personal room
  const io = getIO();
  if (io) {
    io.to(`user:${userId.toString()}`).emit('new_notification', {
      _id: notification._id.toString(),
      user: userId.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: false,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt.toISOString(),
    });
  }

  return notification;
};

// ─── getMyNotifications ───────────────────────────────────────────────────────

const getMyNotifications = async (userId: string) => {
  const notifications = await Notification.find({
    user: new Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .limit(50);

  return notifications;
};

// ─── markAsRead ───────────────────────────────────────────────────────────────

const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: new Types.ObjectId(userId) },
    { $set: { isRead: true } },
    { returnDocument: 'after' },
  );

  if (!notification) throw new Error('Notification not found.');
  return notification;
};

// ─── markAllAsRead ────────────────────────────────────────────────────────────

const markAllAsRead = async (userId: string) => {
  await Notification.updateMany(
    { user: new Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true } },
  );
};

// ─── getUnreadCount ───────────────────────────────────────────────────────────

const getUnreadCount = async (userId: string) => {
  const count = await Notification.countDocuments({
    user: new Types.ObjectId(userId),
    isRead: false,
  });
  return count;
};

export const notificationService = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
