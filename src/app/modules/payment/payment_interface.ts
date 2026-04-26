import { Types } from 'mongoose';

export type TPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type TPayment = {
  sessionId: Types.ObjectId;
  learnerId: Types.ObjectId;
  mentorId: Types.ObjectId;
  amount: number;
  currency: string;
  status: TPaymentStatus;
  stripeSessionId?: string;
  transactionId?: string;
};
