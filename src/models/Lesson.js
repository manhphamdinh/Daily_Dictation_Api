import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LessonGroup',
    required: true
  },
  
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  
  audioUrl: {
    type: String,
    default: null
  },
  
  level: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: true
  },
  
  sentenceCount: {
    type: Number,
    default: 0
  },
  
  order: {
    type: Number,
    default: 0
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
}, {
  timestamps: true
});

// Indexes
lessonSchema.index({ groupId: 1, order: 1 });
lessonSchema.index({ level: 1 });

export default mongoose.model('Lesson', lessonSchema);