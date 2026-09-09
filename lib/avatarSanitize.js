// The User schema stores `avatar` as a plain, unbounded String, and the
// profile editor (app/profile/[username]/page.js) uploads images via
// FileReader.readAsDataURL() and saves the resulting base64 data URI directly
// into it — a modest photo can easily be 1-3MB *as text* once base64-encoded.
// Any endpoint that returns a list of users/poems and populates `avatar`
// multiplies that cost by every item in the list, which is what was behind a
// 3.4MB response for a 12-poem feed page even after trimming comments/likes.
//
// The real fix is to stop storing images inline (object storage + a URL), but
// that needs infra/credentials this environment doesn't have. Until then,
// every read path strips base64-encoded avatars before they go out the door —
// the UI already renders an initial-letter avatar whenever `avatar` is unset,
// so this degrades gracefully with zero visual change beyond a missing photo.

export function isBase64Avatar(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

/**
 * Recursively removes any `avatar` field holding a base64 data URI from a
 * plain object/array (i.e. a `.lean()` Mongoose result or aggregation output,
 * not a live Mongoose Document). Mutates and returns `value`.
 */
export function stripBase64Avatars(value) {
  if (Array.isArray(value)) {
    for (const item of value) stripBase64Avatars(item);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key === 'avatar') {
        if (isBase64Avatar(value[key])) delete value[key];
      } else {
        stripBase64Avatars(value[key]);
      }
    }
  }
  return value;
}
