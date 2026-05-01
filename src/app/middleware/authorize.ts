import { NextFunction, Request, Response } from 'express';
import { TRole } from '../modules/user/user_interface';

export const authorize = (...roles: TRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized! Please login.',
        data: null,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
        data: null,
      });
    }

    next();
  };
};
