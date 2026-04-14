import { RequestHandler } from 'express';
import { userService } from './user_service';

const getMe: RequestHandler = async (req, res) => {
  try {
    const user = await userService.getMe(req.user?.id as string);
    res.status(200).json({
      success: true,
      message: 'User fetched successfully.',
      data: user,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: (err as Error).message || 'User not found.',
      data: null,
    });
  }
};

const getRecommendedMentors: RequestHandler = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 6;
    const mentors = await userService.getRecommendedMentors(limit);
    res.status(200).json({
      success: true,
      message: 'Mentors fetched successfully.',
      data: mentors,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch mentors.',
      data: null,
    });
  }
};

const getMentors: RequestHandler = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await userService.getMentors({
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 9,
    });
    res.status(200).json({
      success: true,
      message: 'Mentors fetched successfully.',
      data: result,
    });
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
    const mentor = await userService.getMentorById(id);
    res.status(200).json({
      success: true,
      message: 'Mentor fetched successfully.',
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

export const userController = {
  getMe,
  getRecommendedMentors,
  getMentors,
  getMentorById,
};
