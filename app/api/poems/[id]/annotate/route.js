import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
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

        const { lineIndex, content } = await request.json();
        if (lineIndex === undefined || !content) {
            return NextResponse.json({ error: 'Line index and content are required' }, { status: 400 });
        }

        await connectDB();
        const [poem, user] = await Promise.all([
            Poem.findById(poemId),
            User.findById(decoded.userId)
        ]);

        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const lines = poem.content.split('\n');
        if (lineIndex < 0 || lineIndex >= lines.length) {
            return NextResponse.json({ error: 'Invalid line index' }, { status: 400 });
        }

        const newAnnotation = {
            lineIndex,
            userId: user._id,
            username: user.username,
            content,
            createdAt: new Date()
        };

        poem.annotations.push(newAnnotation);
        await poem.save();

        return NextResponse.json(poem.annotations[poem.annotations.length - 1]);
    } catch (error) {
        console.error('Annotate error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id: poemId } = await params;
        const { searchParams } = new URL(request.url);
        const annotationId = searchParams.get('annotationId');

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
        const poem = await Poem.findById(poemId);
        if (!poem) {
            return NextResponse.json({ error: 'Poem not found' }, { status: 404 });
        }

        const annotation = poem.annotations.id(annotationId);
        if (!annotation) {
            return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
        }

        if (annotation.userId.toString() !== decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized to delete this annotation' }, { status: 403 });
        }

        annotation.remove();
        await poem.save();

        return NextResponse.json({ message: 'Annotation removed' });
    } catch (error) {
        console.error('Delete annotation error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
