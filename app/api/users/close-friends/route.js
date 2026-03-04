import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';

// GET — list current user's close friends
export async function GET(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        await connectDB();
        const fullUser = await User.findById(user._id)
            .populate('closeFriends', 'username avatar bio')
            .lean();

        return NextResponse.json(fullUser?.closeFriends || []);
    } catch (error) {
        console.error('Fetch close friends error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST — add a user to close friends
export async function POST(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { friendId } = await request.json();
        if (!friendId) {
            return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
        }
        if (friendId === user._id.toString()) {
            return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
        }

        await connectDB();

        const friend = await User.findById(friendId);
        if (!friend) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await User.findByIdAndUpdate(user._id, {
            $addToSet: { closeFriends: friendId },
        });

        return NextResponse.json({ message: `@${friend.username} added to close friends` });
    } catch (error) {
        console.error('Add close friend error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE — remove a user from close friends
export async function DELETE(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const friendId = searchParams.get('friendId');

        if (!friendId) {
            return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
        }

        await connectDB();
        await User.findByIdAndUpdate(user._id, {
            $pull: { closeFriends: friendId },
        });

        return NextResponse.json({ message: 'Removed from close friends' });
    } catch (error) {
        console.error('Remove close friend error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
