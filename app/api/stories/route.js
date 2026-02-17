import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';

export async function GET(request) {
    try {
        await connectDB();
        const stories = await Story.find()
            .populate('userId', 'username bio')
            .populate('mentions', 'username')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        return NextResponse.json(stories);
    } catch (error) {
        console.error('Fetch stories error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Access token required' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid access token' }, { status: 403 });
        }

        const body = await request.json();
        const { content, colorTheme, mentions = [] } = body;

        if (!content) {
            return NextResponse.json({ error: 'Story content is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const story = new Story({
            userId: user._id,
            username: user.username,
            content,
            colorTheme: colorTheme || 'blue',
            mentions: Array.isArray(mentions) ? mentions : []
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
        const authHeader = request.headers.get('authorization');
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid access token' }, { status: 403 });

        const { storyId, content, colorTheme } = await request.json();

        await connectDB();
        const story = await Story.findById(storyId);
        if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

        if (story.userId.toString() !== decoded.userId) {
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
        const authHeader = request.headers.get('authorization');
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return NextResponse.json({ error: 'Access token required' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Invalid access token' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const storyId = searchParams.get('storyId');

        await connectDB();
        const story = await Story.findById(storyId);
        if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

        if (story.userId.toString() !== decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await Story.findByIdAndDelete(storyId);
        return NextResponse.json({ message: 'Story deleted' });
    } catch (error) {
        console.error('Delete story error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
