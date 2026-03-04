import mongoose from 'mongoose';

const sharedPoemSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    poem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poem',
        required: true,
    },
    message: {
        type: String,
        maxlength: 200,
        default: '',
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

sharedPoemSchema.index({ recipient: 1, createdAt: -1 });
sharedPoemSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.models.SharedPoem || mongoose.model('SharedPoem', sharedPoemSchema);
