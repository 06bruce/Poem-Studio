// Tiny module-scoped TTL cache for hot, cursor-less server queries (e.g. the
// first page of the explore feed). Deliberately not Redis: this app has no
// guaranteed external cache infra to depend on, and a per-instance in-memory
// cache with a short TTL already removes most of the repeat-DB-hit cost for a
// single Node process, degrading to "just re-fetch" on restart with no setup.
const store = new Map();

export function getCached(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() >= hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function setCached(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateCached(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
