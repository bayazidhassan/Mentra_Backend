import { RequestHandler } from 'express';
import { messageService } from './message_service';

const getConversations: RequestHandler = async (req, res) => {
  try {
    const conversations = await messageService.getConversations(
      req.user?.id as string,
    );
    res.status(200).json({
      success: true,
      message: 'Conversations fetched.',
      data: conversations,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch conversations.',
      data: null,
    });
  }
};

const getMessages: RequestHandler = async (req, res) => {
  try {
    const { otherUserId } = req.params as { otherUserId: string };
    const { page = '1', limit = '50' } = req.query as Record<string, string>;

    const messages = await messageService.getMessages(
      req.user?.id as string,
      otherUserId,
      parseInt(page),
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      message: 'Messages fetched.',
      data: messages,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch messages.',
      data: null,
    });
  }
};

const sendMessage: RequestHandler = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      res.status(400).json({
        success: false,
        message: 'receiverId and text are required.',
        data: null,
      });
      return;
    }

    const message = await messageService.sendMessage(
      req.user?.id as string,
      receiverId,
      text,
    );

    res.status(201).json({
      success: true,
      message: 'Message sent.',
      data: message,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to send message.',
      data: null,
    });
  }
};

const markAsRead: RequestHandler = async (req, res) => {
  try {
    const { otherUserId } = req.params as { otherUserId: string };
    await messageService.markAsRead(req.user?.id as string, otherUserId);
    res.status(200).json({
      success: true,
      message: 'Messages marked as read.',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to mark messages.',
      data: null,
    });
  }
};

const getTotalUnreadCount: RequestHandler = async (req, res) => {
  try {
    const count = await messageService.getTotalUnreadCount(
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

export const messageController = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getTotalUnreadCount,
};
