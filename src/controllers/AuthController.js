import mongoose from 'mongoose';
import User from '../models/User.js';
import LearningSession from '../models/LearningSession.js';
import Progress from '../models/Progress.js';
import jwt from 'jsonwebtoken';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      username
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {

  try {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    // Check user exists (include password field)
    // regex check email
    const emailRegex = /^\S+@\S+\.\S+$/;

    let user;

    if (emailRegex.test(email)) {
      // login bằng email
      user = await User.findOne({ email }).select("+password");
    } else {
      // login bằng username
      user = await User.findOne({ username: email }).select("+password");
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }


    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          createdAt: user.createdAt,
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

//GET /auth/profile


//GET /auth/profile/:userId
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)

    const getDateVN = (d = new Date()) =>
      d.toLocaleDateString("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      })

    const now = new Date()

    const day7 = new Date()
    day7.setDate(now.getDate() - 7)

    const day30 = new Date()
    day30.setDate(now.getDate() - 30)

    const day7Str = getDateVN(day7)
    const day30Str = getDateVN(day30)

    const [activeDays, last7, last30] = await Promise.all([
      // Tổng số ngày có activity
      LearningSession.countDocuments({ userId: user._id }),

      // 7 ngày
      LearningSession.aggregate([
        { $match: { userId: user._id, date: { $gte: day7Str } } },
        { $group: { _id: null, total: { $sum: '$activeSeconds' } } },
      ]),

      // 30 ngày
      LearningSession.aggregate([
        { $match: { userId: user._id, date: { $gte: day30Str } } },
        { $group: { _id: null, total: { $sum: '$activeSeconds' } } },
      ]),
    ])

    const toHours = (agg) =>
      agg.length > 0
        ? Math.round((agg[0].total / 3600) * 10) / 10
        : 0

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          createdAt: user.createdAt,
          streak: user.streak,
          totalLessons: user.totalLessons,
          totalMinutes: user.totalMinutes,
          accountType: user.accountType,
          lastActive: user.lastActive,
          activeDays,
          last7Days: toHours(last7),
          last30Days: toHours(last30),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

//POST /auth/profile/last-active
export const setLastActive = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
};

// PATCH /auth/profile/streak
export const setStreak = async (req, res) => {
  try {
    const { userId } = req.body

    const sessions = await LearningSession.find({
      userId: new mongoose.Types.ObjectId(userId)
    })
      .select('date')
      .sort({ date: -1 })

    let streak = 0

    if (sessions.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const lastDate = new Date(sessions[0].date)
      lastDate.setHours(0, 0, 0, 0)

      if (lastDate >= yesterday) {
        streak = 1
        for (let i = 1; i < sessions.length; i++) {
          const curr = new Date(sessions[i].date)
          curr.setHours(0, 0, 0, 0)
          const prev = new Date(sessions[i - 1].date)
          prev.setHours(0, 0, 0, 0)

          if ((prev - curr) / (1000 * 60 * 60 * 24) === 1) {
            streak++
          } else {
            break
          }
        }
      }
    }

    await User.findByIdAndUpdate(userId, { streak })

    res.json({ streak })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// PATCH /auth/profile/total-minutes
export const setTotalMinutes = async (req, res) => {
  try {
    const totalSecondsAgg = await LearningSession.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$activeSeconds' } } }
    ]);
    const totalMinutes = totalSecondsAgg.length > 0 ? Math.round(totalSecondsAgg[0].total / 60) : 0;
    await User.findByIdAndUpdate(req.user._id, { totalMinutes });
    res.json({ success: true, totalMinutes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /auth/profile/total-lessons
export const setTotalLessons = async (req, res) => {
  try {
    const totalLessons = await Progress.countDocuments({ userId: req.user._id, status: { $in: ['completed', 'reviewing'] } });
    await User.findByIdAndUpdate(req.user._id, { totalLessons });
    res.json({ success: true, totalLessons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user email
// @route   PATCH /auth/change-email
// @access  Private
export const changeEmail = async (req, res, next) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: 'New email is required'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Update email
    await User.findByIdAndUpdate(req.user._id, { email: newEmail });

    res.status(200).json({
      success: true,
      message: 'Email updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change username
// @route   PATCH /auth/change-username
// @access  Private
export const changeUsername = async (req, res, next) => {
  try {
    const { newUsername } = req.body;

    if (!newUsername) {
      return res.status(400).json({
        success: false,
        message: 'New username is required'
      });
    }

    // Check if username is already taken
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already in use'
      });
    }

    // Update username
    await User.findByIdAndUpdate(req.user._id, { username: newUsername });

    res.status(200).json({
      success: true,
      message: 'Username updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PATCH /auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top users by last7days or last30days
// @route   GET /auth/users
// @access  Public
export const getusers = async (req, res, next) => {
  try {
    const { sortBy } = req.query; // default to last7days

    const getDateVN = (d = new Date()) =>
      d.toLocaleDateString("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
      })

    const now = new Date()
    let startDate, period;

    if (sortBy === 'last30Days') {
      startDate = new Date()
      startDate.setDate(now.getDate() - 30)
      period = 'last30Days'
    } else {
      startDate = new Date()
      startDate.setDate(now.getDate() - 7)
      period = 'last7Days'
    }

    const startDateStr = getDateVN(startDate)

    // Aggregate active seconds per user for the period
    const aggResult = await LearningSession.aggregate([
      { $match: { date: { $gte: startDateStr } } },
      { $group: { _id: '$userId', totalSeconds: { $sum: '$activeSeconds' } } },
      { $sort: { totalSeconds: -1 } },
      { $limit: 30 }
    ])

    // Get user details for these users
    const userIds = aggResult.map(item => item._id)
    const users = await User.find({ _id: { $in: userIds } }).select('username avatar')

    // Combine data
    const topUsers = aggResult.map(agg => {
      const user = users.find(u => u._id.toString() === agg._id.toString())
      return {
        _id: agg._id,
        username: user ? user.username : 'Unknown',
        avatar: user ? user.avatar : null,
        [period]: Math.round((agg.totalSeconds / 3600) * 10) / 10 // to hours
      }
    })

    res.status(200).json({
      success: true,
      data: topUsers,
      sortBy
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

