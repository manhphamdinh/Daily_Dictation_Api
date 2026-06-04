import mongoose from 'mongoose';

const lessonGroupSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
    index: true
  },
  
  // Basic Info
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Metadata
  year: {
    type: Number,
    min: 2000,
    max: 2100
  },
  
  // Content Stats
  lessonCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Display & Access
  order: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
lessonGroupSchema.index({ topicId: 1, order: 1 });
lessonGroupSchema.index({ topicId: 1, year: -1 });
lessonGroupSchema.index({ slug: 1 });

// Compound unique index để tránh trùng slug trong cùng topic
lessonGroupSchema.index({ topicId: 1, slug: 1 }, { unique: true });

// Virtual: lessons (populate khi cần)
lessonGroupSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'groupId'
});

// Method: Update lesson count
lessonGroupSchema.methods.updateLessonCount = async function() {
  const Lesson = mongoose.model('Lesson');
  const count = await Lesson.countDocuments({ groupId: this._id });
  this.lessonCount = count;
  return this.save();
};

// Static: Get groups by topic
lessonGroupSchema.statics.getByTopic = function(topicId, options = {}) {
  const query = { topicId, isActive: true };
  
  return this.find(query)
    .sort(options.sort || { order: 1 })
    .select(options.select || '-__v')
    .lean();
};

// Pre-save: Auto-generate slug from title if not provided
lessonGroupSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  if (!this.shortTitle) {
    this.shortTitle = this.title;
  }
  
  next();
});

export default mongoose.model('LessonGroup', lessonGroupSchema);