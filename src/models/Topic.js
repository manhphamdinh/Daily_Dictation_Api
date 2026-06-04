import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  image: String,
  
  levels: [{
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  }],
  
  lessonCount: {
    type: Number,
    default: 0
  },
  
  order: {
    type: Number,
    default: 0
  },
  
  isVideo: {
    type: Boolean,
    default: false
  },
}, {
  timestamps: true
});

// Index
topicSchema.index({ slug: 1 });

export default mongoose.model('Topic', topicSchema);