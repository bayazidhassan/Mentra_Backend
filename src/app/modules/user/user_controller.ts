import { RequestHandler } from 'express';
import { userService } from './user_service';

const register: RequestHandler = async (req, res) => {
  try {
    const result = await userService.register(req.body);

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

const getMe: RequestHandler = async (req, res) => {
  try {
    const user = await userService.getMe(req.user?.id as string);
    res.status(200).json({
      success: true,
      message: 'User fetched successfully.',
      data: user,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: (err as Error).message || 'User not found.',
      data: null,
    });
  }
};

export const userController = {
  register,
  getMe,
};
