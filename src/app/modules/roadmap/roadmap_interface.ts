import { Types } from 'mongoose';

export type TStepStatus = 'not_started' | 'in_progress' | 'completed';
export type TRoadmapStatus = 'active' | 'completed';

export type TResource = {
  title: string;
  url: string;
};

export type TStep = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  resources?: TResource[];
  status: TStepStatus;
  order: number;
  completedAt?: Date;
};

export type TRoadmap = {
  learner: Types.ObjectId;
  title: string;
  description?: string;
  goal: string;
  steps: TStep[];
  status: TRoadmapStatus;
  isAIGenerated: boolean;
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  completedAt?: Date;
};
