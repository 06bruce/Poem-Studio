import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    await connectDB();

    const poem = await Poem.findById(id);
    if (!poem) {
      return NextResponse.json(
        { error: 'Poem not found' },
        { status: 404 }
      );
    }

    // Get user info for the like
    const { User } = await import('@/lib/models/User');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = poem.likes.find(like =>
      like.userId.toString() === decoded.userId
    );

    if (existingLike) {
      return NextResponse.json(
        { error: 'Poem already liked' },
        { status: 400 }
      );
    }

    // Add like
    poem.likes.push({
      userId: decoded.userId,
      username: user.username,
      likedAt: new Date()
    });

    await poem.save();
    await poem.populate('author', 'username');

    return NextResponse.json(poem);
  } catch (error) {
    console.error('Like poem error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
