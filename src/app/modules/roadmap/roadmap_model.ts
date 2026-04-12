import { model, Schema } from 'mongoose';
import { TRoadmap, TStep } from './roadmap_interface';

const stepSchema = new Schema<TStep>({
  title: {
    type: String,
    required: [true, 'Step title is required.'],
    trim: true,
  },
  description: {
    type: String,
  },
  resources: {
    type: [String],
  },
  status: {
    type: String,
    enum: {
      values: ['not_started', 'in_progress', 'completed'],
      message: 'Status must be not_started, in_progress or completed.',
    },
    default: 'not_started',
  },
  order: {
    type: Number,
    required: [true, 'Step order is required.'],
  },
});

const roadmapSchema = new Schema<TRoadmap>(
  {
    learner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required.'],
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
    },
    description: {
      type: String,
    },
    goal: {
      type: String,
      required: [true, 'Goal is required.'],
      trim: true,
    },
    steps: {
      type: [stepSchema],
      default: [],
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
  },
  {
    timestamps: true,
  },
);

export const Roadmap = model<TRoadmap>('Roadmap', roadmapSchema);
