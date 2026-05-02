import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { getBackendURL } from '../../config/env';
import { TAuthUser } from '../../middleware/authenticate';
import {
  createAccessToken,
  createRefreshToken,
} from '../../utils/generateToken';
import { sendToEmail } from '../../utils/sendToEmail';
import { Learner } from '../learner/learner_model';
import { Mentor } from '../mentor/mentor_model';
import { TUser } from '../user/user_interface';
import { User } from '../user/user_model';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (
  payload: Pick<TUser, 'name' | 'email' | 'role' | 'password'>,
) => {
  const session = await mongoose.startSession();
  let user: any = null;

  try {
    session.startTransaction();

    const { email, password, role } = payload;
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new Error('User already exists.');
    }

    const saltRounds = Number(process.env.BCRYPT_SALT) || 12;
    const hashedPassword = await bcrypt.hash(password as string, saltRounds);

    const newUser = await User.create(
      [{ ...payload, password: hashedPassword }],
      { session },
    );

    user = newUser[0];

    if (role === 'learner') {
      await Learner.create([{ userId: user._id }], { session });
    }
    if (role === 'mentor') {
      await Mentor.create([{ userId: user._id }], { session });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  const safeUser = await User.findById(user._id).select('-password');
  if (!safeUser) throw new Error('User not found.');

  try {
    const emailToken = jwt.sign(
      { email: user.email },
      process.env.VERIFY_EMAIL_SECRET!,
      { expiresIn: '1h' },
    );
    const verificationLink = `${getBackendURL()}/api/v1/auth/verify_email/${emailToken}`;
    await sendToEmail(
      user.email,
      'Verify Your Email.',
      `<h3>Welcome to Mentra</h3>
       <p>Please verify your email within 1 hour: <a href="${verificationLink}">Verify Email</a></p>`,
    );
  } catch (emailError) {
    console.error('[EMAIL ERROR]', emailError);
  }

  return safeUser;
};

const verifyEmail = async (token: string) => {
  const decoded = jwt.verify(
    token,
    process.env.VERIFY_EMAIL_SECRET!,
  ) as JwtPayload;

  const user = await User.findOne({ email: decoded.email });
  if (!user) {
    throw new Error('Invalid token.');
  }
  if (user.isVerified) {
    throw new Error('Email is already verified.');
  }

  user.isVerified = true;
  await user.save();

  return user;
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
  if (!user.password && user.google?.googleId) {
    throw new Error(
      "Please sign in with Google. This account doesn't support password login.",
    );
  }

  const isMatch = await bcrypt.compare(payload.password!, user.password!);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const safeUser = await User.findById(user._id).select('-password');
  if (!safeUser) {
    throw new Error('User not found.');
  }

  const accessToken = createAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const refreshToken = createRefreshToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return { safeUser, accessToken, refreshToken };
};

const googleLogin = async (idToken: string) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID as string,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token.');

  const { sub: googleId, email, name, picture } = payload;

  // existing google user
  let user = await User.findOne({ 'google.googleId': googleId });
  if (user) {
    if (user.isBanned) {
      throw new Error('Your account has been banned.');
    }
    if (user.role === 'mentor') {
      const mentor = await Mentor.findOne({ userId: user._id });
      if (!mentor?.isApproved) {
        throw new Error('Your account has not been approved yet.');
      }
    }
    const accessToken = createAccessToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const refreshToken = createRefreshToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
    return { user, accessToken, refreshToken, isNewUser: false };
  }

  // existing email user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.isBanned) {
      throw new Error('Your account has been banned.');
    }
    if (existingUser.role === 'mentor') {
      const mentor = await Mentor.findOne({ userId: existingUser._id });
      if (!mentor?.isApproved) {
        throw new Error('Your account has not been approved yet.');
      }
    }
    existingUser.google = { googleId, roleUpdated: true };
    existingUser.profileImage = picture;
    existingUser.isVerified = true;
    await existingUser.save();
    const accessToken = createAccessToken({
      id: existingUser._id.toString(),
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    });
    const refreshToken = createRefreshToken({
      id: existingUser._id.toString(),
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    });
    return { user: existingUser, accessToken, refreshToken, isNewUser: false };
  }

  // new user
  user = await User.create({
    name,
    email,
    google: { googleId, roleUpdated: false },
    profileImage: picture,
    role: 'learner',
    isVerified: true,
  });
  if (!user) throw new Error('Failed to create user.');

  const accessToken = createAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const refreshToken = createRefreshToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return { user, accessToken, refreshToken, isNewUser: true };
};

const setRole = async (userId: string, role: 'learner' | 'mentor') => {
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

    const accessToken = createAccessToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const refreshToken = createRefreshToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { role, accessToken, refreshToken };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const refreshToken = async (token: string) => {
  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN!) as TAuthUser;

  const accessToken = createAccessToken({
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
  });

  return { accessToken };
};

export const authService = {
  register,
  verifyEmail,
  login,
  googleLogin,
  setRole,
  refreshToken,
};
