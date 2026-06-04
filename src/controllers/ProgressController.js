import Progress from "../models/Progress.js";
import Lesson from "../models/Lesson.js"
import User from "../models/User.js"

//GET /progress/:lessonSlug
export const getProgressByLesson = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonSlug } = req.params;

    const lesson = await Lesson.findOne({ slug: lessonSlug });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const progress = await Progress.findOne({
      userId,
      lessonId: lesson._id
    });

    if (!progress) {
      return res.json({
        completedSentences: [],
        currentSentence: -1,
        status: "not-started",
        isLiked: false
      });
    }

    res.json(progress);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//POST /progress
export const upsertProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonId, sentenceOrder } = req.body;

    if (!lessonId) {
      return res.status(400).json({ message: "lessonId is required" });
    }

    let progress = await Progress.findOne({ userId, lessonId });

    // 👉 nếu chưa có
    if (!progress) {
      progress = await Progress.create({
        userId,
        lessonId,
        status: "in-progress",
        completedSentences: sentenceOrder !== undefined ? [sentenceOrder] : []
      });
    } else {
      // 👉 nếu đã completed → chuyển sang reviewing
      if (progress.status === "completed") {
        progress.status = "reviewing";
        progress.completedSentences = [];
        progress.currentSentence = -1;
      }

      // 👉 thêm câu
      if (sentenceOrder !== undefined) {
        if (!progress.completedSentences.includes(sentenceOrder)) {
          progress.completedSentences.push(sentenceOrder);
        }
      }

      // 👉 nếu đang học bình thường
      if (progress.status === "not-started") {
        progress.status = "in-progress";
      }
    }

    // 🔥 tính currentSentence
    const sorted = [...progress.completedSentences].sort((a, b) => a - b);
    let current = sorted[0] ?? -1;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === current + 1) current = sorted[i];
      else break;
    }

    progress.currentSentence = current;

    const lesson = await Lesson.findById(lessonId).select("sentenceCount");

    // ✅ hoàn thành
    if (lesson && progress.completedSentences.length >= lesson.sentenceCount) {
      progress.status = "completed";
      progress.completedSentences = [];
      progress.currentSentence = -1;

      // update stats
      const completedCount = await Progress.countDocuments({
        userId,
        status: "completed"
      });

      await User.findByIdAndUpdate(userId, {
        totalLessons: completedCount
      });
    }

    await progress.save();

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//PATCH /progress/:lessonId/like
export const toggleLike = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { lessonId } = req.params;

    let progress = await Progress.findOne({ userId, lessonId });

    if (!progress) {
      progress = await Progress.create({
        userId,
        lessonId,
        isLiked: true
      });

      return res.json({ success: true, isLiked: true });
    }

    progress.isLiked = !progress.isLiked;

    // ❌ unlike + chưa học → xoá
    if (
      !progress.isLiked &&
      progress.status === "not-started"
    ) {
      await Progress.deleteOne({ _id: progress._id });

      return res.json({ success: true, isLiked: false });
    }

    await progress.save();

    res.json({
      success: true,
      isLiked: progress.isLiked
    });

  } catch (error) {
    next(error);
  }
};

//PATCH progress/:lessonId/reset
export const resetProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonId } = req.params;

    const progress = await Progress.findOne({ userId, lessonId });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    // ❌ chưa học + không like → xoá
    if (
      !progress.isLiked &&
      ["not-started", "in-progress"].includes(progress.status)
    ) {
      await Progress.deleteOne({ _id: progress._id });

      return res.json({ success: true, message: "Deleted" });
    }

    // reset
    progress.completedSentences = [];
    progress.currentSentence = -1;

    // 👉 nếu đang review → quay lại completed
    if (progress.status === "reviewing") {
      progress.status = "completed";
    }
    // 👉 còn lại reset bình thường
    else if (progress.status !== "completed") {
      progress.status = "not-started";
    }

    await progress.save();

    res.json({
      success: true,
      data: progress
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//GET progress/
export const getMyProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    const progress = await Progress.find({
      userId,
    }).populate({
      path: "lessonId",
      select: "title slug sentenceCount groupId",
      populate: {
        path: "groupId",
        select: "slug topicId",
        populate: {
          path: "topicId",
          select: "slug"
        }
      }
    });

    if (progress.length === 0) {
      return res.status(404).json({ message: "No in-progress lesson" });
    }

    res.json(progress);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

