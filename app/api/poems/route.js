import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';
import { authenticateToken } from '@/lib/utils/auth';

// Get all poems
export async function GET(request) {
  try {
    await connectDB();
    const poems = await Poem.find()
      .populate('author', 'username')
      .populate('coAuthors', 'username')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(poems);
  } catch (error) {
    console.error('Get poems error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Create poem (authenticated users only)
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    const { verifyToken } = await import('@/lib/utils/auth');
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, theme = 'general', mood = 'neutral', source = 'user-created', coAuthors = [] } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user info
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create poem
    const poem = new Poem({
      title,
      content,
      author: decoded.userId,
      coAuthors: Array.isArray(coAuthors) ? coAuthors : [],
      authorName: user.username,
      theme,
      mood,
      source,
    });

    await poem.save();

    // Populate author info for response
    await poem.populate('author', 'username');
    await poem.populate('coAuthors', 'username');

    return NextResponse.json(poem);
  } catch (error) {
    console.error('Create poem error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
