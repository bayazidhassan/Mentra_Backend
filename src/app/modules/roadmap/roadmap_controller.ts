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

const generateRoadmap: RequestHandler = async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal) {
      res.status(400).json({
        success: false,
        message: 'Goal is required.',
        data: null,
      });
      return;
    }

    const roadmap = await roadmapService.generateRoadmap(
      req.user?.id as string,
      goal,
    );

    res.status(201).json({
      success: true,
      message: 'Roadmap generated successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to generate roadmap.',
      data: null,
    });
  }
};

const createRoadmap: RequestHandler = async (req, res) => {
  try {
    const { title, description, goal, steps } = req.body;

    if (!title || !goal || !steps || steps.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Title, goal and at least one step are required.',
        data: null,
      });
      return;
    }

    const roadmap = await roadmapService.createRoadmap(req.user?.id as string, {
      title,
      description,
      goal,
      steps,
    });

    res.status(201).json({
      success: true,
      message: 'Roadmap created successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to create roadmap.',
      data: null,
    });
  }
};

const updateStepStatus: RequestHandler = async (req, res) => {
  try {
    const { id, stepId } = req.params as { id: string; stepId: string };
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required.',
        data: null,
      });
      return;
    }

    const roadmap = await roadmapService.updateStepStatus(
      req.user?.id as string,
      id,
      stepId,
      status,
    );

    res.status(200).json({
      success: true,
      message: 'Step status updated successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to update step.',
      data: null,
    });
  }
};

const deleteRoadmap: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    await roadmapService.deleteRoadmap(req.user?.id as string, id);

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully.',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to delete roadmap.',
      data: null,
    });
  }
};

export const roadmapController = {
  getMyRoadmap,
  generateRoadmap,
  createRoadmap,
  updateStepStatus,
  deleteRoadmap,
};
