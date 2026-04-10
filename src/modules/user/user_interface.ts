export type TRole = 'learner' | 'mentor' | 'admin';

export type TUser = {
  name: string;
  email: string;
  role: TRole;
  password?: string;
  googleId?: string;
  profileImage?: string;
  //bio?: string;
  //phone?: string;
  // skills?: string[];
  // learningGoal?: string;
  // availability?: string;
  // hourlyRate?: number;
  // experience?: string;
  // rating?: number;
  // totalReviews?: number;
  // savedRoadmaps?: string[];
  // completedSessions?: number;
  // lastLogin?: Date;
  isVerified: boolean;
  isApproved: boolean;
  isBanned: boolean;
};
