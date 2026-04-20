import { RequestHandler } from 'express';
import { roadmapService } from './roadmap_service';

const getMyRoadmap: RequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }
    const roadmap = await roadmapService.getMyRoadmap(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Roadmap fetched successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(500).json({
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

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }

    const roadmap = await roadmapService.generateRoadmap(req.user.id, goal);

    res.status(201).json({
      success: true,
      message: 'Roadmap generated successfully.',
      data: roadmap,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: (err as Error).message || 'Failed to generate roadmap.',
      data: null,
    });
  }
};

const createRoadmap: RequestHandler = async (req, res) => {
  try {
    const { title, description, goal, steps } = req.body;

    if (!title || !goal || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Title, goal and at least one step are required.',
        data: null,
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }

    const roadmap = await roadmapService.createRoadmap(req.user.id, {
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
    res.status(500).json({
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

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status value.',
        data: null,
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }

    const roadmap = await roadmapService.updateStepStatus(
      req.user.id,
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
    res.status(500).json({
      success: false,
      message: (err as Error).message || 'Failed to update step.',
      data: null,
    });
  }
};

const deleteRoadmap: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }

    await roadmapService.deleteRoadmap(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully.',
      data: null,
    });
  } catch (err) {
    res.status(500).json({
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
