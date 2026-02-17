import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(request, { params }) {
    try {
        const { id: poemId } = await params;
        const authHeader = request.headers.get('authorization');
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Access token required' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid access token' }, { status: 403 });
        }

        const { collectionName } = await request.json();
        if (!collectionName) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const collection = user.collections.find(c => c.name === collectionName);
        if (!collection) {
            return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
        }

        // Toggle poem in collection
        const poemIndex = collection.poems.indexOf(poemId);
        if (poemIndex > -1) {
            // Remove if exists
            collection.poems.splice(poemIndex, 1);
            await user.save();
            return NextResponse.json({ message: 'Poem removed from collection', saved: false });
        } else {
            // Add if not exists
            collection.poems.push(poemId);
            await user.save();
            return NextResponse.json({ message: 'Poem saved to collection', saved: true });
        }

    } catch (error) {
        console.error('Save to collection error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
