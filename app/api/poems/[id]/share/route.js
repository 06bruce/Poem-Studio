import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import User from '@/lib/models/User';
import SharedPoem from '@/lib/models/SharedPoem';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function POST(request, { params }) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id: poemId } = await params;
        const { recipientId, message = '' } = await request.json();

        if (!recipientId) {
            return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
        }

        if (recipientId === user._id.toString()) {
            return NextResponse.json({ error: 'Cannot share a poem with yourself' }, { status: 400 });
        }

        await connectDB();

        const [poem, recipient] = await Promise.all([
            Poem.findById(poemId),
            User.findById(recipientId),
        ]);

        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }
        if (!recipient) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        const shared = await SharedPoem.create({
            sender: user._id,
            recipient: recipientId,
            poem: poemId,
            message: message.slice(0, 200),
        });

        return NextResponse.json({
            message: `Poem shared with @${recipient.username}`,
            shared,
        });
    } catch (error) {
        console.error('Share poem error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
