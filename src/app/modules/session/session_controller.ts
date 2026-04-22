import { RequestHandler } from 'express';
import { sessionService } from './session_service';

const getAvailableSlots: RequestHandler = async (req, res) => {
  try {
    const { mentorId } = req.params as { mentorId: string };
    const data = await sessionService.getAvailableSlots(mentorId);
    res.status(200).json({
      success: true,
      message: 'Availability fetched.',
      data,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch availability.',
      data: null,
    });
  }
};

const bookSession: RequestHandler = async (req, res) => {
  try {
    const {
      mentorProfileId,
      title,
      description,
      scheduledAt,
      durationMinutes,
    } = req.body;

    if (!mentorProfileId || !title || !scheduledAt || !durationMinutes) {
      res.status(400).json({
        success: false,
        message:
          'mentorProfileId, title, scheduledAt and durationMinutes are required.',
        data: null,
      });
      return;
    }

    const session = await sessionService.bookSession(req.user?.id as string, {
      mentorProfileId,
      title,
      description,
      scheduledAt,
      durationMinutes: Number(durationMinutes),
    });

    res.status(201).json({
      success: true,
      message: 'Session booked successfully.',
      data: session,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to book session.',
      data: null,
    });
  }
};

export const sessionController = {
  getAvailableSlots,
  bookSession,
};
