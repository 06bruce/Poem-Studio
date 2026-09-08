import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { requireAdmin } from '@/lib/utils/adminAuth';
import { buildPoemListPipeline } from '@/lib/poemQueries';

// The admin poems tab does client-side search/sort over the whole list (no
// pagination UI), so this keeps returning everything in one shot rather than
// changing that contract — but it previously had no bound at all and shipped
// every embedded comment/like/annotation for every poem in the database. This
// caps it at a generous number and trims each poem down to counts plus a small
// comments preview (what the admin UI actually renders).
const MAX_ADMIN_POEMS = 1000;
const COMMENTS_PREVIEW_COUNT = 5;

export async function GET(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const poems = await Poem.aggregate(buildPoemListPipeline({
            limit: MAX_ADMIN_POEMS,
            commentsPreviewCount: COMMENTS_PREVIEW_COUNT,
            authorProjection: { username: 1, email: 1, avatar: 1 },
        }));

        return NextResponse.json(poems);
    } catch (error) {
        console.error('Admin poem fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch poems' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const poemId = searchParams.get('poemId');

        if (!poemId) {
            return NextResponse.json({ error: 'Poem ID is required' }, { status: 400 });
        }

        await connectDB();
        const poem = await Poem.findByIdAndDelete(poemId);
        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Poem deleted successfully' });
    } catch (error) {
        console.error('Admin poem delete error:', error);
        return NextResponse.json({ error: 'Failed to delete poem' }, { status: 500 });
    }
}
