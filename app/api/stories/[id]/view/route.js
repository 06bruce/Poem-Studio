import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';

export async function POST(request, { params }) {
    try {
        const { id: storyId } = await params;
        await connectDB();

        const story = await Story.findByIdAndUpdate(
            storyId,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!story) {
            return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        }

        return NextResponse.json({ views: story.views });
    } catch (error) {
        console.error('Increment view error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
