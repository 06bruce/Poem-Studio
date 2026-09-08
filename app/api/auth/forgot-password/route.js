import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const resetToken = crypto.randomBytes(32).toString('hex');
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      user.resetTokenHash = sha256(resetToken);
      user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
    }

    return NextResponse.json({ resetToken });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}