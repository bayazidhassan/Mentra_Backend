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
    isApproved: true,
    isBanned: false,
  })
    .select('name email profileImage')
    .limit(limit);

  return mentors;
};

export const userService = {
  register,
  getMe,
  getRecommendedMentors,
};
