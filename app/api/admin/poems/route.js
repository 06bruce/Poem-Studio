import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { requireAdmin } from '@/lib/utils/adminAuth';

export async function GET(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const poems = await Poem.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username email avatar');

        return NextResponse.json(poems);
    } catch (error) {
        console.error('Admin poem fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch poems' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const poemId = searchParams.get('poemId');

        if (!poemId) {
            return NextResponse.json({ error: 'Poem ID is required' }, { status: 400 });
        }

        await connectDB();
        const poem = await Poem.findByIdAndDelete(poemId);
        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Poem deleted successfully' });
    } catch (error) {
        console.error('Admin poem delete error:', error);
        return NextResponse.json({ error: 'Failed to delete poem' }, { status: 500 });
    }
}
