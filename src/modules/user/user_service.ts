import { TUser } from './user_interface';
import { User } from './user_model';

const userRegistration = async (
  payload: Pick<TUser, 'name' | 'email' | 'role' | 'password'>,
) => {
  const result = await User.create(payload);
  if (!result) {
    throw new Error('Registration failed.');
  }
  return result;
};

const userLogin = async (payload: Pick<TUser, 'email' | 'password'>) => {
  const { email, password } = payload;
  const isUserExists = await User.findOne({ email }).select('+password');
  if (!isUserExists) {
    throw new Error('Invalid email or password.');
  }
  if (password !== isUserExists.password) {
    throw new Error('Invalid email or password.');
  }
  return isUserExists;
};

export const userService = {
  userRegistration,
  userLogin,
};
