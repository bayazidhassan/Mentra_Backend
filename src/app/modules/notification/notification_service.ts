import { Types } from 'mongoose';
import { Notification } from './notification_model';

// ─── createNotification (internal helper) ─────────────────────────────────────

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
  await Notification.create({
    user: new Types.ObjectId(userId.toString()),
    type,
    title,
    message,
    isRead: false,
    actionUrl,
  });
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
