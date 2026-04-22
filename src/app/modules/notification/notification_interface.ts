import { Types } from 'mongoose';

export type TNotificationType = 'session' | 'roadmap' | 'payment' | 'system';

export type TNotification = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: TNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};
