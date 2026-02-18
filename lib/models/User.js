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
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: '',
    maxlength: 300,
  },
  social: {
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  avatar: {
    type: String,
    default: '', // URL or base64
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favoritePoems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poem' }],
  collections: [{
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isPublic: { type: Boolean, default: true },
    poems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poem' }],
    createdAt: { type: Date, default: Date.now }
  }],
  badges: [{ type: String }],
  pinnedPoem: { type: mongoose.Schema.Types.ObjectId, ref: 'Poem', default: null },
  notifyOnFollowedPoem: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcryptjs.hash(this.password, 10);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
