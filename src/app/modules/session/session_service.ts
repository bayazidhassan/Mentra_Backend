import { Types } from 'mongoose';
import { Learner } from '../learner/learner_model';
import { Mentor } from '../mentor/mentor_model';
import { createNotification } from '../notification/notification_service';
import { User } from '../user/user_model';
import { Session } from './session_model';

// ─── getAvailableSlots ────────────────────────────────────────────────────────

const getAvailableSlots = async (mentorProfileId: string) => {
  const mentor = await Mentor.findById(mentorProfileId).lean();
  if (!mentor) throw new Error('Mentor not found.');

  const bookedSessions = await Session.find({
    mentor: mentor.userId,
    status: { $in: ['pending', 'accepted'] },
    scheduledAt: { $gte: new Date() },
  })
    .select('scheduledAt durationMinutes')
    .lean();

  const bookedSlots = bookedSessions.map((s) => ({
    start: new Date(s.scheduledAt).toISOString(),
    end: new Date(
      new Date(s.scheduledAt).getTime() + s.durationMinutes * 60 * 1000,
    ).toISOString(),
  }));

  return {
    availability: mentor.availability ?? [],
    hourlyRate: mentor.hourlyRate,
    bookedSlots,
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

  const sessionStart = scheduledDate;
  const sessionEnd = new Date(
    scheduledDate.getTime() + payload.durationMinutes * 60 * 1000,
  );

  const conflict = await Session.findOne({
    mentor: mentorProfile.userId,
    status: { $in: ['pending', 'accepted'] },
    scheduledAt: { $lt: sessionEnd },
    $expr: {
      $gt: [
        {
          $add: ['$scheduledAt', { $multiply: ['$durationMinutes', 60000] }],
        },
        { $toDate: sessionStart.getTime() },
      ],
    },
  });

  if (conflict) {
    throw new Error(
      'This time slot is already booked. Please choose another time.',
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

  const actorUser = await User.findById(userId).lean();
  const actorName = actorUser?.name ?? 'Someone';
  const notifyUserId = role === 'learner' ? session.mentor : session.learner;

  await createNotification({
    userId: notifyUserId,
    type: 'session',
    title: role === 'mentor' ? 'Session declined' : 'Session cancelled',
    message:
      role === 'mentor'
        ? `${actorName} declined your session request: "${session.title}"`
        : `${actorName} cancelled the session: "${session.title}"`,
    actionUrl: `/sessions`,
  });

  return session;
};

// ─── addMeetingLink ───────────────────────────────────────────────────────────

const addMeetingLink = async (
  mentorUserId: string,
  sessionId: string,
  meetingLink: string,
) => {
  const session = await Session.findOne({
    _id: sessionId,
    mentor: new Types.ObjectId(mentorUserId),
    status: 'accepted',
    paymentStatus: 'paid',
  });

  if (!session) {
    throw new Error(
      'Session not found. Meeting link can only be added after payment is confirmed.',
    );
  }

  session.meetingLink = meetingLink;
  await session.save();

  await createNotification({
    userId: session.learner,
    type: 'session',
    title: 'Meeting link added!',
    message: `Your mentor has added the meeting link for: "${session.title}"`,
    actionUrl: `/sessions`,
  });

  return session;
};

// ─── completeSession ──────────────────────────────────────────────────────────

const completeSession = async (mentorUserId: string, sessionId: string) => {
  const session = await Session.findOne({
    _id: sessionId,
    mentor: new Types.ObjectId(mentorUserId),
    status: 'accepted',
  });

  if (!session) {
    throw new Error('Session not found or cannot be completed.');
  }

  const now = new Date();
  const sessionStart = new Date(session.scheduledAt);
  const sessionEnd = new Date(
    sessionStart.getTime() + session.durationMinutes * 60 * 1000,
  );
  const formatDate = (date: Date) => {
    return date.toLocaleString([], {
      hour: 'numeric',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };
  if (now < sessionEnd) {
    throw new Error(
      `You can complete this session after ${formatDate(sessionEnd)}.`,
    );
  }

  session.status = 'completed';
  await session.save();

  await Learner.findOneAndUpdate(
    { userId: session.learner },
    { $inc: { completedSessionsCount: 1 } },
  );

  await createNotification({
    userId: session.learner,
    type: 'session',
    title: 'Session completed!',
    message: `Your session "${session.title}" has been marked as completed. Please leave a review!`,
    actionUrl: `/sessions`,
  });

  await createNotification({
    userId: session.mentor,
    type: 'session',
    title: 'Session completed',
    message: `You marked "${session.title}" as completed. Don't forget to rate your learner!`,
    actionUrl: `/sessions`,
  });

  return session;
};

// ─── rateSession ──────────────────────────────────────────────────────────────

const rateSession = async (
  userId: string,
  sessionId: string,
  role: 'learner' | 'mentor',
  rating: number,
  feedback?: string,
) => {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }

  const filter =
    role === 'learner'
      ? {
          _id: sessionId,
          learner: new Types.ObjectId(userId),
          status: 'completed',
        }
      : {
          _id: sessionId,
          mentor: new Types.ObjectId(userId),
          status: 'completed',
        };

  const session = await Session.findOne(filter);
  if (!session) throw new Error('Session not found or not completed.');

  if (role === 'learner' && session.ratingByLearner !== undefined) {
    throw new Error('You have already rated this session.');
  }
  if (role === 'mentor' && session.ratingByMentor !== undefined) {
    throw new Error('You have already rated this session.');
  }

  if (role === 'learner') {
    session.ratingByLearner = rating;
    session.feedbackByLearner = feedback;
  } else {
    session.ratingByMentor = rating;
    session.feedbackByMentor = feedback;
  }

  await session.save();

  if (role === 'learner') {
    const allRatedSessions = await Session.find({
      mentor: session.mentor,
      status: 'completed',
      ratingByLearner: { $exists: true },
    }).lean();

    const totalReviews = allRatedSessions.length;
    const avgRating =
      allRatedSessions.reduce((sum, s) => sum + (s.ratingByLearner ?? 0), 0) /
      totalReviews;

    await Mentor.findOneAndUpdate(
      { userId: session.mentor },
      {
        $set: {
          rating: parseFloat(avgRating.toFixed(1)),
          totalReviews,
        },
      },
    );
  }

  return session;
};

export const sessionService = {
  getAvailableSlots,
  bookSession,
  getMySessions,
  acceptSession,
  cancelSession,
  addMeetingLink,
  completeSession,
  rateSession,
};
