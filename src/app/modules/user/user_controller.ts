import { RequestHandler } from 'express';
import { generateToken } from '../../utils/generateToken';
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

const setRole: RequestHandler = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized.',
        data: null,
      });
      return;
    }

    const user = await userService.setRole(userId, role);

    const token = generateToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      message: 'Role updated successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to update role.',
      data: null,
    });
  }
};

const updateProfile: RequestHandler = async (req, res) => {
  try {
    const user = await userService.updateProfile(
      req.user?.id as string,
      req.body,
      req.file?.buffer,
    );
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to update profile.',
      data: null,
    });
  }
};

const changePassword: RequestHandler = async (req, res) => {
  try {
    const result = await userService.changePassword(
      req.user?.id as string,
      req.body,
    );
    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to change password.',
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
  setRole,
  updateProfile,
  changePassword,
  getRecommendedMentors,
  getMentors,
  getMentorById,
};
