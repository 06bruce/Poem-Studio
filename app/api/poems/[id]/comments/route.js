import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { stripBase64Avatars } from '@/lib/avatarSanitize';

// Full comment thread for one poem, fetched lazily by the feed card only when
// a reader actually opens the comment panel — the list endpoint only ships a
// commentCount/preview, not this.
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const poem = await Poem.findById(id)
      .select('comments')
      .populate('comments.user', 'username avatar')
      .lean();

    if (!poem) {
      return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
    }

    return NextResponse.json({ comments: stripBase64Avatars(poem.comments || []) }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Get poem comments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
