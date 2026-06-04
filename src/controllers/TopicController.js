import Topic from '../models/Topic.js';
import LessonGroup from '../models/LessonGroup.js';
import Lesson from '../models/Lesson.js';
import Sentence from '../models/Sentence.js';
import mongoose from "mongoose";

// GET /topics
export const show = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ order: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET /topics/:topicSlug
export const showOneTopic = async (req, res) => {
  try {
    const { topicSlug } = req.params;
    const topic = await Topic.findOne({ slug: topicSlug });

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    } else {
      res.json(topic);
    } 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET /topics/:topicSlug/lesson-groups
export const showLessonGroups = async (req, res) => {
  try {
    const { topicSlug } = req.params;

    const topic = await Topic.findOne({ slug: topicSlug });

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const groups = await LessonGroup
      .find({ topicId: topic._id })
      .sort({ order: 1 });

    res.json(groups);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET /topics/lesson-groups/:groupSlug/lessons
export const showLessons = async (req, res) => {
  try {
    const { groupSlug } = req.params;

    const group = await LessonGroup.findOne({ slug: groupSlug });

    if (!group) {
      return res.status(404).json({ message: "Lesson group not found" });
    }

    const lessons = await Lesson
      .find({ groupId: group._id })
      .sort({ order: 1 });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET /lessons/:identifier
export const getLessonByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const isId = mongoose.Types.ObjectId.isValid(identifier);

    const lesson = await Lesson.findOne(
      isId ? { _id: identifier } : { slug: identifier }
    );

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET /topics/:lessonSlug/sentences
export const showSentences = async (req, res) => {
  try {
    const { lessonSlug } = req.params; 
  
    const lesson = await Lesson.findOne({ slug: lessonSlug });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const sentences = await Sentence
      .find({ lessonId: lesson._id })
      .sort({ order: 1 });

    res.json(sentences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//GET /topics/:topicSlug/lesson-groups/:groupSlug/lessons/:lessonSlug/sentences
// export const showSentences = async (req, res) => {
//   try {
//     const { topicSlug, groupSlug, lessonSlug } = req.params; 
//     const topic = await Topic.findOne({ slug: topicSlug });

//     if (!topic) {
//       return res.status(404).json({ message: "Topic not found" });
//     } else {
//       const groups = await LessonGroup
//         .find({ topicId: topic._id })
//         .sort({ order: 1 }); 
//       const group = groups.find(g => g.slug === groupSlug);

//       if (!group) {
//         return res.status(404).json({ message: "Lesson group not found" });
//       } else {
//         const lessons = await Lesson
//           .find({ groupId: group._id })
//           .sort({ order: 1 });
//         const lesson = lessons.find(l => l.slug === lessonSlug);

//         if (!lesson) {
//           return res.status(404).json({ message: "Lesson not found" });
//         } else {
//           const sentences = await Sentence
//             .find({ lessonId: lesson._id })
//             .sort({ order: 1 });

//           res.json(sentences);
//         }
//       }
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
