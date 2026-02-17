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

    // Remove like
    poem.likes = poem.likes.filter(like =>
      like.userId.toString() !== decoded.userId
    );

    await poem.save();
    await poem.populate('author', 'username');

    return NextResponse.json(poem);
  } catch (error) {
    console.error('Unlike poem error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
