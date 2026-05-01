import { Types } from 'mongoose';
import { Session } from '../session/session_model';
import { User } from '../user/user_model';

// ─── getMyLearners ────────────────────────────────────────────────────────────
const getMyLearners = async (mentorUserId: string) => {
  const sessions = await Session.find({
    mentor: new Types.ObjectId(mentorUserId),
  })
    .select('learner status')
    .lean();

  const learnerIds = [...new Set(sessions.map((s) => s.learner.toString()))];

  const learners = await Promise.all(
    learnerIds.map(async (learnerId) => {
      const user = await User.findById(learnerId)
        .select('name email profileImage')
        .lean();

      const sessionCount = sessions.filter(
        (s) => s.learner.toString() === learnerId,
      ).length;

      const completedCount = sessions.filter(
        (s) => s.learner.toString() === learnerId && s.status === 'completed',
      ).length;

      return {
        _id: learnerId,
        name: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        profileImage: user?.profileImage,
        totalSessions: sessionCount,
        completedSessions: completedCount,
      };
    }),
  );

  return learners;
};

// ─── getAllLearners ────────────────────────────────────────────────────────────

const getAllLearners = async ({
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
    .select('name email profileImage')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    learners: users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      profileImage: u.profileImage,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const learnerService = {
  getMyLearners,
  getAllLearners,
};
