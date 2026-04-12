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

export const userService = {
  register,
  getMe,
};
