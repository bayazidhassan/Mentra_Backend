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

export const userController = {
  register,
};
