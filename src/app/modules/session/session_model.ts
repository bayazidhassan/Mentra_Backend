import { model, Schema } from 'mongoose';
import { TSession } from './session_interface';

const sessionSchema = new Schema<TSession>(
  {
    learner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required.'],
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required.'],
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    description: {
      type: String,
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Schedule is required.'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required.'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'completed', 'cancelled'],
        message: 'Status must be pending, confirmed, completed or cancelled.',
      },
      default: 'pending',
    },
    meetingLink: {
      type: String,
    },
    price: {
      type: Number,
      required: [true, 'Price is required.'],
    },
  },
  {
    timestamps: true,
  },
);

export const Session = model<TSession>('Session', sessionSchema);
