import { RequestHandler } from 'express';
import { sessionService } from './session_service';

const getAvailableSlots: RequestHandler = async (req, res) => {
  try {
    const { mentorId } = req.params as { mentorId: string };
    const data = await sessionService.getAvailableSlots(mentorId);
    res
      .status(200)
      .json({ success: true, message: 'Availability fetched.', data });
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

const getMySessions: RequestHandler = async (req, res) => {
  try {
    const role = req.user?.role as 'learner' | 'mentor';
    if (role !== 'learner' && role !== 'mentor') {
      res
        .status(403)
        .json({ success: false, message: 'Access denied.', data: null });
      return;
    }
    const sessions = await sessionService.getMySessions(
      req.user?.id as string,
      role,
    );
    res
      .status(200)
      .json({ success: true, message: 'Sessions fetched.', data: sessions });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch sessions.',
      data: null,
    });
  }
};

const acceptSession: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const session = await sessionService.acceptSession(
      req.user?.id as string,
      id,
    );
    res
      .status(200)
      .json({ success: true, message: 'Session accepted.', data: session });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to accept session.',
      data: null,
    });
  }
};

const cancelSession: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const role = req.user?.role as 'learner' | 'mentor';
    const session = await sessionService.cancelSession(
      req.user?.id as string,
      id,
      role,
    );
    res
      .status(200)
      .json({ success: true, message: 'Session cancelled.', data: session });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to cancel session.',
      data: null,
    });
  }
};

export const sessionController = {
  getAvailableSlots,
  bookSession,
  getMySessions,
  acceptSession,
  cancelSession,
};
