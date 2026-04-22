import { model, Schema } from 'mongoose';
import { TSession } from './session_interface';

const sessionSchema = new Schema<TSession>(
  {
    learner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner id is required.'],
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor id is required.'],
    },
    roadmap: {
      type: Schema.Types.ObjectId,
      ref: 'Roadmap',
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Schedule is required.'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration minutes is required.'],
    },
    price: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    meetingLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
    },
    ratingByLearner: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedbackByLearner: {
      type: String,
    },
    ratingByMentor: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedbackByMentor: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Session = model<TSession>('Session', sessionSchema);
