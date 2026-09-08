import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';
import { buildPoemListPipeline } from '@/lib/poemQueries';

// A single author's poem count is naturally bounded (unlike the global explore
// feed), so this keeps returning the whole profile grid in one shot rather than
// adding cursor pagination — the fix here is dropping the unbounded embedded
// comments/likes/annotations arrays, which is what actually made this response
// balloon for any prolific or well-liked poet.
const MAX_PROFILE_POEMS = 200;

export async function GET(request, { params }) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername);
    await connectDB();

    // First find the user by username (case-insensitive)
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentUser = await getAuthenticatedUser(request).catch(() => null);

    const poems = await Poem.aggregate(buildPoemListPipeline({
      match: { author: user._id },
      limit: MAX_PROFILE_POEMS,
      currentUserId: currentUser?._id || null,
    }));

    return NextResponse.json(poems);
  } catch (error) {
    console.error('Get user poems error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
