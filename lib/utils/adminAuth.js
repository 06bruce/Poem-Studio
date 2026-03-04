import { getAuthenticatedUser } from './auth';

/**
 * Verify that the request comes from an authenticated admin user.
 * Supports both NextAuth (Google) and JWT (email/password) sessions.
 * Returns the user if admin, or null.
 */
export async function requireAdmin(req) {
    const user = await getAuthenticatedUser(req);
    if (!user) return null;
    if (user.role !== 'admin') return null;
    return user;
}
