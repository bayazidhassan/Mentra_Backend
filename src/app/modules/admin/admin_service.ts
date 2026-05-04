import { getFrontendURL } from '../../config/env';
import { sendToEmail } from '../../utils/sendToEmail';
import { Mentor } from '../mentor/mentor_model';
import { Payment } from '../payment/payment_model';
import { Session } from '../session/session_model';
import { User } from '../user/user_model';

// ─── getDashboardStats ────────────────────────────────────────────────────────

const getDashboardStats = async () => {
  const [
    totalLearners,
    totalMentors,
    totalSessions,
    pendingApprovals,
    revenueData,
    recentSessions,
  ] = await Promise.all([
    User.countDocuments({ role: 'learner' }),
    User.countDocuments({ role: 'mentor' }),
    Session.countDocuments(),
    Mentor.countDocuments({ isApproved: false }),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Session.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const totalRevenue = revenueData[0]?.total ?? 0;
  const adminProfit = parseFloat((totalRevenue * 0.05).toFixed(2));

  // Enrich recent sessions
  const enrichedSessions = await Promise.all(
    recentSessions.map(async (session) => {
      const [learner, mentor] = await Promise.all([
        User.findById(session.learner).select('name email').lean(),
        User.findById(session.mentor).select('name email').lean(),
      ]);
      return {
        ...session,
        _id: session._id.toString(),
        learnerName: learner?.name ?? 'Unknown',
        mentorName: mentor?.name ?? 'Unknown',
      };
    }),
  );

  return {
    stats: {
      totalLearners,
      totalMentors,
      totalUsers: totalLearners + totalMentors,
      totalSessions,
      pendingApprovals,
      totalRevenue,
      adminProfit,
    },
    recentSessions: enrichedSessions,
  };
};

// ─── getLearners ──────────────────────────────────────────────────────────────

const getLearners = async ({
  search,
  page,
  limit,
}: {
  search?: string;
  page: number;
  limit: number;
}) => {
  const query: Record<string, unknown> = { role: 'learner' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('name email profileImage isBanned createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  return {
    learners: users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      profileImage: u.profileImage,
      isBanned: u.isBanned,
      createdAt: u.createdAt,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── banUser ──────────────────────────────────────────────────────────────────

const banUser = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isBanned: true } },
    { returnDocument: 'after' },
  );
  if (!user) throw new Error('User not found.');
  return user;
};

const unbanUser = async (userId: string) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { isBanned: false } },
    { returnDocument: 'after' },
  );
  if (!user) throw new Error('User not found.');
  return user;
};

// ─── getMentors ───────────────────────────────────────────────────────────────

const getMentors = async ({
  search,
  approved,
  page,
  limit,
}: {
  search?: string;
  approved: boolean;
  page: number;
  limit: number;
}) => {
  // Find mentor profiles with approval status
  const mentorProfiles = await Mentor.find({ isApproved: approved }).lean();
  const userIds = mentorProfiles.map((m) => m.userId);

  const userQuery: Record<string, unknown> = { _id: { $in: userIds } };
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(userQuery);
  const users = await User.find(userQuery)
    .select('name email profileImage isBanned createdAt')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const profileMap = new Map(
    mentorProfiles.map((m) => [m.userId.toString(), m]),
  );

  return {
    mentors: users.map((u) => {
      const profile = profileMap.get(u._id.toString());
      return {
        _id: u._id.toString(),
        mentorProfileId: profile?._id.toString(),
        name: u.name,
        email: u.email,
        profileImage: u.profileImage,
        isBanned: u.isBanned,
        isApproved: profile?.isApproved ?? false,
        bio: profile?.bio,
        experience: profile?.experience,
        rating: profile?.rating ?? 0,
        totalReviews: profile?.totalReviews ?? 0,
        createdAt: u.createdAt,
      };
    }),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

// ─── approveMentor ────────────────────────────────────────────────────────────

const approveMentor = async (mentorProfileId: string) => {
  const mentor = await Mentor.findByIdAndUpdate(
    mentorProfileId,
    { $set: { isApproved: true } },
    { returnDocument: 'after' },
  );
  if (!mentor) throw new Error('Mentor not found.');
  const user = await User.findById(mentor.userId);
  if (!user) throw new Error('User not found.');
  const loginLink = `${getFrontendURL()}/login`;
  await sendToEmail(
    user.email,
    'Your Account Has Been Approved',
    `<h3>Welcome to Mentra 🎉</h3>
     <p>Your account is now approved.</p>
     <p><a href="${loginLink}">Click here to login</a></p>`,
  );
  return mentor;
};

// ─── getSessions ─────────────────────────────────────────────────────────────

const getSessions = async ({
  search,
  status,
  page,
  limit,
}: {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}) => {
  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const total = await Session.countDocuments(query);
  const sessions = await Session.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await Promise.all(
    sessions.map(async (session) => {
      const [learner, mentor] = await Promise.all([
        User.findById(session.learner).select('name email').lean(),
        User.findById(session.mentor).select('name email').lean(),
      ]);
      return {
        ...session,
        _id: session._id.toString(),
        learnerName: learner?.name ?? 'Unknown',
        learnerEmail: learner?.email ?? '',
        mentorName: mentor?.name ?? 'Unknown',
        mentorEmail: mentor?.email ?? '',
      };
    }),
  );

  // Filter by search after enrichment
  const filtered = search
    ? enriched.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.learnerName.toLowerCase().includes(search.toLowerCase()) ||
          s.mentorName.toLowerCase().includes(search.toLowerCase()) ||
          s.learnerEmail.toLowerCase().includes(search.toLowerCase()) ||
          s.mentorEmail.toLowerCase().includes(search.toLowerCase()),
      )
    : enriched;

  return {
    sessions: filtered,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const adminService = {
  getDashboardStats,
  getLearners,
  banUser,
  unbanUser,
  getMentors,
  approveMentor,
  getSessions,
};
