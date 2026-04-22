import { Types } from 'mongoose';
import { Mentor } from '../mentor/mentor_model';
import { createNotification } from '../notification/notification_service';
import { User } from '../user/user_model';
import { Session } from './session_model';

// ─── getAvailableSlots ────────────────────────────────────────────────────────
// Returns the mentor's availability days so frontend can
// restrict the date picker to only allowed days

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
    mentorProfileId: string; // Mentor profile _id
    title: string;
    description?: string;
    scheduledAt: string; // ISO date string from frontend
    durationMinutes: number;
  },
) => {
  // 1. Get mentor profile to find userId and hourlyRate
  const mentorProfile = await Mentor.findById(payload.mentorProfileId).lean();
  if (!mentorProfile) throw new Error('Mentor not found.');
  if (!mentorProfile.isApproved)
    throw new Error('This mentor is not approved.');

  // 2. Validate scheduledAt is on an available day
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

  // 3. Calculate price from hourlyRate + duration
  const price =
    mentorProfile.hourlyRate !== undefined
      ? parseFloat(
          ((mentorProfile.hourlyRate / 60) * payload.durationMinutes).toFixed(
            2,
          ),
        )
      : undefined;

  // 4. Create session
  const session = await Session.create({
    learner: new Types.ObjectId(learnerId),
    mentor: mentorProfile.userId, // store mentor's userId not profile id
    title: payload.title,
    description: payload.description,
    scheduledAt: scheduledDate,
    durationMinutes: payload.durationMinutes,
    price,
    paymentStatus: 'unpaid',
    status: 'pending',
  });

  // 5. Get learner's name for notification message
  const learnerUser = await User.findById(learnerId).lean();
  const learnerName = learnerUser?.name ?? 'A learner';

  // 6. Notify the mentor
  await createNotification({
    userId: mentorProfile.userId,
    type: 'session',
    title: 'New session request',
    message: `${learnerName} has requested a session: "${payload.title}"`,
    actionUrl: `/sessions/${session._id}`,
  });

  return session;
};

export const sessionService = {
  getAvailableSlots,
  bookSession,
};
