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
    res.status(200).json({
      success: true,
      message: 'Sessions fetched.',
      data: sessions,
    });
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
    res.status(200).json({
      success: true,
      message: 'Session cancelled.',
      data: session,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to cancel session.',
      data: null,
    });
  }
};

const addMeetingLink: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { meetingLink } = req.body;

    if (!meetingLink) {
      res.status(400).json({
        success: false,
        message: 'meetingLink is required.',
        data: null,
      });
      return;
    }

    const session = await sessionService.addMeetingLink(
      req.user?.id as string,
      id,
      meetingLink,
    );
    res.status(200).json({
      success: true,
      message: 'Meeting link added.',
      data: session,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to add meeting link.',
      data: null,
    });
  }
};

const completeSession: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const session = await sessionService.completeSession(
      req.user?.id as string,
      id,
    );
    res.status(200).json({
      success: true,
      message: 'Session marked as completed.',
      data: session,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to complete session.',
      data: null,
    });
  }
};

const rateSession: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { rating, feedback } = req.body;
    const role = req.user?.role as 'learner' | 'mentor';

    if (!rating) {
      res.status(400).json({
        success: false,
        message: 'Rating is required.',
        data: null,
      });
      return;
    }

    const session = await sessionService.rateSession(
      req.user?.id as string,
      id,
      role,
      Number(rating),
      feedback,
    );
    res.status(200).json({
      success: true,
      message: 'Rating submitted.',
      data: session,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to submit rating.',
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
  addMeetingLink,
  completeSession,
  rateSession,
};
