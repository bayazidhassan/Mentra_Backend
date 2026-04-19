import jwt from 'jsonwebtoken';

type TTokenPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const createAccessToken = (payload: TTokenPayload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN!, {
    expiresIn: '15m',
  });
};

export const createRefreshToken = (payload: TTokenPayload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN!, {
    expiresIn: '7d',
  });
};
