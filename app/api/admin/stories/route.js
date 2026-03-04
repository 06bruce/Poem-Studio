import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';
import { requireAdmin } from '@/lib/utils/adminAuth';

export async function GET(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const stories = await Story.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'username email avatar');

        return NextResponse.json(stories);
    } catch (error) {
        console.error('Admin story fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storyId = searchParams.get('storyId');

        if (!storyId) {
            return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
        }

        await connectDB();
        const story = await Story.findByIdAndDelete(storyId);
        if (!story) {
            return NextResponse.json({ error: 'Story not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Admin story delete error:', error);
        return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
    }
}
