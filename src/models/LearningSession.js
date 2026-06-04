import mongoose from 'mongoose'

const learningSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // 🔥 đổi từ Date → String
      required: true,
    },
    activeSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
)

// Unique: mỗi user chỉ có 1 document per ngày
learningSessionSchema.index({ userId: 1, date: 1 }, { unique: true })

export default mongoose.model('LearningSession', learningSessionSchema)