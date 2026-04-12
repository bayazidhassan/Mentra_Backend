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

export const sessionController = {
  getUpcomingSessions,
};
