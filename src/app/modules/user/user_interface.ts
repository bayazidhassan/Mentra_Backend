export type TRole = 'learner' | 'mentor' | 'admin';

export type TUser = {
  name: string;
  email: string;
  role: TRole;
  password?: string;
  googleId?: string;
  profileImage?: string;
  bio?: string;
  phone?: string;
  isVerified: boolean;
  isBanned: boolean;
};
