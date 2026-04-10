import { Request, RequestHandler, Response } from 'express';
import { userService } from './user_service';

const userRegistration = async (req: Request, res: Response) => {
  try {
    const result = await userService.userRegistration(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: 'Registration failed.',
      error: (err as Error).message,
    });
  }
};

const userLogin: RequestHandler = async (req, res) => {
  try {
    const result = await userService.userLogin(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Login failed.',
      error: (err as Error).message,
    });
  }
};

export const userController = {
  userRegistration,
  userLogin,
};
