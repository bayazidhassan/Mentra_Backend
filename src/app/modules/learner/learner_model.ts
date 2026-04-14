import { Schema, model } from 'mongoose';
import { TLearner } from './learner_interface';

const learnerSchema = new Schema<TLearner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Learner ID is required.'],
      unique: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    completedRoadmapsCount: {
      type: Number,
      default: 0,
    },

    completedSessionsCount: {
      type: Number,
      default: 0,
    },

    activeRoadmapId: {
      type: Schema.Types.ObjectId,
      ref: 'Roadmap',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const Learner = model<TLearner>('Learner', learnerSchema);
