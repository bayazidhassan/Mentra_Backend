import { Types } from 'mongoose';

export type TDays = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export type TAvailability = {
  day: TDays;
  startTime: string;
  endTime: string;
};

export type TMentor = {
  userId: Types.ObjectId;
  bio?: string;
  experience?: string;
  skills?: string[];
  hourlyRate?: number;
  availability?: TAvailability[];
  rating?: number;
  totalReviews?: number;
  isApproved: boolean;
};
