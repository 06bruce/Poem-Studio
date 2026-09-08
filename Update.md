# Performance Update Plan

Goal: fix the biggest performance red flags and add the missing database indexes, without
changing the app's look & feel or feature behavior.

## Client-side red flags

### 1. WeatherEffect canvas — constant full-screen repaint
`components/WeatherEffect.js`

A full-viewport canvas sits at `z-10` with `mix-blend-mode: screen` above all content and
runs `requestAnimationFrame` at ~60fps forever. The browser must recomposite the whole page
on every frame.

Fixes:
- Respect `prefers-reduced-motion` (render one static frame, no animation loop).
- Throttle the animation to ~30fps (skip every other frame) to halve the GPU work.
- Scale particle count down on small screens (24 vs 60).
- Keep the existing tab-visibility pause.

### 2. Animating blurred background blobs
`app/page.js`

Two fixed `blur-[120px]` elements with `animate-pulse` continuously repaint a large blurred
region. Make them static (remove the pulse animation).

### 3. Backdrop blur on the fixed bottom nav
`components/BottomNav.js`

`backdrop-blur-xl` on a fixed full-width bar forces a blur on scroll. Replace with a nearly
opaque solid background.

### 4. Duplicate unread-count polling
`app/page.js` + `components/Header.js`

Both mount a `setInterval(30s)` hitting `/api/users/notifications/unread`. Consolidate: the
page owns the polling + state and passes `unreadCount` to Header as a prop. Preserve the
auto-logout-on-401 behavior.

### 5. Heavy `html2canvas` loaded eagerly
`components/PoemList.js`

Statically imported at bundle parse time but only used when a user clicks "share as image".
Lazy-load it with a dynamic import inside the share handler.

### 6. Undebounced search-as-you-type
`components/PoemCard.js` (share search) + `components/StoriesBar.js` (mention search)

`UserSearch.js` already debounces; these two fire a `/api/users/search` request on every
keystroke. Add a 300ms debounce with an unmount cleanup.

## Server-side red flags

### 7. Unbounded following feed
`app/api/poems/following/route.js`

No `.limit()` — returns every poem from everyone you follow. Add a `limit` (20) plus the
`before` cursor that the explore feed already supports.

## Database indexes

Add via Mongoose `schema.index()` so they are created on connection (autoIndex). Documented
indexes to run against prod with `Model.syncIndexes()`.

- `lib/models/Notification.js`
  - `{ recipient: 1, read: 1 }` — backs the unread-count query on every poll.
  - `{ recipient: 1, createdAt: -1 }` — backs the sorted notification list.
- `lib/models/Story.js`
  - `{ userId: 1, createdAt: -1 }` — backs per-user story grouping (a TTL index already
    exists on `createdAt` via `expires`).
- `lib/models/User.js`
  - `{ following: 1 }`, `{ followers: 1 }` — back "is following?" / follower-list lookups.

## Deliberately out of scope

- Trimming the poem feed payload (full `comments`/`annotations` are returned per poem). This
  is coupled to the current card UI (per-line annotation dots + comment panel) and is not the
  dominant cost yet; revisit if payload size becomes an issue.

## Verification

1. `npm run lint`
2. `npm run build`
3. Manual smoke test: feed scroll, weather toggle, share-as-image, mention search, header +
   bottom-nav notification badge.