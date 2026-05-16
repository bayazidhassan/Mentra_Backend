import { Types } from 'mongoose';
import { Session } from '../session/session_model';
import { User } from '../user/user_model';
import { Learner } from './learner_model';

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

const getTopLearners = async () => {
  const learners = await Learner.find({
    $or: [
      { completedSessionsCount: { $gt: 0 } },
      { completedRoadmapsCount: { $gt: 0 } },
    ],
  })
    .sort({ completedSessionsCount: -1, completedRoadmapsCount: -1 })
    .limit(6)
    .lean();

  const enriched = await Promise.all(
    learners.map(async (learner) => {
      const user = await User.findById(learner.userId)
        .select('name email profileImage')
        .lean();

      return {
        _id: learner._id.toString(),
        name: user?.name ?? '',
        email: user?.email ?? '',
        profileImage: user?.profileImage ?? null,
        completedSessions: learner.completedSessionsCount,
        completedRoadmaps: learner.completedRoadmapsCount,
        skills: learner.skills ?? [],
      };
    }),
  );

  return enriched;
};

export const learnerService = {
  getMyLearners,
  getAllLearners,
  getTopLearners,
};
