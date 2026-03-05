import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/utils/auth';
import Notification from '@/lib/models/Notification';

export async function PUT(request, { params }) {
    try {
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

        const { id } = params;
        await connectDB();

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: decoded.userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Mark notification read error:', error);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}
