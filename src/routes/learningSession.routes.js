import express from 'express';
import { trackActiveTime, getActivityChart } from '../controllers/LearningSessionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/track', protect, trackActiveTime);
router.get('/activity', getActivityChart);

export { router };