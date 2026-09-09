import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';
import { buildPoemListPipeline, buildPoemsETag } from '@/lib/poemQueries';
import { getCached, setCached, invalidateCached } from '@/lib/serverCache';

// First page of the anonymous (no `before` cursor, no logged-in user) feed is
// identical for every visitor, so it's worth a short-lived process-local cache
// on top of the per-request query trimming below.
const ANON_FIRST_PAGE_TTL_MS = 20000;

// Get all poems
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const before = searchParams.get('before'); // cursor-based pagination

    // Optional — the explore feed is public, but we still personalize
    // `likedByMe` when a valid session/token is present.
    const currentUser = await getAuthenticatedUser(request).catch(() => null);
    const isAnonymousFirstPage = !before && !currentUser;
    const cacheKey = `poems:explore:first:${limit}`;

    let payload = isAnonymousFirstPage ? getCached(cacheKey) : undefined;

    if (!payload) {
      await connectDB();
      const query = before ? { createdAt: { $lt: new Date(before) } } : {};
      const poems = await Poem.aggregate(buildPoemListPipeline({
        match: query,
        limit,
        currentUserId: currentUser?._id || null,
      }));

      const nextCursor = poems.length === limit
        ? poems[poems.length - 1].createdAt.toISOString()
        : null;

      payload = {
        items: poems,
        nextCursor,
        hasMore: Boolean(nextCursor),
        etag: buildPoemsETag(poems),
      };

      if (isAnonymousFirstPage) setCached(cacheKey, payload, ANON_FIRST_PAGE_TTL_MS);
    }

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === payload.etag) {
      return new NextResponse(null, { status: 304 });
    }

    // A personalized response (likedByMe) must never be cached by a shared/CDN
    // cache — only the anonymous, identical-for-everyone response is `public`.
    const cacheControl = currentUser
      ? 'private, max-age=15, stale-while-revalidate=30'
      : 'public, s-maxage=30, stale-while-revalidate=60';

    return NextResponse.json({
      items: payload.items,
      nextCursor: payload.nextCursor,
      hasMore: payload.hasMore,
    }, {
      headers: {
        'Cache-Control': cacheControl,
        ETag: payload.etag,
      },
    });
  } catch (error) {
    console.error('Get poems error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create poem (authenticated users only)
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, theme = 'general', mood = 'neutral', coAuthors = [], promptTag = null } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long (max 200 chars)' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 });
    }

    await connectDB();

    // Create poem
    const poem = new Poem({
      title,
      content,
      author: user._id,
      coAuthors: Array.isArray(coAuthors) ? coAuthors : [],
      authorName: user.username,
      theme,
      mood,
      source: 'user-created',
      promptTag,
    });

    await poem.save();
    invalidateCached('poems:explore:first:');

    // Update writing streak
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWritten = user.lastWrittenAt ? new Date(user.lastWrittenAt) : null;
    const lastWrittenDay = lastWritten
      ? new Date(lastWritten.getFullYear(), lastWritten.getMonth(), lastWritten.getDate())
      : null;

    let streakUpdate = { lastWrittenAt: now, $inc: { totalPoems: 1 } };

    if (!lastWrittenDay) {
      // First ever poem
      streakUpdate.currentStreak = 1;
      streakUpdate.longestStreak = 1;
    } else {
      const diffDays = Math.floor((today - lastWrittenDay) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive day — extend streak
        const newStreak = (user.currentStreak || 0) + 1;
        streakUpdate.currentStreak = newStreak;
        if (newStreak > (user.longestStreak || 0)) {
          streakUpdate.longestStreak = newStreak;
        }
      } else if (diffDays > 1) {
        // Streak broken
        streakUpdate.currentStreak = 1;
      }
      // diffDays === 0 means same day, don't change streak
    }

    await User.findByIdAndUpdate(user._id, streakUpdate);

    // Mention detection in poem content
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.substring(1).toLowerCase());
      const uniqueUsernames = [...new Set(usernames)].filter(u => u !== user.username.toLowerCase());

      try {
        const Notification = (await import('@/lib/models/Notification')).default;
        const mentionedUsers = await User.find({ username: { $in: uniqueUsernames.map(u => new RegExp(`^${u}$`, 'i')) } });

        for (const targetUser of mentionedUsers) {
          await Notification.create({
            recipient: targetUser._id,
            sender: user._id,
            type: 'mention',
            poem: poem._id,
            message: `${user.username} mentioned you in a poem: "${title}"`
          });
        }
      } catch (err) {
        console.error('Failed to create mention notifications:', err);
      }
    }

    return NextResponse.json(poem);

  } catch (error) {
    console.error('Create poem error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
