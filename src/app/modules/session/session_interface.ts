export type TSessionStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export type TSession = {
  learner: string;
  mentor: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  status: TSessionStatus;
  meetingLink?: string;
  price: number;
};
