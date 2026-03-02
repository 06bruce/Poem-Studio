import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function POST(request, { params }) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id: poemId } = await params;
        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
        }

        if (content.length > 500) {
            return NextResponse.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 });
        }

        await connectDB();

        const poem = await Poem.findByIdAndUpdate(
            poemId,
            {
                $push: {
                    comments: {
                        user: user._id,
                        username: user.username,
                        content: content.trim(),
                        createdAt: new Date()
                    }
                }
            },
            { returnDocument: 'after' }
        ).populate('author', 'username').populate('coAuthors', 'username');

        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }

        return NextResponse.json(poem);
    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
