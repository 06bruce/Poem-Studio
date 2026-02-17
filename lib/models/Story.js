import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 200, // Short verses only
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    colorTheme: {
        type: String,
        default: 'blue', // blue, purple, emerald, rose, amber
    },
    views: {
        type: Number,
        default: 0,
    },
    resonance: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400, // 24 hours in seconds
    },
});

export default mongoose.models.Story || mongoose.model('Story', storySchema);
