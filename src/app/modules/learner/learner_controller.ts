import { RequestHandler } from 'express';
import { learnerService } from './learner_service';

const getMyLearners: RequestHandler = async (req, res) => {
  try {
    const learners = await learnerService.getMyLearners(req.user?.id as string);
    res
      .status(200)
      .json({ success: true, message: 'Learners fetched.', data: learners });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch learners.',
      data: null,
    });
  }
};

const getAllLearners: RequestHandler = async (req, res) => {
  try {
    const {
      search = '',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;
    const data = await learnerService.getAllLearners({
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res
      .status(200)
      .json({ success: true, message: 'All learners fetched.', data });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch learners.',
      data: null,
    });
  }
};

export const learnerController = {
  getMyLearners,
  getAllLearners,
};
