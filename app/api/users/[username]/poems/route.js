import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    await connectDB();

    // First find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Then find poems by that user's ID
    const poems = await Poem.find({ author: user._id })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(poems);
  } catch (error) {
    console.error('Get user poems error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
