import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function POST(request, { params }) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id: poemId } = await params;
        const { content } = await request.json();

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
        }

        if (content.length > 500) {
            return NextResponse.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 });
        }

        await connectDB();

        const poem = await Poem.findByIdAndUpdate(
            poemId,
            {
                $push: {
                    comments: {
                        user: user._id,
                        username: user.username,
                        content: content.trim(),
                        createdAt: new Date()
                    }
                }
            },
            { returnDocument: 'after' }
        ).select('author title comments');

        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }

        // Create notification for the author
        if (poem.author.toString() !== user._id.toString()) {
            try {
                const Notification = (await import('@/lib/models/Notification')).default;
                await Notification.create({
                    recipient: poem.author,
                    sender: user._id,
                    type: 'comment',
                    poem: poem._id,
                    message: `${user.username} commented on your poem "${poem.title}"`
                });
            } catch (err) {
                console.error('Failed to create comment notification:', err);
            }
        }

        // Mention detection
        const mentions = content.match(/@(\w+)/g);
        if (mentions) {
            const usernames = mentions.map(m => m.substring(1).toLowerCase());
            const uniqueUsernames = [...new Set(usernames)].filter(u => u !== user.username.toLowerCase());

            try {
                const User = (await import('@/lib/models/User')).default;
                const Notification = (await import('@/lib/models/Notification')).default;
                const mentionedUsers = await User.find({ username: { $in: uniqueUsernames.map(u => new RegExp(`^${u}$`, 'i')) } });

                for (const targetUser of mentionedUsers) {
                    if (targetUser._id.toString() === poem.author.toString()) continue; // Already notified as author

                    await Notification.create({
                        recipient: targetUser._id,
                        sender: user._id,
                        type: 'mention',
                        poem: poem._id,
                        message: `${user.username} mentioned you in a comment`
                    });
                }
            } catch (err) {
                console.error('Failed to create mention notifications:', err);
            }
        }

        // A small delta instead of the whole poem (which may carry hundreds of
        // other comments) — the caller merges the new comment into local state.
        return NextResponse.json({
            _id: poem._id,
            commentCount: poem.comments.length,
            comment: poem.comments[poem.comments.length - 1],
        });

    } catch (error) {
        console.error('Comment error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
