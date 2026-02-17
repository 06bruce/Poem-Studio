import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';

export async function PATCH(request) {
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
        const { username, bio } = body;

        await connectDB();

        // Find the user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if new username is taken
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            }
            user.username = username;
        }

        if (bio !== undefined) {
            user.bio = bio;
        }

        await user.save();

        return NextResponse.json({
            message: 'Essence modified successfully',
            user: {
                id: user._id,
                username: user.username,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
