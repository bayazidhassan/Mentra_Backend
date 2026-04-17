import { Schema, model } from 'mongoose';
import { TAvailability, TDays, TMentor } from './mentor_interface';

const Days: TDays[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const availabilitySchema = new Schema<TAvailability>(
  {
    day: {
      type: String,
      enum: {
        values: Days,
        message: 'Day must be Sun, Mon, Tue, Wed, Thu, Fri or Sat.',
      },
    },
    startTime: String,
    endTime: String,
  },
  { _id: false },
);

const mentorSchema = new Schema<TMentor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID required.'],
      unique: true,
    },
    bio: {
      type: String,
    },
    experience: {
      type: String,
    },
    hourlyRate: {
      type: Number,
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Mentor = model<TMentor>('Mentor', mentorSchema);
