import jwt from 'jsonwebtoken';

type TTokenPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const generateToken = (payload: TTokenPayload) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};
