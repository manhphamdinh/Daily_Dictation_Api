import express from 'express';
import { register, login, getMe, getUserById, setLastActive, setStreak, setTotalMinutes, setTotalLessons, changeEmail, changePassword, changeUsername, getusers } from '../controllers/AuthController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/profile/:userId', getUserById);
router.get('/users', getusers);
router.patch('/profile/last-active', protect, setLastActive);
router.patch('/profile/streak', setStreak);
router.patch('/profile/total-minutes', protect, setTotalMinutes);
router.patch('/profile/total-lessons', protect, setTotalLessons);
router.patch('/profile/change-email', protect, changeEmail);
router.patch('/profile/change-username', protect, changeUsername);
router.patch('/profile/change-password', protect, changePassword);

export { router };