import { Types } from 'mongoose';
import { Mentor } from '../mentor/mentor_model';
import { createNotification } from '../notification/notification_service';
import { User } from '../user/user_model';
import { Session } from './session_model';

// ─── getAvailableSlots ────────────────────────────────────────────────────────

const getAvailableSlots = async (mentorProfileId: string) => {
  const mentor = await Mentor.findById(mentorProfileId).lean();
  if (!mentor) throw new Error('Mentor not found.');
  return {
    availability: mentor.availability ?? [],
    hourlyRate: mentor.hourlyRate,
  };
};

// ─── bookSession ──────────────────────────────────────────────────────────────

const bookSession = async (
  learnerId: string,
  payload: {
    mentorProfileId: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes: number;
  },
) => {
  const mentorProfile = await Mentor.findById(payload.mentorProfileId).lean();
  if (!mentorProfile) throw new Error('Mentor not found.');
  if (!mentorProfile.isApproved)
    throw new Error('This mentor is not approved.');

  const scheduledDate = new Date(payload.scheduledAt);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const scheduledDay = dayNames[scheduledDate.getUTCDay()];
  const availability = mentorProfile.availability ?? [];
  const matchedSlot = availability.find((a) => a.day === scheduledDay);

  if (availability.length > 0 && !matchedSlot) {
    throw new Error(
      `This mentor is not available on ${scheduledDay}. Please pick an available day.`,
    );
  }

  const price =
    mentorProfile.hourlyRate !== undefined
      ? parseFloat(
          ((mentorProfile.hourlyRate / 60) * payload.durationMinutes).toFixed(
            2,
          ),
        )
      : undefined;

  const session = await Session.create({
    learner: new Types.ObjectId(learnerId),
    mentor: mentorProfile.userId,
    title: payload.title,
    description: payload.description,
    scheduledAt: scheduledDate,
    durationMinutes: payload.durationMinutes,
    price,
    paymentStatus: 'unpaid',
    status: 'pending',
  });

  const learnerUser = await User.findById(learnerId).lean();
  const learnerName = learnerUser?.name ?? 'A learner';

  await createNotification({
    userId: mentorProfile.userId,
    type: 'session',
    title: 'New session request',
    message: `${learnerName} has requested a session: "${payload.title}"`,
    actionUrl: `/sessions`,
  });

  return session;
};

// ─── getMySessions ────────────────────────────────────────────────────────────

const getMySessions = async (userId: string, role: 'learner' | 'mentor') => {
  const filter =
    role === 'learner'
      ? { learner: new Types.ObjectId(userId) }
      : { mentor: new Types.ObjectId(userId) };

  const sessions = await Session.find(filter).sort({ scheduledAt: 1 }).lean();

  // Enrich each session with the other party's user info
  const enriched = await Promise.all(
    sessions.map(async (session) => {
      const otherUserId = role === 'learner' ? session.mentor : session.learner;
      const otherUser = await User.findById(otherUserId)
        .select('name email profileImage')
        .lean();

      return {
        ...session,
        _id: session._id.toString(),
        otherUser: otherUser
          ? {
              _id: otherUser._id.toString(),
              name: otherUser.name,
              email: otherUser.email,
              profileImage: otherUser.profileImage,
            }
          : null,
      };
    }),
  );

  return enriched;
};

// ─── acceptSession ────────────────────────────────────────────────────────────

const acceptSession = async (mentorUserId: string, sessionId: string) => {
  const session = await Session.findOne({
    _id: sessionId,
    mentor: new Types.ObjectId(mentorUserId),
    status: 'pending',
  });

  if (!session) throw new Error('Session not found or already actioned.');

  session.status = 'accepted';
  await session.save();

  const mentorUser = await User.findById(mentorUserId).lean();
  const mentorName = mentorUser?.name ?? 'Your mentor';

  await createNotification({
    userId: session.learner,
    type: 'session',
    title: 'Session accepted!',
    message: `${mentorName} accepted your session: "${session.title}"`,
    actionUrl: `/sessions`,
  });

  return session;
};

// ─── cancelSession ────────────────────────────────────────────────────────────

const cancelSession = async (
  userId: string,
  sessionId: string,
  role: 'learner' | 'mentor',
) => {
  const filter =
    role === 'learner'
      ? {
          _id: sessionId,
          learner: new Types.ObjectId(userId),
          status: { $in: ['pending', 'accepted'] },
        }
      : {
          _id: sessionId,
          mentor: new Types.ObjectId(userId),
          status: 'pending',
        };

  const session = await Session.findOne(filter);
  if (!session) throw new Error('Session not found or cannot be cancelled.');

  session.status = 'cancelled';
  await session.save();

  // Notify the other party
  const actorUser = await User.findById(userId).lean();
  const actorName = actorUser?.name ?? 'Someone';

  const notifyUserId = role === 'learner' ? session.mentor : session.learner;

  const message =
    role === 'mentor'
      ? `${actorName} declined your session request: "${session.title}"`
      : `${actorName} cancelled the session: "${session.title}"`;

  await createNotification({
    userId: notifyUserId,
    type: 'session',
    title: role === 'mentor' ? 'Session declined' : 'Session cancelled',
    message,
    actionUrl: `/sessions`,
  });

  return session;
};

export const sessionService = {
  getAvailableSlots,
  bookSession,
  getMySessions,
  acceptSession,
  cancelSession,
};
