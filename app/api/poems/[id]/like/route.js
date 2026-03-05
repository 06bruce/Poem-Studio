import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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

    // Check if already liked
    const existingLike = poem.likes.find(like =>
      like.userId.toString() === user._id.toString()
    );

    if (existingLike) {
      return NextResponse.json(
        { error: 'Poem already liked' },
        { status: 400 }
      );
    }

    // Add like
    poem.likes.push({
      userId: user._id,
      username: user.username,
      likedAt: new Date()
    });

    await poem.save();

    // Create notification if the liker is not the author
    if (poem.author.toString() !== user._id.toString()) {
      try {
        const Notification = (await import('@/lib/models/Notification')).default;
        await Notification.create({
          recipient: poem.author,
          sender: user._id,
          type: 'like',
          poem: poem._id,
          message: `${user.username} liked your poem "${poem.title}"`
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }

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
