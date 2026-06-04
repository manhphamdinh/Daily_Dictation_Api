import express from "express";
import {  getLessonByIdentifier, show } from "../controllers/TopicController.js";
import { showOneTopic } from "../controllers/TopicController.js";
import { showLessonGroups } from "../controllers/TopicController.js";
import { showLessons } from "../controllers/TopicController.js";
import { showSentences } from "../controllers/TopicController.js";

const router = express.Router();

router.get("/", show);
router.get("/:topicSlug", showOneTopic);
router.get("/:topicSlug/lesson-groups", showLessonGroups);
router.get("/:groupSlug/lessons", showLessons);
router.get("/:lessonSlug/sentences", showSentences);
router.get("/lessons/:identifier", getLessonByIdentifier);

export { router };