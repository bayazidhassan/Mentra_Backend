import { Types } from 'mongoose';

export type TSessionStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

export type TSession = {
  learner: Types.ObjectId;
  mentor: Types.ObjectId;
  roadmap?: Types.ObjectId;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  price?: number;
  paymentStatus?: 'unpaid' | 'paid';
  meetingLink?: string;
  status: TSessionStatus;
  ratingByLearner?: number;
  feedbackByLearner?: string;
  ratingByMentor?: number;
  feedbackByMentor?: string;
};
