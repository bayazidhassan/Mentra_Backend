import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { TProfilePayload } from '../../../types/profile';
import uploadImageToCloudinary from '../../utils/uploadImageToCloudinary';
import { Learner } from '../learner/learner_model';
import { Mentor } from '../mentor/mentor_model';
import { User } from './user_model';

const getMe = async (id: string) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new Error('User not found.');
  }

  let roleData: any = {};

  //learner extra data
  if (user.role === 'learner') {
    const learner = await Learner.findOne({ userId: id });
    if (learner) {
      roleData = {
        skills: learner.skills,
      };
    }
  }
  //mentor extra data
  if (user.role === 'mentor') {
    const mentor = await Mentor.findOne({ userId: id });
    if (mentor) {
      roleData = {
        bio: mentor.bio,
        experience: mentor.experience,
        hourlyRate: mentor.hourlyRate,
        availability: mentor.availability,
      };
    }
  }

  //merge everything
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    phone: user.phone,
    google: user.google,
    ...roleData,
  };
};

const updateRole = async (userId: string, role: 'learner' | 'mentor') => {
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
    if (!user.google) {
      throw new Error('Google data not found.');
    }
    if (user.google.roleUpdated) {
      throw new Error('Role already updated.');
    }

    user.role = role;
    user.google.roleUpdated = true;
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

const updateProfile = async (
  id: string,
  payload: TProfilePayload,
  buffer?: Buffer,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(id).session(session);
    if (!user) {
      throw new Error('User not found.');
    }

    let profileImage: string | undefined;
    if (buffer) {
      profileImage = await uploadImageToCloudinary(id, buffer);
    }

    //Update user fields
    user.name = payload.name ?? user.name;
    user.phone = payload.phone ?? user.phone;
    if (profileImage) {
      user.profileImage = profileImage;
    }
    await user.save({ session });

    //update role based
    let learnerData = null;
    let mentorData = null;
    if (user.role === 'learner') {
      const learner = await Learner.findOne({ userId: id }).session(session);
      if (!learner) {
        throw new Error('Learner not found.');
      }
      if (payload.skills) {
        learner.skills = JSON.parse(payload.skills);
      }
      await learner.save({ session });
      learnerData = learner;
    }

    if (user.role === 'mentor') {
      const mentor = await Mentor.findOne({ userId: id }).session(session);
      if (!mentor) {
        throw new Error('Mentor not found.');
      }
      if (payload.bio) mentor.bio = payload.bio;
      if (payload.experience) mentor.experience = payload.experience;
      if (payload.hourlyRate) mentor.hourlyRate = Number(payload.hourlyRate);
      if (payload.availability)
        mentor.availability = JSON.parse(payload.availability);
      await mentor.save({ session });
      mentorData = mentor;
    }

    await session.commitTransaction();
    session.endSession();

    //return updated user + learner/mentor
    const updatedUser = await User.findById(id);
    const baseUser = updatedUser!.toObject();
    if (user.role === 'learner' && learnerData) {
      return {
        ...baseUser,
        skills: learnerData.skills,
      };
    }
    if (user.role === 'mentor' && mentorData) {
      return {
        ...baseUser,
        bio: mentorData.bio,
        experience: mentorData.experience,
        hourlyRate: mentorData.hourlyRate,
        availability: mentorData.availability,
      };
    }
    return baseUser;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
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
