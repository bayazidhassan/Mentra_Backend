import { RequestHandler } from 'express';
import { roadmapService } from './roadmap_service';

const getMyRoadmap: RequestHandler = async (req, res) => {
  try {
    const roadmap = await roadmapService.getMyRoadmap(req.user?.id as string);
    res.status(200).json({
      success: true,
      message: 'Roadmap fetched successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to fetch roadmap.',
      data: null,
    });
  }
};

export const roadmapController = {
  getMyRoadmap,
};
