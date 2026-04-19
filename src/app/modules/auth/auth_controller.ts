import { RequestHandler } from 'express';
import { authService } from './auth_service';

const register: RequestHandler = async (req, res) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        _id: result._id,
        name: result.name,
        email: result.email,
        role: result.role,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Registration failed.',
      data: null,
    });
  }
};

const login: RequestHandler = async (req, res) => {
  try {
    const { safeUser, accessToken, refreshToken } = await authService.login(
      req.body,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      //sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = {
      _id: safeUser._id,
      name: safeUser.name,
      email: safeUser.email,
      role: safeUser.role,
      profileImage: safeUser.profileImage,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Login failed.',
      data: null,
    });
  }
};

const googleLogin: RequestHandler = async (req, res) => {
  try {
    const { idToken } = req.body;
    const {
      user: userData,
      accessToken,
      refreshToken,
      isNewUser,
    } = await authService.googleLogin(idToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      //sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      profileImage: userData.profileImage,
    };

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        isNewUser,
        accessToken,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Google login failed.',
      data: null,
    });
  }
};

const setRole: RequestHandler = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user?.id as string;

    const {
      role: selectedRole,
      accessToken,
      refreshToken,
    } = await authService.setRole(userId, role);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      //sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully.',
      data: { selectedRole, accessToken },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: (err as Error).message || 'Failed to update role.',
      data: null,
    });
  }
};

const refreshToken: RequestHandler = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token.',
        data: null,
      });
    }

    const { accessToken } = await authService.refreshToken(token);

    res.status(200).json({
      success: true,
      message: 'Access token refreshed.',
      data: { accessToken },
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token.',
      data: null,
    });
  }
};

const logout: RequestHandler = (req, res) => {
  res
    .clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    })
    .json({ success: true, message: 'Logged out successfully.', data: null });
};

export const authController = {
  register,
  login,
  googleLogin,
  setRole,
  refreshToken,
  logout,
};
