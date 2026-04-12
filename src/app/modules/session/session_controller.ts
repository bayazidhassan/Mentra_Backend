import { RequestHandler } from 'express';
import { sessionService } from './session_service';

const getUpcomingSessions: RequestHandler = async (req, res) => {
  try {
    const sessions = await sessionService.getUpcomingSessions(
      req.user?.id as string,
    );
    res.status(200).json({
      success: true,
      message: 'Upcoming sessions fetched successfully.',
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

const getMySessions: RequestHandler = async (req, res) => {
  try {
    const sessions = await sessionService.getMySessions(
      req.user?.id as string,
      req.user?.role as string,
    );
    res.status(200).json({
      success: true,
      message: 'Sessions fetched successfully.',
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

const getSessionById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const session = await sessionService.getSessionById(
      id,
      req.user?.id as string,
    );
    res.status(200).json({
      success: true,
      message: 'Session fetched successfully.',
      data: session,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: (err as Error).message || 'Session not found.',
      data: null,
    });
  }
};

const bookSession: RequestHandler = async (req, res) => {
  try {
    const { mentor, title, description, scheduledAt, duration, price } =
      req.body;

    if (!mentor || !title || !scheduledAt || !duration || !price) {
      res.status(400).json({
        success: false,
        message: 'All fields are required.',
        data: null,
      });
      return;
    }

    const session = await sessionService.bookSession(req.user?.id as string, {
      mentor,
      title,
      description,
      scheduledAt,
      duration,
      price,
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

const updateSessionStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required.',
        data: null,
      });
      return;
    }

    const session = await sessionService.updateSessionStatus(
      id,
      req.user?.id as string,
      status,
    );

    res.status(200).json({
      success: true,
      message: 'Session status updated successfully.',
      data: session,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to update session.',
      data: null,
    });
  }
};

export const sessionController = {
  getUpcomingSessions,
  getMySessions,
  getSessionById,
  bookSession,
  updateSessionStatus,
};
