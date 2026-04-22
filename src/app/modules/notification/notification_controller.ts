import { RequestHandler } from 'express';
import { notificationService } from './notification_service';

const getMyNotifications: RequestHandler = async (req, res) => {
  try {
    const notifications = await notificationService.getMyNotifications(
      req.user?.id as string,
    );
    res.status(200).json({
      success: true,
      message: 'Notifications fetched.',
      data: notifications,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch notifications.',
      data: null,
    });
  }
};

const markAsRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const notification = await notificationService.markAsRead(
      req.user?.id as string,
      id,
    );
    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to mark notification.',
      data: null,
    });
  }
};

const markAllAsRead: RequestHandler = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user?.id as string);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to mark all notifications.',
      data: null,
    });
  }
};

const getUnreadCount: RequestHandler = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(
      req.user?.id as string,
    );
    res.status(200).json({
      success: true,
      message: 'Unread count fetched.',
      data: { count },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch unread count.',
      data: null,
    });
  }
};

export const notificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
