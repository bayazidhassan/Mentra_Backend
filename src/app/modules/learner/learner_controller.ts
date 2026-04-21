import { RequestHandler } from 'express';
import { Learner } from './learner_model';

const getLearner: RequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }
    const roadmap = await Learner.findOne({ userId: req.user.id });
    if (!roadmap) {
      throw new Error('Roadmap not found.');
    }
    res.status(200).json({
      success: true,
      message: 'Roadmap fetched successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch learner.',
      data: null,
    });
  }
};

export const learnerController = {
  getLearner,
};
