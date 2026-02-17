import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Poem from '@/lib/models/Poem';
import { verifyToken } from '@/lib/utils/auth';

// Get single poem
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const poem = await Poem.findById(id)
      .populate('author', 'username');

    if (!poem) {
      return NextResponse.json(
        { error: 'Poem not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(poem);
  } catch (error) {
    console.error('Get poem error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Edit poem (only author within 10 minutes)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    await connectDB();
    const poem = await Poem.findById(id);

    if (!poem) {
      return NextResponse.json(
        { error: 'Poem not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (poem.author.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Only the author can edit this poem' },
        { status: 403 }
      );
    }

    // Check if within 10 minutes of creation
    const now = new Date();
    const createdAt = new Date(poem.createdAt);
    const diffInMinutes = (now - createdAt) / (1000 * 60);

    if (diffInMinutes > 10) {
      return NextResponse.json(
        { error: 'Edit window expired. Poems can only be edited within 10 minutes of creation.' },
        { status: 403 }
      );
    }

    // Update poem
    const body = await request.json();
    const { title, content, theme, mood } = body;

    if (title) poem.title = title;
    if (content) poem.content = content;
    if (theme) poem.theme = theme;
    if (mood) poem.mood = mood;

    poem.updatedAt = new Date();
    await poem.save();

    // Populate author info for response
    await poem.populate('author', 'username');

    return NextResponse.json(poem);
  } catch (error) {
    console.error('Edit poem error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Delete poem (only author)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    await connectDB();
    const poem = await Poem.findById(id);

    if (!poem) {
      return NextResponse.json(
        { error: 'Poem not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (poem.author.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Only the author can delete this poem' },
        { status: 403 }
      );
    }

    await Poem.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Poem deleted successfully' }
    );
  } catch (error) {
    console.error('Delete poem error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
