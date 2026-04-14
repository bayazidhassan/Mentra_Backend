import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import { Learner } from '../learner/learner_model';
import { Mentor } from '../mentor/mentor_model';
import { TUser } from '../user/user_interface';
import { User } from '../user/user_model';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (
  payload: Pick<TUser, 'name' | 'email' | 'role' | 'password'>,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { email, password, role } = payload;
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new Error('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(password as string, 12);

    const newUser = await User.create(
      [
        {
          ...payload,
          password: hashedPassword,
        },
      ],
      { session },
    );

    const user = newUser[0];

    if (role === 'learner') {
      await Learner.create(
        [
          {
            userId: user._id,
          },
        ],
        { session },
      );
    }
    if (role === 'mentor') {
      await Mentor.create(
        [
          {
            userId: user._id,
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    const safeUser = await User.findById(user._id).select('-password');
    return safeUser;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const login = async (payload: Pick<TUser, 'email' | 'password'>) => {
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

const googleLogin = async (idToken: string) => {
  //verify ID token
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID as string,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token.');
  }

  const { sub: googleId, email, name, picture } = payload;

  //check if user already exists with googleId
  let user = await User.findOne({ googleId });
  if (user) return user;

  //check if email already registered manually
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.googleId = googleId;
    existingUser.profileImage = picture;
    await existingUser.save();
    return existingUser;
  }

  //create new user
  user = await User.create({
    name,
    email,
    googleId,
    profileImage: picture,
    role: 'learner',
  });

  return user;
};

export const authService = {
  register,
  login,
  googleLogin,
};
