import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SharedPoem from '@/lib/models/SharedPoem';
import { getAuthenticatedUser } from '@/lib/utils/auth';

// GET — poems shared to the current user
export async function GET(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        await connectDB();

        const shared = await SharedPoem.find({ recipient: user._id })
            .populate('sender', 'username avatar')
            .populate({
                path: 'poem',
                populate: { path: 'author', select: 'username avatar' },
            })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json(shared);
    } catch (error) {
        console.error('Fetch shared poems error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH — mark shared poems as read
export async function PATCH(request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { sharedPoemIds } = await request.json();

        await connectDB();
        await SharedPoem.updateMany(
            { _id: { $in: sharedPoemIds }, recipient: user._id },
            { read: true }
        );

        return NextResponse.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark shared read error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
