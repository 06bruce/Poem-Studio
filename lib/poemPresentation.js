const MOOD_PALETTES = {
  general: { start: '#1e293b', end: '#0f172a', accent: '#93c5fd', texture: 'radial-gradient(circle at 85% 10%, rgba(148, 163, 184, .18), transparent 34%)' },
  reflective: { start: '#312e81', end: '#111827', accent: '#c4b5fd', texture: 'radial-gradient(circle at 15% 15%, rgba(129, 140, 248, .2), transparent 38%)' },
  heartbreak: { start: '#7f1d1d', end: '#1c1917', accent: '#fca5a5', texture: 'radial-gradient(circle at 80% 12%, rgba(251, 146, 60, .2), transparent 36%)' },
  sad: { start: '#164e63', end: '#0f172a', accent: '#67e8f9', texture: 'radial-gradient(circle at 80% 0%, rgba(34, 211, 238, .18), transparent 36%)' },
  happy: { start: '#713f12', end: '#172554', accent: '#fde68a', texture: 'radial-gradient(circle at 18% 0%, rgba(250, 204, 21, .2), transparent 36%)' },
  peaceful: { start: '#14532d', end: '#172554', accent: '#86efac', texture: 'radial-gradient(circle at 80% 20%, rgba(74, 222, 128, .18), transparent 36%)' },
  mysterious: { start: '#4c1d95', end: '#111827', accent: '#d8b4fe', texture: 'radial-gradient(circle at 20% 0%, rgba(192, 132, 252, .2), transparent 36%)' }
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
