import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    await connectDB();

    // Optional: filter out blocked or private users if those features existed
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username avatar bio')
      .limit(10)
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
