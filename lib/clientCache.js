// Tiny in-memory cache with stale-while-revalidate for GET data.
const store = new Map();
const inFlight = new Map();

/**
 * Returns cached data for `key`, fetching on miss and revalidating stale entries
 * in the background without blocking the UI.
 *
 * @param {string} key - unique cache key for this request
 * @param {() => Promise<any>} fetcher - returns the fresh JSON payload
 * @param {number} [ttl=30000] - time-to-live in milliseconds
 * @returns {Promise<{data: any, fresh: boolean}>}
 */
export async function cachedFetch(key, fetcher, ttl = 30000) {
  const now = Date.now();
  const hit = store.get(key);

  const refresh = () => {
    const pending = inFlight.get(key);
    if (pending) return pending;

    const request = Promise.resolve()
      .then(fetcher)
      .then((value) => {
        store.set(key, { value, expiresAt: Date.now() + ttl });
        return value;
      })
      .finally(() => inFlight.delete(key));

    inFlight.set(key, request);
    return request;
  };

  // Fresh hit: return data from memory, no network.
  if (hit && now < hit.expiresAt) {
    return { data: hit.value, fresh: true };
  }

  // Stale hit: return what we have immediately, refresh in the background.
  if (hit) {
    refresh().catch(() => {});
    return { data: hit.value, fresh: false };
  }

  // Miss: fetch, store, return.
  const value = await refresh();
  return { data: value, fresh: true };
}

/**
 * Drops every cache entry whose key starts with `prefix`.
 * Use after mutations (create/edit/delete) so stale data can't linger.
 * @param {string} prefix
 */
export function invalidateCache(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clearCache() {
  store.clear();
}