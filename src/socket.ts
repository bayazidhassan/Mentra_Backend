import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { Socket, Server as SocketIOServer } from 'socket.io';
import { Message } from './app/modules/message/message_model';
import { buildConversationId } from './app/modules/message/message_service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TSocketUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: TSocketUser;
}

// ─── Socket.IO setup ──────────────────────────────────────────────────────────

export const initSocket = (httpServer: HttpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.FRONTEND_URL
          : 'http://localhost:3000',
      credentials: true,
    },
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required.'));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN as string,
      ) as TSocketUser;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token.'));
    }
  });

  // ── Connection ───────────────────────────────────────────────────────────
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    if (!userId) return;

    console.log(`Socket connected: ${userId}`);

    // Join a personal room so we can send events to specific users
    socket.join(`user:${userId}`);

    // ── Join conversation room ─────────────────────────────────────────────
    socket.on('join_conversation', (otherUserId: string) => {
      const conversationId = buildConversationId(userId, otherUserId);
      socket.join(conversationId);
    });

    // ── Leave conversation room ────────────────────────────────────────────
    socket.on('leave_conversation', (otherUserId: string) => {
      const conversationId = buildConversationId(userId, otherUserId);
      socket.leave(conversationId);
    });

    // ── Send message ───────────────────────────────────────────────────────
    socket.on(
      'send_message',
      async (data: { receiverId: string; text: string }) => {
        const { receiverId, text } = data;

        if (!text?.trim() || !receiverId) return;

        try {
          const conversationId = buildConversationId(userId, receiverId);

          // Save to DB
          const message = await Message.create({
            conversationId,
            senderId: new Types.ObjectId(userId),
            receiverId: new Types.ObjectId(receiverId),
            text: text.trim(),
            isRead: false,
          });

          const messageData = {
            _id: message._id.toString(),
            conversationId,
            senderId: userId,
            receiverId,
            text: message.text,
            isRead: false,
            createdAt: message.createdAt.toISOString(),
          };

          // Emit to everyone in the conversation room (sender + receiver if online)
          io.to(conversationId).emit('new_message', messageData);

          // Also emit unread badge update to receiver's personal room
          // (in case they're not in the conversation room)
          io.to(`user:${receiverId}`).emit('unread_message', {
            conversationId,
            senderId: userId,
            senderName: socket.user?.name,
          });
        } catch (err) {
          socket.emit('message_error', { error: 'Failed to send message.' });
        }
      },
    );

    // ── Typing indicator ───────────────────────────────────────────────────
    socket.on('typing', (otherUserId: string) => {
      const conversationId = buildConversationId(userId, otherUserId);
      socket.to(conversationId).emit('user_typing', { userId });
    });

    socket.on('stop_typing', (otherUserId: string) => {
      const conversationId = buildConversationId(userId, otherUserId);
      socket.to(conversationId).emit('user_stop_typing', { userId });
    });

    // ── Mark as read ───────────────────────────────────────────────────────
    socket.on('mark_read', async (otherUserId: string) => {
      const conversationId = buildConversationId(userId, otherUserId);
      await Message.updateMany(
        {
          conversationId,
          receiverId: new Types.ObjectId(userId),
          isRead: false,
        },
        { $set: { isRead: true } },
      );
      // Notify sender that their messages were read
      io.to(`user:${otherUserId}`).emit('messages_read', { conversationId });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};
