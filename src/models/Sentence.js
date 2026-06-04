import mongoose from 'mongoose';

const sentenceSchema = new mongoose.Schema({
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    audioUrl: {
        type: String,
        default: null
    },

    order: {
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    hint: [String],
    startTime: {
        type: Number,
        required: true,
    },
    endTime: {
        type: Number,
        required: true,
    }
});

export default mongoose.model('Sentence', sentenceSchema);