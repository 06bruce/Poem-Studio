import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { stripBase64Avatars } from '@/lib/avatarSanitize';

// Full annotation set for one poem, fetched lazily by the feed card once it
// scrolls into view (and only when the list response's `annotationLines` says
// the poem actually has any) — the list endpoint never ships annotation
// content itself.
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const poem = await Poem.findById(id)
      .select('annotations')
      .populate('annotations.userId', 'username avatar')
      .lean();

    if (!poem) {
      return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
    }

    return NextResponse.json({ annotations: stripBase64Avatars(poem.annotations || []) }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Get poem annotations error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
