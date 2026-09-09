// One mood-to-color source of truth for the whole app (feed cards, read mode,
// profile grid, single-poem page) — warm ink/gold/plum tones instead of the
// generic Tailwind sky-blue/indigo that used to make every mood look like the
// same SaaS gradient regardless of what the poem actually felt like.
const MOOD_PALETTES = {
  general: { start: '#1f1a2e', end: '#0c0e17', accent: '#e3a83f', texture: 'radial-gradient(circle at 85% 10%, rgba(227, 168, 63, .14), transparent 34%)' },
  reflective: { start: '#241f3d', end: '#0c0e17', accent: '#b9a0e6', texture: 'radial-gradient(circle at 15% 15%, rgba(155, 127, 212, .2), transparent 38%)' },
  heartbreak: { start: '#3d1620', end: '#1c1512', accent: '#e8977a', texture: 'radial-gradient(circle at 80% 12%, rgba(232, 151, 122, .2), transparent 36%)' },
  sad: { start: '#132a3d', end: '#0c0e17', accent: '#7fb8d9', texture: 'radial-gradient(circle at 80% 0%, rgba(127, 184, 217, .16), transparent 36%)' },
  happy: { start: '#3d2e0f', end: '#241f3d', accent: '#f2d9a3', texture: 'radial-gradient(circle at 18% 0%, rgba(242, 217, 163, .2), transparent 36%)' },
  peaceful: { start: '#102a1f', end: '#241f3d', accent: '#8fd4ae', texture: 'radial-gradient(circle at 80% 20%, rgba(143, 212, 174, .18), transparent 36%)' },
  mysterious: { start: '#2b1245', end: '#111827', accent: '#c9a8f5', texture: 'radial-gradient(circle at 20% 0%, rgba(201, 168, 245, .2), transparent 36%)' }
}

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getPoemText(poem) {
  return poem.content || (Array.isArray(poem.lines) ? poem.lines.join('\n') : '')
}

export function getPoemPresentation(poem, index = 0) {
  const text = getPoemText(poem)
  const lineCount = text ? text.split('\n').length : 0
  const characterCount = text.length
  const rawMood = poem.mood || poem.theme || 'general'
  const mood = String(rawMood).toLowerCase().replace(/[^a-z]/g, '')
  const palette = MOOD_PALETTES[mood] || MOOD_PALETTES.general
  const authorKey = String(poem.author?.email || poem.author?.username || poem.author?._id || poem.authorName || 'anonymous')
  const authorHash = hashString(authorKey)
  const hue = authorHash % 360
  const secondHue = (hue + 48 + (authorHash % 70)) % 360

  let typography = 'long'
  if (characterCount < 180 && lineCount <= 10) typography = 'short'
  else if (characterCount < 600 && lineCount <= 24) typography = 'medium'

  return {
    mood,
    moodLabel: rawMood,
    palette,
    typography,
    cardVariant: index > 0 && index % 4 === 0 ? 'featured' : index % 2 === 0 ? 'standard' : 'offset',
    authorAura: `linear-gradient(135deg, hsl(${hue} 82% 64%), hsl(${secondHue} 78% 58%))`,
    lineCount,
    background: {
      backgroundImage: `${palette.texture}, linear-gradient(135deg, ${palette.start}, ${palette.end})`
    }
  }
}

export function hashAuthor(value) {
  return hashString(String(value || 'anonymous'))
}
