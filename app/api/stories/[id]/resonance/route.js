import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request, { params }) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid access token' }, { status: 403 });

        const { id: storyId } = await params;
        await connectDB();

        const story = await Story.findById(storyId);
        if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

        const isResonating = story.resonance.includes(decoded.userId);
        const update = isResonating
            ? { $pull: { resonance: decoded.userId } }
            : { $addToSet: { resonance: decoded.userId } };

        const updatedStory = await Story.findByIdAndUpdate(
            storyId,
            update,
            { new: true }
        );

        return NextResponse.json({
            resonanceCount: updatedStory.resonance.length,
            isResonating: updatedStory.resonance.includes(decoded.userId)
        });
    } catch (error) {
        console.error('Toggle resonance error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
