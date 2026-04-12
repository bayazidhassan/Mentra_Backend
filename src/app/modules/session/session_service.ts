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

export const sessionService = {
  getUpcomingSessions,
};
