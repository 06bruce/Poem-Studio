import mongoose from 'mongoose';
import { publish } from '@/lib/notificationBus';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'follow', 'comment', 'mention'],
        required: true
    },
    poem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poem'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Push straight to any open SSE connection for the recipient, so the client
// hears about it instantly instead of waiting for its next poll.
notificationSchema.post('save', function (doc) {
  publish(doc.recipient, {
    type: 'notification',
    notificationType: doc.type,
    message: doc.message,
    createdAt: doc.createdAt,
  });
});

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
