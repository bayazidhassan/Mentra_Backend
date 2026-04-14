import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Learner } from '../learner/learner_model';
import { Mentor } from '../mentor/mentor_model';
import { User } from './user_model';

const getMe = async (id: string) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};

export const updateRole = async (
  userId: string,
  role: 'learner' | 'mentor',
) => {
  if (!role || !['learner', 'mentor'].includes(role)) {
    throw new Error('Role must be learner or mentor.');
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found.');
    }

    user.role = role;
    await user.save({ session });

    if (role === 'learner') {
      await Learner.create([{ userId: user._id }], { session });
    }
    if (role === 'mentor') {
      await Mentor.create([{ userId: user._id }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    const safeUser = await User.findById(userId).select('-password');
    if (!safeUser) {
      throw new Error('User not found.');
    }
    return safeUser;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getRecommendedMentors = async (limit: number = 6) => {
  const mentors = await User.find({
    role: 'mentor',
    isApproved: true,
    isBanned: false,
  })
    .select('name email profileImage')
    .limit(limit);

  return mentors;
};

const getMentors = async (query: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, page = 1, limit = 9 } = query;
  const skip = (page - 1) * limit;

  const filter: any = {
    role: 'mentor',
    isApproved: true,
    isBanned: false,
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [mentors, total] = await Promise.all([
    User.find(filter).select('name email profileImage').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    mentors,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const getMentorById = async (id: string) => {
  const mentor = await User.findOne({
    _id: id,
    role: 'mentor',
    isApproved: true,
    isBanned: false,
  }).select('name email profileImage');

  if (!mentor) {
    throw new Error('Mentor not found.');
  }

  return mentor;
};

const updateProfile = async (
  id: string,
  payload: {
    name?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    hourlyRate?: number;
    availability?: string;
  },
) => {
  const user = await User.findByIdAndUpdate(
    id,
    { ...payload },
    { new: true, runValidators: true },
  ).select('-password');

  if (!user) {
    throw new Error('User not found.');
  }

  return user;
};

const changePassword = async (
  id: string,
  payload: {
    currentPassword: string;
    newPassword: string;
  },
) => {
  const user = await User.findById(id).select('+password');
  if (!user) {
    throw new Error('User not found.');
  }

  if (!user.password) {
    throw new Error('Password not set. Please use Google login.');
  }

  const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
  if (!isMatch) {
    throw new Error('Current password is incorrect.');
  }

  user.password = await bcrypt.hash(payload.newPassword, 12);
  await user.save();

  return { message: 'Password changed successfully.' };
};

export const userService = {
  getMe,
  updateRole,
  getRecommendedMentors,
  getMentors,
  getMentorById,
  updateProfile,
  changePassword,
};
