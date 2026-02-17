'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FiPlay, FiSave, FiHeart, FiCopy, FiLoader, FiAlertCircle, FiEdit2 } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../contexts/ToastContext'
import PoemCard from './PoemCard'

// Local poem generator fallback
const generatePoem = (category) => {
  const poems = {
    underrated: [
      {
        title: "Digital Dawn",
        content: "In circuits deep where data flows,\nA new reality grows.\nBytes and bits in harmony,\nCreate what eyes can see.",
        mood: "neutral",
        theme: "technology"
      },
      {
        title: "Silent Code",
        content: "Lines of logic, clean and pure,\nProblems solved, solutions sure.\nIn the quiet of the night,\nProgrammers bring ideas to light.",
        mood: "calm",
        theme: "programming"
      }
    ],
    nature: [
      {
        title: "Forest Whispers",
        content: "Leaves dance in gentle breeze,\nNature's symphony among trees.\nSunlight filters through the green,\nPeaceful and serene.",
        mood: "peaceful",
        theme: "nature"
      }
    ]
  }

  const categoryPoems = poems[category] || poems.underrated
  return categoryPoems[Math.floor(Math.random() * categoryPoems.length)]
}

// Fetch poem from external API
const fetchPoem = async () => {
  try {
    const response = await fetch('https://poetrydb.org/title/Ozymandias/lines,author')
    if (response.ok) {
      const data = await response.json()
      if (data && data.length > 0) {
        const poem = data[0]
        return {
          title: poem.title,
          content: Array.isArray(poem.lines) ? poem.lines.join('\n') : poem.lines,
          author: poem.author,
          mood: 'neutral',
          theme: 'classic'
        }
      }
    }
  } catch (error) {
    console.warn('External API failed:', error)
  }
  return null
}

export default function PoemGenerator({ onSave, showAuthForm, setGlobalMood }) {
  const { user } = useAuth()
  const [mode, setMode] = useState('generate') // 'generate' or 'create'
  const [category, setCategory] = useState('underrated')
  const [current, setCurrent] = useState(null)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '', theme: 'general', mood: 'neutral' })
  const mountedRef = useRef(false)

  const getPoem = useCallback(async (cat) => {
    setLoading(true)
    setError(null)
    try {
      const poem = await fetchPoem()
      if (poem) {
        setCurrent(poem)
      } else {
        setCurrent(generatePoem(cat))
      }
    } catch (err) {
      console.warn('API failed, falling back to local', err)
      setCurrent(generatePoem(cat))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!mountedRef.current) {
      getPoem(category)
      mountedRef.current = true
    }
  }, [])

  const handleGenerate = useCallback(() => {
    setLiked(false)
    getPoem(category)
  }, [category, getPoem])

  // Sync mood with global app
  useEffect(() => {
    const activeMood = mode === 'create' ? formData.mood : current?.mood;
    if (activeMood && typeof setGlobalMood === 'function') {
      setGlobalMood(activeMood)
    }
  }, [mode, formData.mood, current?.mood, setGlobalMood])

  const handleSave = useCallback(async () => {
    if (!user) {
      showAuthForm()
      return
    }

    const poemData = mode === 'create' ? formData : current
    if (!poemData?.title || !poemData?.content) {
      toast.error('Please provide both title and content')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/poems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: poemData.title,
          content: poemData.content,
          theme: poemData.theme || 'general',
          mood: poemData.mood || 'neutral',
          source: mode === 'create' ? 'user-created' : 'generated'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save poem')
      }

      const savedPoem = await response.json()
      toast.success('Poem saved successfully!')
      onSave(savedPoem)

      if (mode === 'create') {
        setFormData({ title: '', content: '', theme: 'general', mood: 'neutral' })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save poem')
    } finally {
      setSaving(false)
    }
  }, [user, mode, current, formData, onSave, showAuthForm])

  const handleCopy = useCallback(() => {
    const text = current ? `${current.title}\n\n${current.content}` : ''
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast.success('Poem copied to clipboard!')
    }
  }, [current])

  const handleLike = useCallback(() => {
    setLiked(!liked)
    toast.success(liked ? 'Removed from favorites' : 'Added to favorites!')
  }, [liked])

  return (
    <div className="rounded-3xl glass p-8 mb-10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] -z-10"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FiEdit2 className="text-blue-400" />
            Poem Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1">Harness the power of AI or your own creativity</p>
        </div>
        <div className="flex p-1 glass-pill self-start md:self-auto">
          <button
            onClick={() => setMode('generate')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'generate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Generate
          </button>
          <button
            onClick={() => setMode('create')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${mode === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Create
          </button>
        </div>
      </div>

      {mode === 'generate' && (
        <div className="mb-8 group">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Choose a Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 cursor-pointer hover:bg-slate-800"
          >
            <option value="underrated">Underrated Gems</option>
            <option value="nature">Nature</option>
            <option value="love">Love & Romance</option>
            <option value="life">Life & Philosophy</option>
          </select>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-6 mb-8">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Poem Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a captivating title..."
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 hover:bg-slate-800 placeholder:text-slate-600"
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Your Verses</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Let your heart flow into words..."
              rows={8}
              className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 hover:bg-slate-800 resize-none placeholder:text-slate-600"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 cursor-pointer hover:bg-slate-800"
              >
                <option value="general">General</option>
                <option value="nature">Nature</option>
                <option value="love">Love</option>
                <option value="life">Life</option>
                <option value="technology">Technology</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Atmosphere</label>
              <select
                value={formData.mood}
                onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 cursor-pointer hover:bg-slate-800"
              >
                <option value="neutral">Neutral</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="peaceful">Peaceful</option>
                <option value="mysterious">Mysterious</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center gap-2 text-red-200">
          <FiAlertCircle size={18} />
          {error}
        </div>
      )}

      {mode === 'generate' && current && (
        <PoemCard poem={current} />
      )}

      {mode === 'create' && formData.title && formData.content && (
        <div className="mb-8 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-fadeIn">
          <h3 className="text-xl font-bold mb-3 text-slate-100">{formData.title}</h3>
          <p className="whitespace-pre-wrap text-slate-400 italic leading-relaxed">{formData.content}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-4">
        {mode === 'generate' && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 transition-all duration-300 text-sm font-bold shadow-lg shadow-blue-900/40"
          >
            {loading ? <FiLoader className="animate-spin" /> : <FiPlay className="fill-current" />}
            {loading ? 'Manifesting...' : 'Generate New'}
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || (mode === 'generate' && !current) || (mode === 'create' && (!formData.title || !formData.content))}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all duration-300 text-sm font-bold shadow-lg shadow-emerald-900/40"
        >
          {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
          {saving ? 'Preserving...' : 'Save Poem'}
        </button>

        {mode === 'generate' && current && (
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl glass hover:bg-slate-700/50 transition-all duration-300 text-sm font-semibold"
            >
              <FiCopy />
              Copy
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold ${liked ? 'bg-red-500 text-white shadow-lg shadow-red-900/40' : 'glass hover:bg-slate-700/50'}`}
            >
              <FiHeart className={liked ? 'fill-current' : ''} />
              {liked ? 'Admired' : 'Admire'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
