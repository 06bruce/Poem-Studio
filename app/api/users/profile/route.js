import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';
import { auth } from '@/auth';

export async function PATCH(request) {
    try {
        let userId = null;

        // 1. Try NextAuth session (for Google/OAuth users)
        const session = await auth();
        if (session?.user) {
            await connectDB();
            const user = await User.findOne({ email: session.user.email });
            if (user) {
                userId = user._id;
            }
        }

        // 2. Try JWT token (for native users) if no session found
        if (!userId) {
            const authHeader = request.headers.get('authorization');
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                const decoded = verifyToken(token);
                if (decoded) {
                    userId = decoded.userId;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { username, bio } = body;

        await connectDB();

        // Find the user
        const user = await User.findById(userId);
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
