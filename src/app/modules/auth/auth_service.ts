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
      [{ ...payload, password: hashedPassword }],
      { session },
    );

    const user = newUser[0];

    if (role === 'learner') {
      await Learner.create([{ userId: user._id }], { session });
    }
    if (role === 'mentor') {
      await Mentor.create([{ userId: user._id }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    const safeUser = await User.findById(user._id).select('-password');
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

const login = async (payload: Pick<TUser, 'email' | 'password'>) => {
  const user = await User.findOne({ email: payload.email }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password.');
  }
  if (user.isBanned) {
    throw new Error('Your account has been banned.');
  }
  if (!user.isVerified) {
    throw new Error('Your account has not been verified yet.');
  }
  if (user.role === 'mentor') {
    const mentor = await Mentor.findOne({ userId: user._id });
    if (!mentor?.isApproved) {
      throw new Error('Your account has not been approved yet.');
    }
  }

  const isMatch = await bcrypt.compare(
    payload.password as string,
    user.password as string,
  );
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const safeUser = await User.findById(user._id).select('-password');
  if (!safeUser) {
    throw new Error('User not found.');
  }
  return safeUser;
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
  let user = await User.findOne({ 'google.googleId': googleId });
  if (user) {
    return {
      user,
      isNewUser: false,
    };
  }

  //check if email already registered manually
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.google = {
      googleId,
      roleUpdated: true,
    };
    existingUser.profileImage = picture;
    existingUser.isVerified = true;
    await existingUser.save();
    return {
      user: existingUser,
      isNewUser: false,
    };
  }

  //create new user with default role
  user = await User.create({
    name,
    email,
    google: {
      googleId,
      roleUpdated: false,
    },
    profileImage: picture,
    role: 'learner', //temporary default
    isVerified: true,
  });

  return {
    user,
    isNewUser: true,
  };
};

export const authService = {
  register,
  login,
  googleLogin,
};
