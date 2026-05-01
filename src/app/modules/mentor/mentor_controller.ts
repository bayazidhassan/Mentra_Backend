import { RequestHandler } from 'express';
import { mentorService } from './mentor_service';

const getMentors: RequestHandler = async (req, res) => {
  try {
    const {
      search = '',
      page = '1',
      limit = '9',
    } = req.query as Record<string, string>;
    const data = await mentorService.getMentors({
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json({ success: true, message: 'Mentors fetched.', data });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch mentors.',
      data: null,
    });
  }
};

const getMentorById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    const mentor = await mentorService.getMentorById(id);
    res.status(200).json({
      success: true,
      message: 'Mentor fetched.',
      data: mentor,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: (err as Error).message || 'Mentor not found.',
      data: null,
    });
  }
};

const getSuggestedMentors: RequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      res
        .status(401)
        .json({ success: false, message: 'Unauthorized.', data: null });
      return;
    }
    const mentors = await mentorService.getSuggestedMentors(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Suggested mentors fetched.',
      data: mentors,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to get suggestions.',
      data: null,
    });
  }
};

const getMentorDashboardStats: RequestHandler = async (req, res) => {
  try {
    const data = await mentorService.getMentorDashboardStats(
      req.user?.id as string,
    );
    res
      .status(200)
      .json({ success: true, message: 'Dashboard stats fetched.', data });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch stats.',
      data: null,
    });
  }
};

export const mentorController = {
  getMentors,
  getMentorById,
  getSuggestedMentors,
  getMentorDashboardStats,
};
