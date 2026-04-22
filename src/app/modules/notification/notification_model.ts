import { Schema, model } from 'mongoose';
import { TNotification } from './notification_interface';

const notificationSchema = new Schema<TNotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User id is required.'],
    },
    type: {
      type: String,
      enum: ['session', 'roadmap', 'payment', 'system'],
      required: [true, 'Type is required.'],
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Notification = model<TNotification>(
  'Notification',
  notificationSchema,
);
