import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Poem from '@/lib/models/Poem';

export async function GET(request) {
  try {
    await connectDB();

    // Get users with poem counts and follower counts
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'poems',
          localField: '_id',
          foreignField: 'author',
          as: 'poems'
        }
      },
      {
        $project: {
          username: 1,
          bio: 1,
          createdAt: 1,
          poemCount: { $size: '$poems' },
          followers: 1
        }
      },
      {
        $match: {
          poemCount: { $gt: 0 }
        }
      },
      {
        $sort: {
          poemCount: -1,
          followers: -1
        }
      },
      {
        $limit: 5
      }
    ]);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Trending users error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
