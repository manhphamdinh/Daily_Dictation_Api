import express from "express";
import {
  getProgressByLesson,
  toggleLike,
  upsertProgress,
//   completeLesson,
  getMyProgress,
  resetProgress,
} from "../controllers/ProgressController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMyProgress);
router.get("/:lessonSlug", protect, getProgressByLesson);
router.post("/", protect, upsertProgress);
// router.patch("/:lessonId/complete", completeLesson);
router.patch("/:lessonId/like", protect, toggleLike);
router.patch("/:lessonId/reset", protect, resetProgress);

export { router };