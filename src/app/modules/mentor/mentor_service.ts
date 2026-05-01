import { Types } from 'mongoose';
import groq from '../../config/groq';
import { Payment } from '../payment/payment_model';
import { Roadmap } from '../roadmap/roadmap_model'; // adjust path
import { Session } from '../session/session_model';
import { User } from '../user/user_model'; // adjust path
import { Mentor } from './mentor_model';

// ─── Types ────────────────────────────────────────────────────────────────────

type TMentorWithUser = {
  _id: string;
  userId: string;
  bio?: string;
  experience?: string;
  hourlyRate?: number;
  rating: number;
  totalReviews: number;
  name: string;
  email: string;
  profileImage?: string;
};

type TSuggestedMentor = TMentorWithUser & {
  matchScore: number; // 1–10
  matchReason: string; // one sentence from AI
};

// ─── getMentors (existing — manual search) ────────────────────────────────────

const getMentors = async ({
  search,
  page,
  limit,
}: {
  search?: string;
  page: number;
  limit: number;
}) => {
  // Find approved mentor profiles
  const mentorDocs = await Mentor.find({ isApproved: true }).lean();
  const userIds = mentorDocs.map((m) => m.userId);

  // Build user query with optional search
  const userQuery: Record<string, unknown> = { _id: { $in: userIds } };
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(userQuery);
  const users = await User.find(userQuery)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Join mentor profile data onto each user
  const mentorMap = new Map(mentorDocs.map((m) => [m.userId.toString(), m]));
  const mentors = users.map((u) => {
    const profile = mentorMap.get(u._id.toString());
    return {
      _id: profile?._id.toString() ?? '',
      userId: u._id.toString(),
      name: u.name,
      email: u.email,
      profileImage: u.profileImage,
      bio: profile?.bio,
      experience: profile?.experience,
      hourlyRate: profile?.hourlyRate,
      rating: profile?.rating ?? 0,
      totalReviews: profile?.totalReviews ?? 0,
    };
  });

  return {
    mentors,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
};

const getMentorById = async (id: string) => {
  const mentor = await Mentor.findById(id).lean();
  if (!mentor) throw new Error('Mentor not found.');

  const user = await User.findById(mentor.userId).lean();
  if (!user) throw new Error('Mentor user not found.');

  return {
    _id: mentor._id.toString(),
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
    bio: mentor.bio,
    experience: mentor.experience,
    hourlyRate: mentor.hourlyRate,
    availability: mentor.availability,
    rating: mentor.rating ?? 0,
    totalReviews: mentor.totalReviews ?? 0,
  };
};

// ─── getSuggestedMentors (AI-powered) ─────────────────────────────────────────

const getSuggestedMentors = async (
  learnerId: string,
): Promise<TSuggestedMentor[]> => {
  // 1. Get learner's active roadmap
  const roadmap = await Roadmap.findOne({
    learner: new Types.ObjectId(learnerId),
    status: 'active',
  }).lean();

  if (!roadmap) {
    throw new Error('You need an active roadmap to get mentor suggestions.');
  }

  // 2. Fetch all approved mentors with their user data
  const mentorDocs = await Mentor.find({ isApproved: true }).lean();
  if (!mentorDocs.length) {
    throw new Error('No mentors available at the moment.');
  }

  const userIds = mentorDocs.map((m) => m.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  // Build flat mentor list for AI context
  const mentorList = mentorDocs
    .map((m) => {
      const user = userMap.get(m.userId.toString());
      if (!user) return null;
      return {
        id: m._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        bio: m.bio ?? '',
        experience: m.experience ?? '',
        hourlyRate: m.hourlyRate,
        rating: m.rating,
        totalReviews: m.totalReviews,
      };
    })
    .filter(Boolean);

  // 3. Ask Groq to score and rank mentors
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    temperature: 0.3, // lower temp for consistent scoring
    messages: [
      {
        role: 'system',
        content:
          'You are a mentor matching engine. You only respond with valid JSON, no markdown, no explanation, no code blocks.',
      },
      {
        role: 'user',
        content: `A learner has the following active learning roadmap:
Title: "${roadmap.title}"
Goal: "${roadmap.goal}"

Here are the available mentors:
${JSON.stringify(
  mentorList.map((m) => ({
    id: m!.id,
    bio: m!.bio,
    experience: m!.experience,
  })),
  null,
  2,
)}

Score each mentor from 1 to 10 based on how well their bio and experience matches the learner's goal and roadmap title. Only include mentors with a score of 6 or above. Return them sorted by score descending.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "mentor profile id",
    "matchScore": 8,
    "matchReason": "One sentence explaining why this mentor is a good match."
  }
]

If no mentors score 6 or above, return an empty array [].`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Failed to get AI suggestions.');

  const cleaned = content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  let scored: { id: string; matchScore: number; matchReason: string }[];
  try {
    scored = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response.');
  }

  if (!Array.isArray(scored) || scored.length === 0) return [];

  // 4. Merge AI scores back with full mentor data
  const mentorById = new Map(mentorList.map((m) => [m!.id, m!]));

  const results: TSuggestedMentor[] = scored
    .filter((s) => mentorById.has(s.id))
    .map((s) => {
      const m = mentorById.get(s.id)!;
      return {
        _id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        profileImage: m.profileImage,
        bio: m.bio,
        experience: m.experience,
        hourlyRate: m.hourlyRate,
        rating: m.rating ?? 0,
        totalReviews: m.totalReviews ?? 0,
        matchScore: s.matchScore,
        matchReason: s.matchReason,
      };
    });

  return results;
};

// ─── Get Mentor Dashboard Stats ────────────────────────────────────────────────────────
const getDashboardStats = async (mentorUserId: string) => {
  const mentorId = new Types.ObjectId(mentorUserId);

  const [
    mentorProfile,
    totalSessions,
    completedSessions,
    pendingSessions,
    acceptedSessions,
    recentSessions,
    totalEarnings,
  ] = await Promise.all([
    Mentor.findOne({ userId: mentorId }).lean(),
    Session.countDocuments({ mentor: mentorId }),
    Session.countDocuments({ mentor: mentorId, status: 'completed' }),
    Session.countDocuments({ mentor: mentorId, status: 'pending' }),
    Session.countDocuments({ mentor: mentorId, status: 'accepted' }),
    Session.find({ mentor: mentorId }).sort({ createdAt: -1 }).limit(5).lean(),
    Payment.aggregate([
      { $match: { mentorId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  // Enrich recent sessions with learner info
  const enrichedSessions = await Promise.all(
    recentSessions.map(async (session) => {
      const learner = await User.findById(session.learner)
        .select('name email profileImage')
        .lean();
      return {
        ...session,
        _id: session._id.toString(),
        learner: learner
          ? {
              _id: learner._id.toString(),
              name: learner.name,
              email: learner.email,
              profileImage: learner.profileImage,
            }
          : null,
      };
    }),
  );

  return {
    stats: {
      totalSessions,
      completedSessions,
      pendingSessions,
      acceptedSessions,
      totalEarnings: totalEarnings[0]?.total ?? 0,
      rating: mentorProfile?.rating ?? 0,
      totalReviews: mentorProfile?.totalReviews ?? 0,
    },
    recentSessions: enrichedSessions,
  };
};

export const mentorService = {
  getMentors,
  getMentorById,
  getSuggestedMentors,
  getDashboardStats,
};
