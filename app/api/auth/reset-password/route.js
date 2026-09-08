import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset code and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({
      resetTokenHash: sha256(token),
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    user.password = password;
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}