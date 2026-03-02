import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const annotationSchema = new mongoose.Schema({
  lineIndex: { type: Number, required: true },
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  theme: {
    type: String,
    default: 'general',
  },
  mood: {
    type: String,
    default: 'neutral',
  },
  likes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [commentSchema],
  annotations: [annotationSchema],
  source: {
    type: String,
    default: 'user-created',
  },
  promptTag: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
poemSchema.index({ author: 1, createdAt: -1 });
poemSchema.index({ createdAt: -1 });

export default mongoose.models.Poem || mongoose.model('Poem', poemSchema);
