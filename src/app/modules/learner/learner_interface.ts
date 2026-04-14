import { Types } from 'mongoose';

export type TLearnerProfile = {
  userId: Types.ObjectId;
  skills: string[];
  completedRoadmapsCount: number;
  completedSessionsCount: number;
  activeRoadmapId?: Types.ObjectId;
};
