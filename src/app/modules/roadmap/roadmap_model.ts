import { model, Schema } from 'mongoose';
import {
  TResource,
  TRoadmap,
  TRoadmapStatus,
  TStepStatus,
} from './roadmap_interface';

const stepStatus: TStepStatus[] = ['not_started', 'in_progress', 'completed'];
const roadmapStatus: TRoadmapStatus[] = ['active', 'completed'];

const resourceSchema = new Schema<TResource>(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required.'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required.'],
      trim: true,
    },
  },
  { _id: false },
);

const stepSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Step title is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: stepStatus,
        message: 'Invalid step status.',
      },
      default: 'not_started',
    },
    order: {
      type: Number,
      required: [true, 'Step order is required.'],
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: true },
);

const roadmapSchema = new Schema<TRoadmap>(
  {
    learner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required.'],
    },
    title: {
      type: String,
      required: [true, 'Roadmap title is required.'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    goal: {
      type: String,
      required: [true, 'Roadmap goal is required.'],
      trim: true,
    },
    steps: {
      type: [stepSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: roadmapStatus,
        message: 'Invalid roadmap status.',
      },
      default: 'active',
    },
    isAIGenerated: {
      type: Boolean,
      default: false,
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    completedSteps: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const Roadmap = model<TRoadmap>('Roadmap', roadmapSchema);
