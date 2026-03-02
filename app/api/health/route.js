import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    } catch (error) {
        return NextResponse.json(
            { status: 'unhealthy', error: 'Database connection failed' },
            { status: 503 }
        );
    }
}
