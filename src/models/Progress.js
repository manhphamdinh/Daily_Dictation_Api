import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'reviewing'],
    default: 'not-started'
  },

  isLiked: {
    type: Boolean,
    default: false
  },
  
  completedSentences: {
  type: [Number],
  default: []
}, 
  
  currentSentence: {
  type: Number,
  default: 0
}
}, {
  timestamps: true
});

// Compound unique index
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
progressSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Progress', progressSchema);