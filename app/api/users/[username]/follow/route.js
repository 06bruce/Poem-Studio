import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function POST(request, { params }) {
    try {
        const currentUser = await getAuthenticatedUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { username } = await params;
        await connectDB();

        const targetUser = await User.findOne({ username: decodeURIComponent(username).toLowerCase() })
            || await User.findOne({ username: new RegExp(`^${decodeURIComponent(username)}$`, 'i') });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (targetUser._id.toString() === currentUser._id.toString()) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        const isFollowing = currentUser.following.some(
            id => id.toString() === targetUser._id.toString()
        );

        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(currentUser._id, {
                $pull: { following: targetUser._id }
            });
            await User.findByIdAndUpdate(targetUser._id, {
                $pull: { followers: currentUser._id }
            });

            return NextResponse.json({
                action: 'unfollowed',
                followersCount: Math.max(0, (targetUser.followers?.length || 1) - 1)
            });
        } else {
            // Follow
            await User.findByIdAndUpdate(currentUser._id, {
                $addToSet: { following: targetUser._id }
            });
            await User.findByIdAndUpdate(targetUser._id, {
                $addToSet: { followers: currentUser._id }
            });

            // Create notification
            try {
                const Notification = (await import('@/lib/models/Notification')).default;
                await Notification.create({
                    recipient: targetUser._id,
                    sender: currentUser._id,
                    type: 'follow',
                    message: `${currentUser.username} started following you`
                });
            } catch (err) {
                console.error('Failed to create follow notification:', err);
            }

            return NextResponse.json({
                action: 'followed',
                followersCount: (targetUser.followers?.length || 0) + 1
            });

        }
    } catch (error) {
        console.error('Follow/unfollow error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
