// Keep this in sync with RUNTIME_CACHE in public/sw.js.
const RUNTIME_CACHE_PREFIX = 'poem-studio-runtime';

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

/**
 * Cache Storage is origin-scoped, not per-session, so it must be cleared on
 * logout — otherwise a shared browser could serve one account's cached feed
 * to whoever logs in next.
 */
export async function clearRuntimeCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith(RUNTIME_CACHE_PREFIX)).map((key) => caches.delete(key))
    );
  } catch {
    // best-effort cleanup only
  }
}
