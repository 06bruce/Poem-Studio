import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Poem from '@/lib/models/Poem';
import Story from '@/lib/models/Story';
import { requireAdmin } from '@/lib/utils/adminAuth';

export async function GET(request) {
    try {
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get date ranges for analytics
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [
            userCount,
            poemCount,
            storyCount,
            usersToday,
            usersThisWeek,
            usersThisMonth,
            usersLastMonth,
            poemsToday,
            poemsThisWeek,
            poemsThisMonth,
            poemsLastMonth,
            recentUsers,
            recentPoems,
            topPoets,
        ] = await Promise.all([
            User.countDocuments(),
            Poem.countDocuments(),
            Story.countDocuments(),
            User.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments({ createdAt: { $gte: thisWeek } }),
            User.countDocuments({ createdAt: { $gte: thisMonth } }),
            User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
            Poem.countDocuments({ createdAt: { $gte: today } }),
            Poem.countDocuments({ createdAt: { $gte: thisWeek } }),
            Poem.countDocuments({ createdAt: { $gte: thisMonth } }),
            Poem.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
            User.find().sort({ createdAt: -1 }).limit(8).select('username email avatar role createdAt totalPoems currentStreak'),
            Poem.find().sort({ createdAt: -1 }).limit(8).populate('author', 'username avatar'),
            User.find().sort({ totalPoems: -1 }).limit(5).select('username avatar totalPoems currentStreak longestStreak followers'),
        ]);

        // Calculate growth percentages
        const userGrowth = usersLastMonth > 0 ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100) : 100;
        const poemGrowth = poemsLastMonth > 0 ? Math.round(((poemsThisMonth - poemsLastMonth) / poemsLastMonth) * 100) : 100;

        return NextResponse.json({
            stats: {
                users: { total: userCount, today: usersToday, week: usersThisWeek, month: usersThisMonth, growth: userGrowth },
                poems: { total: poemCount, today: poemsToday, week: poemsThisWeek, month: poemsThisMonth, growth: poemGrowth },
                stories: { total: storyCount },
            },
            recentUsers,
            recentPoems,
            topPoets,
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
