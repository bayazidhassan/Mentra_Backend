import { Request, Response } from 'express';
import { userService } from './user_service';

const userRegistration = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const result = await userService.userRegistration(data);

    res.status(200).json({
      success: true,
      message: 'Registration successful.',
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Something went wrong.',
      error: (err as Error).message,
    });
  }
};

export const userController = {
  userRegistration,
};
