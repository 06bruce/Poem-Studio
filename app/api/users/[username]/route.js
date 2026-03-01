import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request, { params }) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername);
    await connectDB();

    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
      .select('username bio createdAt followers following')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
