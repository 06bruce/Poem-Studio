import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';

export async function GET(request) {
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

        await connectDB();
        const user = await User.findById(decoded.userId)
            .select('collections')
            .populate({
                path: 'collections.poems',
                populate: { path: 'author', select: 'username' }
            });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user.collections);
    } catch (error) {
        console.error('Fetch collections error:', error);
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
        const { name, description, isPublic } = body;

        if (!name) {
            return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if collection name already exists
        if (user.collections.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            return NextResponse.json({ error: 'Collection with this name already exists' }, { status: 400 });
        }

        const newCollection = {
            name,
            description: description || '',
            isPublic: isPublic !== undefined ? isPublic : true,
            poems: [],
            createdAt: new Date()
        };

        user.collections.push(newCollection);
        await user.save();

        return NextResponse.json(user.collections[user.collections.length - 1]);
    } catch (error) {
        console.error('Create collection error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
