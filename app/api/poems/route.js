import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';

// Get all poems
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const before = searchParams.get('before'); // cursor-based pagination

    const query = before ? { createdAt: { $lt: new Date(before) } } : {};

    const poems = await Poem.find(query)
      .populate('author', 'username avatar')
      .populate('coAuthors', 'username')
      .populate('comments.user', 'username avatar')
      .populate('annotations.userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(poems);
  } catch (error) {
    console.error('Get poems error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create poem (authenticated users only)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, theme = 'general', mood = 'neutral', coAuthors = [], promptTag = null } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 chars)' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 });
    }

    await connectDB();

    // Create poem
    const poem = new Poem({
      title,
      content,
      author: user._id,
      coAuthors: Array.isArray(coAuthors) ? coAuthors : [],
      authorName: user.username,
      theme,
      mood,
      source: 'user-created',
      promptTag,
    });

    await poem.save();

    // Update writing streak
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWritten = user.lastWrittenAt ? new Date(user.lastWrittenAt) : null;
    const lastWrittenDay = lastWritten
      ? new Date(lastWritten.getFullYear(), lastWritten.getMonth(), lastWritten.getDate())
      : null;

    let streakUpdate = { lastWrittenAt: now, $inc: { totalPoems: 1 } };

    if (!lastWrittenDay) {
      // First ever poem
      streakUpdate.currentStreak = 1;
      streakUpdate.longestStreak = 1;
    } else {
      const diffDays = Math.floor((today - lastWrittenDay) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive day — extend streak
        const newStreak = (user.currentStreak || 0) + 1;
        streakUpdate.currentStreak = newStreak;
        if (newStreak > (user.longestStreak || 0)) {
          streakUpdate.longestStreak = newStreak;
        }
      } else if (diffDays > 1) {
        // Streak broken
        streakUpdate.currentStreak = 1;
      }
      // diffDays === 0 means same day, don't change streak
    }

    await User.findByIdAndUpdate(user._id, streakUpdate);

    // Populate author info for response
    await poem.populate('author', 'username avatar');
    await poem.populate('coAuthors', 'username');

    return NextResponse.json(poem);
  } catch (error) {
    console.error('Create poem error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
