import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Poem from '@/lib/models/Poem';
import { requireAdmin } from '@/lib/utils/adminAuth';

export async function GET(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const users = await User.find()
            .sort({ createdAt: -1 })
            .select('username email avatar role bio createdAt totalPoems currentStreak longestStreak lastWrittenAt followers following badges');

        return NextResponse.json(users);
    } catch (error) {
        console.error('Admin user fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === admin._id.toString()) {
            return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
        }

        await connectDB();

        // Also delete all poems by the user
        await Poem.deleteMany({ author: userId });
        await User.findByIdAndDelete(userId);

        return NextResponse.json({ message: 'User and their content deleted successfully' });
    } catch (error) {
        console.error('Admin user delete error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, role, username, email, bio } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await connectDB();

        const updateFields = {};
        if (role !== undefined) updateFields.role = role;
        if (username !== undefined) updateFields.username = username;
        if (email !== undefined) updateFields.email = email;
        if (bio !== undefined) updateFields.bio = bio;

        const user = await User.findByIdAndUpdate(userId, updateFields, { new: true })
            .select('username email avatar role bio createdAt totalPoems currentStreak longestStreak lastWrittenAt followers following badges');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User updated', user });
    } catch (error) {
        console.error('Admin user update error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
