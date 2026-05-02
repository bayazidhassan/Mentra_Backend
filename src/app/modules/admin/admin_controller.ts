import { RequestHandler } from 'express';
import { adminService } from './admin_service';

const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const data = await adminService.getDashboardStats();
    res.status(200).json({ success: true, message: 'Stats fetched.', data });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

const getLearners: RequestHandler = async (req, res) => {
  try {
    const {
      search = '',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;
    const data = await adminService.getLearners({
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json({ success: true, message: 'Learners fetched.', data });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

const banUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    await adminService.banUser(id);
    res
      .status(200)
      .json({ success: true, message: 'User banned.', data: null });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

const unbanUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    await adminService.unbanUser(id);
    res
      .status(200)
      .json({ success: true, message: 'User unbanned.', data: null });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

const getMentors: RequestHandler = async (req, res) => {
  try {
    const {
      search = '',
      approved = 'true',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;
    const data = await adminService.getMentors({
      search,
      approved: approved === 'true',
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json({ success: true, message: 'Mentors fetched.', data });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

const approveMentor: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params as { id: string };
    await adminService.approveMentor(id);
    res
      .status(200)
      .json({ success: true, message: 'Mentor approved.', data: null });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

const getSessions: RequestHandler = async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;
    const data = await adminService.getSessions({
      search,
      status: status || undefined,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json({ success: true, message: 'Sessions fetched.', data });
  } catch (err) {
    res
      .status(400)
      .json({ success: false, message: (err as Error).message, data: null });
  }
};

export const adminController = {
  getDashboardStats,
  getLearners,
  banUser,
  unbanUser,
  getMentors,
  approveMentor,
  getSessions,
};
