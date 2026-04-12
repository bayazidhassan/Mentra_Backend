import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type TAuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'mentor' | 'admin';
};

declare global {
  namespace Express {
    interface Request {
      user?: TAuthUser;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login.',
        data: null,
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as TAuthUser;

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      data: null,
    });
  }
};
