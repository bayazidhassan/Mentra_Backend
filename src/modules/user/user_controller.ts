import { RequestHandler } from 'express';
import { generateToken } from '../../utils/generateToken';
import { userService } from './user_service';

const register: RequestHandler = async (req, res) => {
  try {
    const result = await userService.userRegistration(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        _id: result._id,
        name: result.name,
        email: result.email,
        role: result.role,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Registration failed.',
      data: null,
    });
  }
};

const login: RequestHandler = async (req, res) => {
  try {
    const user = await userService.userLogin(req.body);

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.cookie('token', token, {
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

export const userController = {
  register,
  login,
};
