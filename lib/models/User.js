import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  password: {
    type: String,
  },
  bio: {
    type: String,
    maxlength: 150,
    default: '',
  },
  socialLinks: {
    type: Map,
    of: String,
  },
  avatar: String,
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  favoritePoems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poem',
  }],
  collections: [{
    name: String,
    description: String,
    poems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poem' }],
    createdAt: { type: Date, default: Date.now }
  }],
  badges: [String],
  // Writing streak tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastWrittenAt: { type: Date, default: null },
  totalPoems: { type: Number, default: 0 },
  closeFriends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


// Hash password before saving (skip for OAuth users with no password)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcryptjs.hash(this.password, 10);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
