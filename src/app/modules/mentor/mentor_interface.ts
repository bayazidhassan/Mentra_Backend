import { Types } from 'mongoose';

export type TAvailability = {
  day: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
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
