import mongoose from 'mongoose';

const translationItemSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true
  },
  translation: {
    type: String,
    required: true
  }
}, { _id: false });

const translationSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    unique: true // mỗi lesson chỉ có 1 bản dịch
  },

  translations: {
    type: [translationItemSchema],
    default: []
  }

}, {
  timestamps: true
});

export default mongoose.model('Translation', translationSchema);