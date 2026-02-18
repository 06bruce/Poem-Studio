import mongoose from 'mongoose';

const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  authorName: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    default: 'general',
  },
  mood: {
    type: String,
    default: 'neutral',
  },
  source: {
    type: String,
    default: 'user-created',
  },
  likes: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: String,
      likedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  annotations: [
    {
      lineIndex: { type: Number, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Poem || mongoose.model('Poem', poemSchema);
