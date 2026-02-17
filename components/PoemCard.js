'use client';
import React, { useMemo } from 'react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { FiHeart, FiCopy, FiEdit2, FiTrash2 } from 'react-icons/fi'
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

      <div className="mb-8 relative">
        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed italic text-lg opacity-90 group-hover/card:opacity-100 transition-opacity duration-300">
          {poemContent}
        </p>
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
    </div>
  )
}
