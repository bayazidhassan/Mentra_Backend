export type TRole = 'learner' | 'mentor' | 'admin';
export type TGoogle = {
  googleId: string;
  roleUpdated: boolean;
};

export type TUser = {
  name: string;
  email: string;
  role: TRole;
  password?: string;
  google?: TGoogle;
  profileImage?: string;
  phone?: string;
  isVerified: boolean;
  isBanned: boolean;
  lastLogin?: Date;
};
