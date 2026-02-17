import React, { useEffect, useState } from 'react'
import { FiPlus, FiMessageSquare, FiX, FiSend, FiLoader, FiEdit2, FiTrash2, FiEye, FiHeart, FiSearch, FiCheck } from 'react-icons/fi'
import { toast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import clsx from 'clsx'

export default function StoriesBar() {
    const { user } = useAuth()
    const [stories, setStories] = useState([])
    const [showCreate, setShowCreate] = useState(false)
    const [content, setContent] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [selectedStory, setSelectedStory] = useState(null)
    const [colorTheme, setColorTheme] = useState('blue')
    const [mentions, setMentions] = useState([])
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState('')

    const themes = [
        { id: 'blue', label: 'Sapphire', class: 'from-blue-600 to-blue-400' },
        { id: 'purple', label: 'Amethyst', class: 'from-purple-600 to-purple-400' },
        { id: 'emerald', label: 'Jade', class: 'from-emerald-600 to-emerald-400' },
        { id: 'rose', label: 'Ruby', class: 'from-rose-600 to-rose-400' },
        { id: 'amber', label: 'Amber', class: 'from-amber-600 to-amber-400' }
    ]

    useEffect(() => {
        fetchStories()
    }, [])

    const fetchStories = async () => {
        try {
            const response = await fetch('/api/stories')
            if (response.ok) {
                const data = await response.json()
                setStories(data)
            }
        } catch (err) {
            console.error('Failed to fetch stories:', err)
        }
    }

    const handlePost = async () => {
        if (!content.trim()) return
        setIsPosting(true)
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    colorTheme,
                    mentions: mentions.map(m => m._id)
                })
            })

            if (response.ok) {
                toast.success('Your verse is now part of the ripple.')
                setContent('')
                setMentions([])
                setColorTheme('blue')
                setShowCreate(false)
                fetchStories()
            }
        } catch (err) {
            toast.error('Failed to share your story')
        } finally {
            setIsPosting(false)
        }
    }

    const handleViewStory = async (story) => {
        setSelectedStory(story)
        try {
            await fetch(`/api/stories/${story._id}/view`, { method: 'POST' })
            // local update for UI
            setStories(prev => prev.map(s => s._id === story._id ? { ...s, views: (s.views || 0) + 1 } : s))
        } catch (err) {
            console.error('View increment failed', err)
        }
    }

    const handleDeleteStory = async (storyId) => {
        if (!window.confirm('Dissolve this verse back into the void?')) return
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch(`/api/stories?storyId=${storyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                toast.success('The ripple has faded.')
                setSelectedStory(null)
                fetchStories()
            }
        } catch (err) {
            toast.error('Failed to dissolve verse')
        }
    }

    const handleEditStory = async () => {
        if (!editContent.trim()) return
        setIsPosting(true)
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch('/api/stories', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storyId: selectedStory._id,
                    content: editContent
                })
            })
            if (response.ok) {
                toast.success('The verse has shifted.')
                setIsEditing(false)
                fetchStories()
                setSelectedStory(null)
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to shift verse')
            }
        } catch (err) {
            toast.error('Failed to shift verse')
        } finally {
            setIsPosting(false)
        }
    }

    const handleResonance = async (storyId) => {
        if (!user) {
            toast.info('Sign in to resonate with this verse')
            return
        }
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch(`/api/stories/${storyId}/resonance`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setStories(prev => prev.map(s => s._id === storyId ? { ...s, resonanceCount: data.resonanceCount, resonance: data.isResonating ? [...(s.resonance || []), user.id || user._id] : (s.resonance || []).filter(id => id !== (user.id || user._id)) } : s))
                if (selectedStory && selectedStory._id === storyId) {
                    setSelectedStory(prev => ({ ...prev, resonanceCount: data.resonanceCount, resonance: data.isResonating ? [...(prev.resonance || []), user.id || user._id] : (prev.resonance || []).filter(id => id !== (user.id || user._id)) }))
                }
            }
        } catch (err) {
            console.error('Resonance failed', err)
        }
    }

    const searchUsers = async (val) => {
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
                setSearchResults(data.filter(u => u._id !== user?.id && !mentions.find(m => m._id === u._id)))
            }
        } catch (err) {
            console.error('Search failed', err)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="mb-12">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                {/* Add Story Button */}
                {user && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex-shrink-0 flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-[1.5rem] glass border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all duration-300">
                            <FiPlus className="text-slate-400 group-hover:text-blue-400 group-hover:scale-110 transition-all" size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Add Verse</span>
                    </button>
                )}

                {/* Story Items */}
                {stories.map((story) => (
                    <button
                        key={story._id}
                        onClick={() => handleViewStory(story)}
                        className="flex-shrink-0 flex flex-col items-center gap-2 group animate-fadeIn"
                    >
                        <div className={clsx(
                            "w-16 h-16 rounded-[1.5rem] p-0.5 shadow-lg transition-all duration-300 group-hover:scale-105",
                            themes.find(t => t.id === story.colorTheme)?.class || themes[0].class,
                            "shadow-blue-500/20"
                        )}>
                            <div className="w-full h-full rounded-[1.4rem] bg-slate-900 border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                                <span className="text-white font-bold text-lg">{story.username.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-400 transition-colors">@{story.username}</span>
                    </button>
                ))}

                {stories.length === 0 && !user && (
                    <div className="px-4 py-8 text-slate-600 text-xs italic">The air is quiet... be the first to speak.</div>
                )}
            </div>

            {/* Story View Modal */}
            {selectedStory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fadeIn">
                    <button
                        onClick={() => setSelectedStory(null)}
                        className="absolute top-8 right-8 text-white/50 hover:text-white transition-all hover:rotate-90"
                    >
                        <FiX size={32} />
                    </button>

                    <div className="max-w-xl w-full text-center animate-scaleIn">
                        <div className="flex flex-col items-center mb-12">
                            <div className={clsx(
                                "w-16 h-16 rounded-3xl flex items-center justify-center text-white font-black text-2xl mb-4",
                                themes.find(t => t.id === selectedStory.colorTheme)?.class || themes[0].class
                            )}>
                                {selectedStory.username.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="text-xl font-black text-white tracking-widest">@{selectedStory.username}</h3>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Ephemeral Verse</span>
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                    <FiEye size={12} /> {selectedStory.views || 0}
                                </span>
                                <button
                                    onClick={() => handleResonance(selectedStory._id)}
                                    className={clsx(
                                        "text-[10px] font-bold flex items-center gap-1 transition-all hover:scale-110",
                                        selectedStory.resonance?.includes(user?.id || user?._id) ? "text-rose-500" : "text-slate-500 hover:text-rose-400"
                                    )}
                                >
                                    <FiHeart size={12} fill={selectedStory.resonance?.includes(user?.id || user?._id) ? "currentColor" : "none"} />
                                    {selectedStory.resonance?.length || 0}
                                </button>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="mb-8">
                                <textarea
                                    autoFocus
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-2xl md:text-3xl text-center text-slate-100 italic focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                                    rows={4}
                                />
                                <div className="flex justify-center gap-4 mt-4">
                                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white font-bold text-sm">Cancel</button>
                                    <button onClick={handleEditStory} className="text-blue-400 hover:text-blue-300 font-bold text-sm">Shift Verse</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-3xl md:text-5xl font-serif text-slate-100 italic leading-tight mb-8">
                                "{selectedStory.content}"
                            </p>
                        )}

                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {selectedStory.mentions?.map((m, idx) => (
                                <span key={m._id || idx} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                                    @{m.username || m}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-8 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <span>Shared {new Date(selectedStory.createdAt).toLocaleTimeString()}</span>
                            {user && selectedStory.userId?._id === (user.id || user._id) && (
                                <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                                    <button
                                        onClick={() => {
                                            setEditContent(selectedStory.content)
                                            setIsEditing(true)
                                        }}
                                        className="hover:text-blue-400 transition-colors flex items-center gap-1"
                                    >
                                        <FiEdit2 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStory(selectedStory._id)}
                                        className="hover:text-red-400 transition-colors flex items-center gap-1"
                                    >
                                        <FiTrash2 size={14} /> Dissolve
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Story Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="glass rounded-[2.5rem] p-10 w-full max-w-lg border border-white/10 shadow-2xl animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <h4 className="text-2xl font-black text-slate-100 flex items-center gap-3 tracking-tight">
                                <FiMessageSquare className="text-blue-400" />
                                Share a Verse
                            </h4>
                            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>

                        <textarea
                            autoFocus
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's whispering in your mind right now?"
                            maxLength={200}
                            rows={4}
                            className={clsx(
                                "w-full bg-slate-900/50 border border-white/10 rounded-[1.5rem] p-6 text-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-4 transition-all resize-none mb-6 italic shadow-inner",
                                themes.find(t => t.id === colorTheme)?.class.split(' ')[0].replace('from-', 'ring-') + '/20'
                            )}
                        />

                        {/* Theme Picker */}
                        <div className="flex items-center gap-3 mb-8 px-2 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-shrink-0">Aura</span>
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setColorTheme(t.id)}
                                    className={clsx(
                                        "w-8 h-8 rounded-full bg-gradient-to-tr transition-all duration-300 flex items-center justify-center border-2",
                                        t.class,
                                        colorTheme === t.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    title={t.label}
                                >
                                    {colorTheme === t.id && <FiCheck className="text-white" size={14} />}
                                </button>
                            ))}
                        </div>

                        {/* Mention Search */}
                        <div className="relative mb-8">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Resonance (@Mention)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {mentions.map(m => (
                                    <div key={m._id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                                        <span>@{m.username}</span>
                                        <button onClick={() => setMentions(prev => prev.filter(cur => cur._id !== m._id))} className="hover:text-white">
                                            <FiX size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="relative">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    placeholder="Seek fellow poets..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                {isSearching && <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" size={14} />}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                                    {searchResults.map(u => (
                                        <button
                                            key={u._id}
                                            onClick={() => {
                                                setMentions(prev => [...prev, u])
                                                setUserSearch('')
                                                setSearchResults([])
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-xs font-bold text-slate-200">@{u.username}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                            <span className={clsx(
                                "text-[10px] font-bold tracking-widest uppercase transition-colors",
                                content.length > 180 ? "text-red-400" : "text-slate-500"
                            )}>
                                {content.length}/200
                            </span>
                            <button
                                disabled={!content.trim() || isPosting}
                                onClick={handlePost}
                                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-blue-900/40"
                            >
                                {isPosting ? <FiLoader className="animate-spin" /> : <FiSend />}
                                Let it ripple
                            </button>
                        </div>
                        <p className="mt-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center">
                            This verse will disappear after 24 hours
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
