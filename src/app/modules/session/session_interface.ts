import { Types } from 'mongoose';

export type TSessionStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type TSession = {
  learner: Types.ObjectId;
  mentor: Types.ObjectId;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  status: TSessionStatus;
  meetingLink?: string;
  price: number;
};
