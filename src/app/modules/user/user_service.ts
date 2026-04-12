import bcrypt from 'bcryptjs';
import { TUser } from './user_interface';
import { User } from './user_model';

const register = async (
  payload: Pick<TUser, 'name' | 'email' | 'role' | 'password'>,
) => {
  const hashedPassword = await bcrypt.hash(payload.password as string, 12);
  const result = await User.create({ ...payload, password: hashedPassword });
  return result;
};

const getMe = async (id: string) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};

const getRecommendedMentors = async (limit: number = 6) => {
  const mentors = await User.find({
    role: 'mentor',
    isApproved: false,
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
    isApproved: false,
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
    isApproved: false,
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
  register,
  getMe,
  getRecommendedMentors,
  getMentors,
  getMentorById,
  updateProfile,
  changePassword,
};
