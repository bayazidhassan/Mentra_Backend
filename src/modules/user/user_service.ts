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

export const userService = {
  userRegistration,
};
