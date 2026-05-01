import { model, Schema } from 'mongoose';
import { TRole, TUser } from './user_interface';

const role: TRole[] = ['learner', 'mentor', 'admin'];

const userSchema = new Schema<TUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: role,
        message: 'User role must be learner, mentor or admin.',
      },
      required: [true, 'User role is required.'],
    },
    password: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
    },
    google: {
      googleId: {
        type: String,
      },
      roleUpdated: {
        type: Boolean,
      },
    },
    profileImage: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<TUser>('User', userSchema);
