import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function GET(request) {
    try {
        await connectDB();

        // Try to get the authenticated user (optional — guests can still see public)
        const user = await getAuthenticatedUser(request).catch(() => null);

        const stories = await Story.find()
            .populate('userId', 'username bio avatar closeFriends')
            .populate('mentions', 'username')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Filter stories by visibility
        const viewerId = user?._id?.toString();
        const filtered = stories.filter(story => {
            if (story.visibility === 'close_friends') {
                // Only show if viewer is the creator or in the creator's close friends list
                const creatorId = story.userId?._id?.toString();
                if (viewerId && creatorId === viewerId) return true;
                const closeFriends = story.userId?.closeFriends?.map(id => id.toString()) || [];
                return viewerId && closeFriends.includes(viewerId);
            }
            return true; // public
        });

        // Strip closeFriends from response for privacy
        const clean = filtered.map(s => {
            if (s.userId) {
                const { closeFriends, ...rest } = s.userId;
                return { ...s, userId: rest };
            }
            return s;
        });

        return NextResponse.json(clean);
    } catch (error) {
        console.error('Fetch stories error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { content, colorTheme, mentions = [], visibility = 'public' } = body;

        if (!content) {
            return NextResponse.json({ error: 'Story content is required' }, { status: 400 });
        }

        await connectDB();

        const story = new Story({
            userId: user._id,
            username: user.username,
            content,
            colorTheme: colorTheme || 'blue',
            mentions: Array.isArray(mentions) ? mentions : [],
            visibility: ['public', 'close_friends'].includes(visibility) ? visibility : 'public',
        });

        await story.save();
        return NextResponse.json(story);
    } catch (error) {
        console.error('Create story error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { storyId, content, colorTheme } = await request.json();

        await connectDB();
        const story = await Story.findById(storyId);
        if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

        if (story.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check 10 minute window
        const ageInMinutes = (Date.now() - new Date(story.createdAt).getTime()) / (1000 * 60);
        if (ageInMinutes > 10) {
            return NextResponse.json({ error: 'Editing period (10m) has passed' }, { status: 400 });
        }

        if (content) story.content = content;
        if (colorTheme) story.colorTheme = colorTheme;

        await story.save();
        return NextResponse.json(story);
    } catch (error) {
        console.error('Edit story error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const storyId = searchParams.get('storyId');

        await connectDB();
        const story = await Story.findById(storyId);
        if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

        if (story.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await Story.findByIdAndDelete(storyId);
        return NextResponse.json({ message: 'Story deleted' });
    } catch (error) {
        console.error('Delete story error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
