import { Types } from 'mongoose';

export type TLearner = {
  userId: Types.ObjectId;
  skills: string[];
  completedRoadmapsCount: number;
  completedSessionsCount: number;
  activeRoadmapId?: Types.ObjectId;
};
