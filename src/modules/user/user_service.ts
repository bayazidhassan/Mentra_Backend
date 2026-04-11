import bcrypt from 'bcryptjs';
import { TUser } from './user_interface';
import { User } from './user_model';

const userRegistration = async (
  payload: Pick<TUser, 'name' | 'email' | 'role' | 'password'>,
) => {
  const hashedPassword = await bcrypt.hash(payload.password as string, 12);
  const result = await User.create({ ...payload, password: hashedPassword });
  return result;
};

const userLogin = async (payload: Pick<TUser, 'email' | 'password'>) => {
  const user = await User.findOne({ email: payload.email }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  if (user.isBanned) {
    throw new Error('Your account has been banned.');
  }

  const isMatch = await bcrypt.compare(
    payload.password as string,
    user.password as string,
  );
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  return user;
};

export const userService = {
  userRegistration,
  userLogin,
};
