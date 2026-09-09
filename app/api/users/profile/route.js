import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function PATCH(request) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { username, bio, avatar } = body;

        await connectDB();

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

        if (avatar !== undefined) {
            // The editor uploads images as base64 data URIs; a couple MB of
            // *encoded text* stored directly on the user document gets
            // reshipped on every poem/list that shows this author, which is
            // exactly what was ballooning feed payloads. Cap it well below
            // what a small profile-photo data URI needs (a few hundred KB),
            // while still allowing plain avatar URLs of any length.
            if (typeof avatar === 'string' && avatar.startsWith('data:') && avatar.length > 300_000) {
                return NextResponse.json({ error: 'That image is too large — please use a smaller photo.' }, { status: 400 });
            }
            user.avatar = avatar;
        }

        await user.save();

        return NextResponse.json({
            message: 'Essence modified successfully',
            user: {
                id: user._id,
                username: user.username,
                bio: user.bio,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
