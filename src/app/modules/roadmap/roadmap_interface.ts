import { Types } from 'mongoose';

export type TStepStatus = 'not_started' | 'in_progress' | 'completed';

export type TStep = {
  title: string;
  description?: string;
  resources?: string[];
  status: TStepStatus;
  order: number;
};

export type TRoadmap = {
  learner: Types.ObjectId;
  title: string;
  description?: string;
  goal: string;
  steps: TStep[];
  isAIGenerated: boolean;
  totalSteps: number;
  completedSteps: number;
};
