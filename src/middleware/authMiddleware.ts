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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized! Please login.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN!) as TAuthUser;

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
