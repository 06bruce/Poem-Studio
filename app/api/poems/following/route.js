import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';
import { buildPoemListPipeline } from '@/lib/poemQueries';

export async function GET(request) {
  try {
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
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const followingIds = user.following || [];

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const before = searchParams.get('before'); // cursor-based pagination

    const query = { author: { $in: followingIds } };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const poems = await Poem.aggregate(buildPoemListPipeline({
      match: query,
      limit,
      currentUserId: decoded.userId,
    }));
    
    const nextCursor = poems.length === limit
      ? poems[poems.length - 1].createdAt.toISOString()
      : null

    return NextResponse.json({
      items: poems,
      nextCursor,
      hasMore: Boolean(nextCursor)
    }, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Get following poems error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
