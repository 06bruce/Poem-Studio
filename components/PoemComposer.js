'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FiSave, FiLoader, FiAlertCircle, FiEdit2, FiX, FiSearch, FiFeather } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../contexts/ToastContext'

export default function PoemComposer({ onSave, showAuthForm, setGlobalMood }) {
    const { user } = useAuth()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [formData, setFormData] = useState({ title: '', content: '', theme: 'general', mood: 'neutral', coAuthors: [] })
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    // Sync mood with global app
    useEffect(() => {
        if (formData.mood && typeof setGlobalMood === 'function') {
            setGlobalMood(formData.mood)
        }
    }, [formData.mood, setGlobalMood])

    const handleUserSearch = async (val) => {
        setUserSearch(val)
        if (val.length < 2) {
            setSearchResults([])
            return
        }
        setIsSearching(true)
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(val)}`)
            if (response.ok) {
                const data = await response.json()
                setSearchResults(data.filter(u => u.username !== user?.username && !formData.coAuthors.some(ca => ca._id === u._id)))
            }
        } catch (err) {
            console.error('Search failed:', err)
        } finally {
            setIsSearching(false)
        }
    }

    const addCoAuthor = (u) => {
        setFormData(prev => ({
            ...prev,
            coAuthors: [...prev.coAuthors, u]
        }))
        setUserSearch('')
        setSearchResults([])
    }

    const removeCoAuthor = (userId) => {
        setFormData(prev => ({
            ...prev,
            coAuthors: prev.coAuthors.filter(ca => ca._id !== userId)
        }))
    }

    const handleSave = useCallback(async () => {
        if (!user) {
            showAuthForm()
            return
        }

        if (!formData.title || !formData.content) {
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
                    title: formData.title,
                    content: formData.content,
                    theme: formData.theme || 'general',
                    mood: formData.mood || 'neutral',
                    source: 'user-created',
                    coAuthors: formData.coAuthors.map(ca => ca._id)
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to save poem')
            }

            const savedPoem = await response.json()
            toast.success('Poem published successfully!')
            onSave(savedPoem)

            setFormData({ title: '', content: '', theme: 'general', mood: 'neutral', coAuthors: [] })
        } catch (error) {
            console.error('Save error:', error)
            toast.error(error.message || 'Failed to save poem')
        } finally {
            setSaving(false)
        }
    }, [user, formData, onSave, showAuthForm])

    return (
        <div className="rounded-3xl glass p-6 sm:p-8 mb-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] -z-10"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <FiFeather className="text-blue-400" />
                        Compose
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Let your creativity flow into words</p>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                <div className="group">
                    <label htmlFor="poem-title" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Poem Title</label>
                    <input
                        id="poem-title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter a captivating title..."
                        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 hover:bg-slate-800 placeholder:text-slate-600 text-sm sm:text-base"
                    />
                </div>
                <div className="group">
                    <label htmlFor="poem-content" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Your Verses</label>
                    <textarea
                        id="poem-content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Let your heart flow into words..."
                        rows={6}
                        className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 hover:bg-slate-800 resize-none placeholder:text-slate-600 text-sm sm:text-base"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label htmlFor="poem-theme" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Theme</label>
                        <select
                            id="poem-theme"
                            value={formData.theme}
                            onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 cursor-pointer hover:bg-slate-800 text-sm sm:text-base"
                        >
                            <option value="general">General</option>
                            <option value="nature">Nature</option>
                            <option value="love">Love</option>
                            <option value="life">Life</option>
                            <option value="technology">Technology</option>
                            <option value="spirituality">Spirituality</option>
                            <option value="social">Social Commentary</option>
                            <option value="abstract">Abstract</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="poem-mood" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Atmosphere</label>
                        <select
                            id="poem-mood"
                            value={formData.mood}
                            onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 cursor-pointer hover:bg-slate-800 text-sm sm:text-base"
                        >
                            <option value="neutral">Neutral</option>
                            <option value="happy">Happy</option>
                            <option value="sad">Sad</option>
                            <option value="peaceful">Peaceful</option>
                            <option value="mysterious">Mysterious</option>
                            <option value="passionate">Passionate</option>
                            <option value="melancholy">Melancholy</option>
                        </select>
                    </div>
                </div>

                <div className="group relative">
                    <label htmlFor="coauthor-search" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Collaborative Verses (Tag Co-authors)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {formData.coAuthors.map(ca => (
                            <div key={ca._id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
                                <span>@{ca.username}</span>
                                <button onClick={() => removeCoAuthor(ca._id)} className="hover:text-white transition-colors" aria-label={`Remove co-author ${ca.username}`}>
                                    <FiX size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        <input
                            id="coauthor-search"
                            type="text"
                            value={userSearch}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            placeholder="Search fellow poets to collaborate..."
                            className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pl-10 sm:pl-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 hover:bg-slate-800 placeholder:text-slate-600 text-sm sm:text-base"
                        />
                        <FiSearch className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                        {isSearching && (
                            <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2">
                                <FiLoader className="animate-spin text-blue-400" size={16} />
                            </div>
                        )}
                    </div>

                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 glass rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-fadeIn">
                            {searchResults.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => addCoAuthor(u)}
                                    className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-white/10 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-slate-200">@{u.username}</div>
                                        <div className="text-[10px] text-slate-500 truncate">{u.bio || 'Poetic soul'}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center gap-2 text-red-200 text-sm">
                    <FiAlertCircle size={18} />
                    {error}
                </div>
            )}

            {formData.title && formData.content && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-fadeIn">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-100">{formData.title}</h3>
                    <p className="whitespace-pre-wrap text-slate-400 italic leading-relaxed text-sm sm:text-base">{formData.content}</p>
                </div>
            )}

            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
                <button
                    onClick={handleSave}
                    disabled={saving || !formData.title || !formData.content}
                    className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all duration-300 text-sm font-bold shadow-lg shadow-emerald-900/40 min-h-[44px]"
                >
                    {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                    {saving ? 'Publishing...' : 'Publish Poem'}
                </button>
            </div>
        </div>
    )
}
