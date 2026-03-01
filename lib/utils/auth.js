import jwt from 'jsonwebtoken';
import { auth } from '@/auth';
import User from '@/lib/models/User';
import connectDB from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not set in environment');
  }
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '14d' });
};

export const verifyToken = (token) => {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not set in environment');
    }
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('JWT verification failed: Token expired at', error.expiredAt);
    } else if (error.name === 'JsonWebTokenError') {
      console.error('JWT verification failed: Invalid token structure or signature');
    } else {
      console.error('JWT verification failed:', error.message);
    }
    return null;
  }
};

/**
 * Unified authentication helper that supports both NextAuth sessions (Google)
 * and manual JWT tokens (Native email/password).
 */
export const getAuthenticatedUser = async (req) => {
  try {
    // 1. Try NextAuth session (check cookie)
    const session = await auth();
    if (session?.user) {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (user) return user;
    }

    // 2. Try JWT token (check Authorization header)
    const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        await connectDB();
        const user = await User.findById(decoded.userId);
        if (user) return user;
      }
    }

    return null;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid access token' });
  }

  req.userId = decoded.userId;
  next();
};
