import { RequestHandler } from 'express';
import { generateToken } from '../../utils/generateToken';
import { authService } from './auth_service';

const login: RequestHandler = async (req, res) => {
  try {
    const user = await authService.login(req.body);

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Login failed.',
      data: null,
    });
  }
};

const googleLogin: RequestHandler = async (req, res) => {
  try {
    const { idToken } = req.body;
    const user = await authService.googleLogin(idToken);

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Google login failed.',
      data: null,
    });
  }
};

const logout: RequestHandler = (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
    data: null,
  });
};

export const authController = {
  login,
  googleLogin,
  logout,
};
