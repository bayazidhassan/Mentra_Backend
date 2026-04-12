import { Types } from 'mongoose';
import { Session } from './session_model';

const getUpcomingSessions = async (learnerId: string) => {
  const sessions = await Session.find({
    learner: learnerId,
    scheduledAt: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] },
  })
    .populate('mentor', 'name email profileImage')
    .sort({ scheduledAt: 1 })
    .limit(5);

  return sessions;
};

const getMySessions = async (userId: string, role: string) => {
  const filter = role === 'mentor' ? { mentor: userId } : { learner: userId };

  const sessions = await Session.find(filter)
    .populate('mentor', 'name email profileImage')
    .populate('learner', 'name email profileImage')
    .sort({ scheduledAt: -1 });

  return sessions;
};

const getSessionById = async (sessionId: string, userId: string) => {
  const session = await Session.findOne({
    _id: sessionId,
    $or: [{ learner: userId }, { mentor: userId }],
  })
    .populate('mentor', 'name email profileImage')
    .populate('learner', 'name email profileImage');

  if (!session) {
    throw new Error('Session not found.');
  }

  return session;
};

const bookSession = async (
  learnerId: string,
  payload: {
    mentor: string;
    title: string;
    description?: string;
    scheduledAt: string;
    duration: number;
    price: number;
  },
) => {
  const session = await Session.create({
    learner: new Types.ObjectId(learnerId),
    mentor: new Types.ObjectId(payload.mentor),
    title: payload.title,
    description: payload.description,
    scheduledAt: new Date(payload.scheduledAt),
    duration: payload.duration,
    price: payload.price,
    status: 'pending',
  });

  return session.populate([
    { path: 'mentor', select: 'name email profileImage' },
    { path: 'learner', select: 'name email profileImage' },
  ]);
};

const updateSessionStatus = async (
  sessionId: string,
  userId: string,
  status: 'confirmed' | 'cancelled' | 'completed',
) => {
  const session = await Session.findOne({
    _id: sessionId,
    $or: [{ learner: userId }, { mentor: userId }],
  });

  if (!session) {
    throw new Error('Session not found.');
  }

  session.status = status;
  await session.save();

  return session.populate([
    { path: 'mentor', select: 'name email profileImage' },
    { path: 'learner', select: 'name email profileImage' },
  ]);
};

export const sessionService = {
  getUpcomingSessions,
  getMySessions,
  getSessionById,
  bookSession,
  updateSessionStatus,
};
