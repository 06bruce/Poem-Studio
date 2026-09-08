import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';
import { subscribe } from '@/lib/notificationBus';

// Long-lived streaming response — never statically optimized/cached.
export const dynamic = 'force-dynamic';

async function resolveUserId(request) {
  // EventSource can't send an Authorization header, so JWT (email/password)
  // clients pass their token as a query param instead. Google/NextAuth clients
  // are authenticated via the session cookie the browser already sends.
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  if (queryToken) {
    const decoded = verifyToken(queryToken);
    if (decoded?.userId) return decoded.userId;
  }

  const session = await auth();
  if (session?.user?.email) {
    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('_id');
    if (user) return user._id.toString();
  }

  return null;
}

export async function GET(request) {
  const userId = await resolveUserId(request);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let heartbeat;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // controller already closed; nothing to do
        }
      };

      send({ type: 'connected' });
      unsubscribe = subscribe(userId, send);

      // Keep the connection alive through idle proxies/load balancers.
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
