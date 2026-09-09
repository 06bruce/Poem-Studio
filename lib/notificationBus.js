import { EventEmitter } from 'events';

// In-process pub/sub that lets the notifications SSE route (app/api/notifications/stream)
// push events to open connections the instant a Notification document is created.
// This only fans out within a single Node process — a horizontally-scaled deployment
// would need a shared broker (e.g. Redis pub/sub) instead, which is a bigger
// infrastructure change and intentionally out of scope here. The SSE route/client
// fall back to polling if a push is ever missed, so this is a pure latency win,
// never a correctness dependency.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function publish(userId, event) {
  emitter.emit(String(userId), event);
}

export function subscribe(userId, onEvent) {
  const key = String(userId);
  const handler = (event) => onEvent(event);
  emitter.on(key, handler);
  return () => emitter.off(key, handler);
}
