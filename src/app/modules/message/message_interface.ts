import { Types } from 'mongoose';

export type TMessage = {
  conversationId: string;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  text: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};
