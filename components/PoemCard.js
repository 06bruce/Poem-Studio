'use client';
import React, { useMemo } from 'react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { FiHeart, FiCopy, FiEdit2, FiTrash2, FiBookmark, FiPlus, FiMessageSquare, FiSend, FiX } from 'react-icons/fi'
import { toast } from '../contexts/ToastContext'

function hashStringToNum(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function randomDimColor(seed) {
  const n = typeof seed === 'number' ? seed : hashStringToNum(String(seed))
  const h = Math.floor((n * 137.5) % 360)
  const s = 22 + Math.floor(((n * 53) % 28))
  const l = 8 + Math.floor(((n * 97) % 14))
  return `hsl(${h} ${s}% ${l}%)`
}

function formatDate(date) {
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

function isEditableWindow(createdAt) {
  const now = new Date()
  const created = new Date(createdAt)
  const diffInMinutes = (now - created) / (1000 * 60)
  return diffInMinutes <= 10
}

const moodThemes = {
  happy: { bg: null, color: '#fbbf24' },
  sad: { bg: null, color: '#60a5fa' },
  peaceful: { bg: null, color: '#86efac' },
  mysterious: { bg: null, color: '#c084fc' },
  neutral: { bg: null, color: '#9ca3af' }
}

export default function PoemCard({
  poem,
  extraActions,
  onEdit,
  onDelete,
  currentUserId,
  isReadOnly = false,
  onLike,
  onUnlike,
  currentUserLiked = false,
  isNew = false
}) {
  const router = useRouter()
  const [showSaveModal, setShowSaveModal] = React.useState(false)
  const [collections, setCollections] = React.useState([])
  const [saving, setSaving] = React.useState(false)
  const [selectedLine, setSelectedLine] = React.useState(null)
  const [annotationText, setAnnotationText] = React.useState('')
  const [isAnnotating, setIsAnnotating] = React.useState(false)
  const moodTheme = moodThemes[poem.mood] || moodThemes.neutral

  const bg = useMemo(() => {
    if (moodTheme.bg) {
      return {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url(${moodTheme.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    }
    return { background: `linear-gradient(135deg, ${randomDimColor(poem._id || poem.id)}, rgba(15, 23, 42, 0.9))` }
  }, [poem._id, poem.id, moodTheme.bg])

  const isAuthor = currentUserId && poem.author && (
    currentUserId === poem.author._id || currentUserId === poem.author
  )
  const canEdit = isAuthor && isEditableWindow(poem.createdAt) && !isReadOnly

  const poemContent = poem.content || (Array.isArray(poem.lines) ? poem.lines.join('\n') : '')
  const authorName = poem.authorName || poem.author?.username || 'Anonymous'
  const likeCount = poem.likes?.length || 0

  const handleCopy = async () => {
    const text = `${poem.title}\n\n${poemContent}\n\n- ${authorName}`
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      toast.success('Poem copied to clipboard!')
    }
  }

  const handleLike = () => {
    if (currentUserLiked) {
      onUnlike?.(poem._id)
    } else {
      onLike?.(poem._id)
    }
  }

  const handleEdit = () => {
    onEdit?.(poem)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this poem?')) {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/poems/${poem._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete poem')
        }

        toast.success('Poem deleted successfully!')
        onDelete?.(poem._id)
      } catch (error) {
        console.error('Delete error:', error)
        toast.error(error.message || 'Failed to delete poem')
      }
    }
  }

  const handleAuthorClick = () => {
    if (authorName !== 'Anonymous') {
      router.push(`/profile/${authorName}`)
    }
  }

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users/collections', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err)
    }
  }

  const handleSaveToCollection = async (collectionName) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/poems/${poem._id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collectionName })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message)
        setShowSaveModal(false)
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to save poem')
      }
    } catch (err) {
      toast.error('Failed to save poem')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenSaveModal = () => {
    if (!currentUserId) {
      toast.info('Sign in to save poems to your bookshelf')
      return
    }
    fetchCollections()
    setShowSaveModal(true)
  }

  return (
    <div className={clsx(
      'rounded-3xl glass p-8 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-black group/card relative overflow-hidden',
      isNew && 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20'
    )} style={bg}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2 text-slate-100 group-hover/card:text-blue-400 transition-colors duration-300">{poem.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-1.5 px-2 py-1 glass-pill bg-white/5">
              <span>by</span>
              <button
                onClick={handleAuthorClick}
                className="text-slate-200 hover:text-blue-400 transition-colors font-bold"
              >
                @{authorName}
              </button>
              {poem.coAuthors && poem.coAuthors.length > 0 && (
                <>
                  <span className="text-slate-500 mx-0.5">&</span>
                  <div className="flex gap-1.5">
                    {poem.coAuthors.map((ca, idx) => (
                      <React.Fragment key={ca._id || idx}>
                        <button
                          onClick={() => router.push(`/profile/${ca.username || ca}`)}
                          className="text-slate-200 hover:text-blue-400 transition-colors font-bold"
                        >
                          @{ca.username || ca}
                        </button>
                        {idx < poem.coAuthors.length - 1 && <span className="text-slate-500">,</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="opacity-30">•</span>
            <span className="bg-white/5 px-2 py-1 rounded-full">{formatDate(poem.createdAt)}</span>
            {poem.updatedAt && poem.updatedAt !== poem.createdAt && (
              <span className="text-slate-500 italic">edited</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-2.5 h-2.5 rounded-full ring-4 ring-white/5 shadow-lg animate-pulse"
            style={{ backgroundColor: moodTheme.color, boxShadow: `0 0 10px ${moodTheme.color}50` }}
            title={`Atmosphere: ${poem.mood || 'neutral'}`}
          />
        </div>
      </div>

      <div className="mb-8 relative space-y-1">
        {poemContent.split('\n').map((line, idx) => {
          const lineAnnotations = poem.annotations?.filter(a => a.lineIndex === idx) || []
          return (
            <div key={idx} className="group/line relative flex items-center gap-4">
              <button
                onClick={() => setSelectedLine(selectedLine === idx ? null : idx)}
                className={clsx(
                  'flex-1 text-left px-3 py-1.5 rounded-lg transition-all duration-300 text-slate-300 italic text-lg opacity-90 hover:bg-white/5 hover:opacity-100',
                  selectedLine === idx && 'bg-blue-500/10 text-blue-300 opacity-100 ring-1 ring-blue-500/20'
                )}
              >
                {line || '\u00A0'}
              </button>

              {lineAnnotations.length > 0 && (
                <div className="flex -space-x-2">
                  {lineAnnotations.slice(0, 3).map((a, ai) => (
                    <div
                      key={a._id || ai}
                      className="w-6 h-6 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-lg"
                      title={`${a.username}: ${a.content}`}
                    >
                      {a.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {lineAnnotations.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">
                      +{lineAnnotations.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {selectedLine !== null && (
          <div className="mt-6 p-6 rounded-2xl glass border border-blue-500/20 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <FiMessageSquare />
                Thoughts on Line {selectedLine + 1}
              </h5>
              <button onClick={() => setSelectedLine(null)} className="text-slate-500 hover:text-slate-300">
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-4 mb-6 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {(poem.annotations?.filter(a => a.lineIndex === selectedLine) || []).map((a, ai) => (
                <div key={a._id || ai} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-400">@{a.username}</span>
                    <span className="text-[9px] text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{a.content}</p>
                </div>
              ))}
              {(poem.annotations?.filter(a => a.lineIndex === selectedLine) || []).length === 0 && (
                <p className="text-center py-4 text-slate-500 text-sm italic">Be the first to share a thought on this line...</p>
              )}
            </div>

            {currentUserId && (
              <div className="relative">
                <textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Share your resonance..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none min-h-[80px]"
                />
                <button
                  disabled={!annotationText.trim() || isAnnotating}
                  onClick={async () => {
                    setIsAnnotating(true)
                    try {
                      const token = localStorage.getItem('authToken')
                      const response = await fetch(`/api/poems/${poem._id}/annotate`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ lineIndex: selectedLine, content: annotationText })
                      })
                      if (response.ok) {
                        const newAnn = await response.json()
                        // Update local poem state if possible, or just toast and reset
                        toast.success('Your thought has been preserved.')
                        setAnnotationText('')
                        // Note: Real state update would require a callback to parent
                      }
                    } catch (err) {
                      toast.error('Failed to preserve thought')
                    } finally {
                      setIsAnnotating(false)
                    }
                  }}
                  className="absolute bottom-3 right-3 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-50 disabled:bg-slate-700"
                >
                  <FiSend size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {poem.theme && (
        <div className="mb-6">
          <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {poem.theme}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-xs font-bold active:scale-90',
              currentUserLiked
                ? 'bg-red-500 text-white shadow-lg shadow-red-900/40'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            )}
          >
            <FiHeart className={clsx(currentUserLiked && 'fill-current')} />
            <span>Admire {likeCount > 0 && likeCount}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-300 text-xs font-bold active:scale-90"
          >
            <FiCopy />
            <span>Copy</span>
          </button>

          <button
            onClick={handleOpenSaveModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-300 text-xs font-bold active:scale-90"
            title="Add to Bookshelf"
          >
            <FiBookmark />
            <span>Shelf</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {extraActions}

          {canEdit && (
            <button
              onClick={handleEdit}
              className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
              title="Edit poem"
            >
              <FiEdit2 size={16} />
            </button>
          )}

          {isAuthor && !isReadOnly && (
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
              title="Delete poem"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="glass rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl animate-scaleIn">
            <h4 className="text-xl font-bold mb-6 text-slate-100 flex items-center gap-2">
              <FiBookmark className="text-blue-400" />
              Your Bookshelf
            </h4>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {collections.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm mb-4">No collections yet</p>
                </div>
              ) : (
                collections.map(c => (
                  <button
                    key={c.name}
                    onClick={() => handleSaveToCollection(c.name)}
                    disabled={saving}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 transition-all group/shelf"
                  >
                    <span className="text-slate-200 font-medium group-hover/shelf:text-blue-400">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.poems.length} poems</span>
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const name = window.prompt('Collection name:')
                  if (name) {
                    fetch('/api/users/collections', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ name })
                    }).then(res => res.ok && fetchCollections())
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all font-bold text-sm"
              >
                <FiPlus />
                Create Collection
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-full py-3 text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
