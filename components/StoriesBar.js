'use client';
import React, { useEffect, useState } from 'react'
import { FiPlus, FiMessageSquare, FiX, FiSend, FiLoader, FiEdit2, FiTrash2, FiEye, FiHeart, FiSearch, FiCheck, FiStar, FiUsers } from 'react-icons/fi'
import { toast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import Portal from './Portal'
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
    const [visibility, setVisibility] = useState('public') // 'public' or 'close_friends'
    const [closeFriends, setCloseFriends] = useState([])
    const [showCloseFriendsModal, setShowCloseFriendsModal] = useState(false)
    const [isLoadingCloseFriends, setIsLoadingCloseFriends] = useState(false)
    const [activeStoryIndex, setActiveStoryIndex] = useState(0)
    const [seenStories, setSeenStories] = useState(new Set()) // Track seen story IDs locally for session

    const themes = [
        { id: 'blue', label: 'Sapphire', class: 'from-blue-600 to-blue-400' },
        { id: 'purple', label: 'Amethyst', class: 'from-purple-600 to-purple-400' },
        { id: 'emerald', label: 'Jade', class: 'from-emerald-600 to-emerald-400' },
        { id: 'rose', label: 'Ruby', class: 'from-rose-600 to-rose-400' },
        { id: 'amber', label: 'Amber', class: 'from-amber-600 to-amber-400' }
    ]

    useEffect(() => {
        fetchStories()
        if (user) fetchCloseFriends()
    }, [user])

    const fetchCloseFriends = async () => {
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch('/api/users/close-friends', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setCloseFriends(data)
            }
        } catch (err) {
            console.error('Failed to fetch close friends:', err)
        }
    }

    const toggleCloseFriend = async (friendId) => {
        const isCurrentlyFriend = closeFriends.some(f => f._id === friendId)
        try {
            const token = localStorage.getItem('authToken')
            const response = await fetch(isCurrentlyFriend ? `/api/users/close-friends?friendId=${friendId}` : '/api/users/close-friends', {
                method: isCurrentlyFriend ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: isCurrentlyFriend ? null : JSON.stringify({ friendId })
            })
            if (response.ok) {
                fetchCloseFriends()
                toast.success(isCurrentlyFriend ? 'Removed from close friends' : 'Added to close friends')
            }
        } catch (err) {
            toast.error('Failed to update close friends')
        }
    }

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
                    mentions: mentions.map(m => m._id),
                    visibility
                })
            })

            if (response.ok) {
                toast.success('Your verse is now part of the ripple.')
                setContent('')
                setMentions([])
                setColorTheme('blue')
                setShowCreate(false)
                setVisibility('public')
                fetchStories()
            }
        } catch (err) {
            toast.error('Failed to share your story')
        } finally {
            setIsPosting(false)
        }
    }

    const handleViewStory = async (storyGroup) => {
        const firstUnseenIndex = storyGroup.stories.findIndex(s => !seenStories.has(s._id))
        const startIndex = firstUnseenIndex !== -1 ? firstUnseenIndex : 0

        setSelectedStory(storyGroup)
        setActiveStoryIndex(startIndex)

        const story = storyGroup.stories[startIndex]
        try {
            await fetch(`/api/stories/${story._id}/view`, { method: 'POST' })
            setSeenStories(prev => new Set([...prev, story._id]))
            // local update for UI
            setStories(prev => prev.map(s => s._id === story._id ? { ...s, views: (s.views || 0) + 1 } : s))
        } catch (err) {
            console.error('View increment failed', err)
        }
    }

    const nextStory = () => {
        if (!selectedStory) return
        if (activeStoryIndex < selectedStory.stories.length - 1) {
            const nextIdx = activeStoryIndex + 1
            setActiveStoryIndex(nextIdx)
            const story = selectedStory.stories[nextIdx]
            if (!seenStories.has(story._id)) {
                setSeenStories(prev => new Set([...prev, story._id]))
                fetch(`/api/stories/${story._id}/view`, { method: 'POST' }).catch(() => { })
            }
        } else {
            setSelectedStory(null)
        }
    }

    const prevStory = () => {
        if (!selectedStory) return
        if (activeStoryIndex > 0) {
            setActiveStoryIndex(activeStoryIndex - 1)
        }
    }

    useEffect(() => {
        let timer
        if (selectedStory && !isEditing) {
            timer = setTimeout(nextStory, 5000)
        }
        return () => clearTimeout(timer)
    }, [selectedStory, activeStoryIndex, isEditing])

    const groupedStories = React.useMemo(() => {
        const groups = {}
        stories.forEach(s => {
            const userId = s.userId?._id || s.userId
            if (!groups[userId]) {
                groups[userId] = {
                    userId,
                    username: s.username,
                    avatar: s.userId?.avatar,
                    stories: [],
                    hasCloseFriends: false,
                    allSeen: true
                }
            }
            groups[userId].stories.push(s)
            if (s.visibility === 'close_friends') groups[userId].hasCloseFriends = true
            if (!seenStories.has(s._id)) groups[userId].allSeen = false
        })
        return Object.values(groups).sort((a, b) => {
            // Sort so accounts with new (unseen) stories come first
            if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1
            return new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt)
        })
    }, [stories, seenStories])

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
        <div className="mb-12 mt-4 px-4 sm:px-0">
            <div className="flex items-center gap-6 overflow-x-auto pb-6 no-scrollbar scroll-smooth">
                {/* Add Story Button */}
                {user && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex-shrink-0 flex flex-col items-center gap-3 group"
                    >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] glass border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] transition-all duration-500 relative group">
                            <FiPlus className="text-slate-400 group-hover:text-blue-400 group-hover:scale-125 transition-all duration-500" size={28} />
                            <div className="absolute inset-0 rounded-[2rem] bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-blue-400 transition-colors duration-500">Add Verse</span>
                    </button>
                )}

                {/* Story Items */}
                {groupedStories.map((group) => (
                    <button
                        key={group.userId}
                        onClick={() => handleViewStory(group)}
                        className="flex-shrink-0 flex flex-col items-center gap-3 group animate-fadeIn"
                    >
                        <div className={clsx(
                            "w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] p-0.5 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 relative",
                            group.allSeen ? "bg-slate-800 border border-white/5" : (group.hasCloseFriends ? "bg-emerald-500" : (themes.find(t => t.id === group.stories[0].colorTheme)?.class || themes[0].class)),
                            !group.allSeen && "group-hover:shadow-[0_0_35px_-10px_rgba(59,130,246,0.5)]"
                        )}>
                            <div className="w-full h-full rounded-[1.9rem] bg-slate-900 border-2 border-slate-900/50 flex items-center justify-center overflow-hidden relative">
                                {group.avatar ? (
                                    <img src={group.avatar} alt={group.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-black text-xl sm:text-2xl tracking-tighter drop-shadow-lg">{group.username.charAt(0).toUpperCase()}</span>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-60"></div>
                            </div>
                            {group.hasCloseFriends && !group.allSeen && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center text-white shadow-lg">
                                    <FiStar size={10} fill="currentColor" />
                                </div>
                            )}
                        </div>
                        <span className={clsx(
                            "text-[10px] font-black transition-colors duration-500 truncate max-w-[80px]",
                            group.allSeen ? "text-slate-600" : "text-slate-400 group-hover:text-white"
                        )}>@{group.username}</span>
                    </button>
                ))}

                {stories.length === 0 && !user && (
                    <div className="px-4 py-8 text-slate-600 text-xs italic">The air is quiet... be the first to speak.</div>
                )}
            </div>

            {/* Story View Modal */}
            {selectedStory && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 bg-black animate-fadeIn overflow-hidden">
                        {/* Progress Bars */}
                        <div className="absolute top-4 left-4 right-4 z-[120] flex gap-1.5 h-1">
                            {selectedStory.stories.map((_, idx) => (
                                <div key={idx} className="flex-1 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className={clsx(
                                            "h-full bg-white transition-all duration-300",
                                            idx < activeStoryIndex ? "w-full" : (idx === activeStoryIndex ? "animate-storyProgress" : "w-0")
                                        )}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Navigation Areas */}
                        <div className="absolute inset-0 z-[115] flex">
                            <div className="w-1/3 h-full cursor-w-resize" onClick={prevStory} />
                            <div className="w-1/3 h-full" onClick={() => { }} /> {/* Content area - No nav */}
                            <div className="w-1/3 h-full cursor-e-resize" onClick={nextStory} />
                        </div>

                        <button
                            onClick={() => setSelectedStory(null)}
                            className="fixed top-8 right-8 text-white/50 hover:text-white transition-all hover:rotate-90 z-[130]"
                        >
                            <FiX size={32} />
                        </button>

                        <div className="max-w-xl w-full text-center animate-scaleIn py-12 px-6 relative z-[110]">
                            {(() => {
                                const currentStory = selectedStory.stories[activeStoryIndex]
                                return (
                                    <>
                                        <div className="flex flex-col items-center mb-12">
                                            <div className={clsx(
                                                "w-16 h-16 rounded-3xl flex items-center justify-center text-white font-black text-2xl mb-4 shadow-2xl",
                                                themes.find(t => t.id === currentStory.colorTheme)?.class || themes[0].class
                                            )}>
                                                {selectedStory.avatar ? <img src={selectedStory.avatar} className="w-full h-full object-cover rounded-3xl" /> : selectedStory.username.charAt(0).toUpperCase()}
                                            </div>
                                            <h3 className="text-xl font-black text-white tracking-widest shadow-black drop-shadow-lg font-cosmic">@{selectedStory.username}</h3>
                                            <div className="flex items-center justify-center gap-4 mt-2 font-space">
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">Ephemeral Verse {activeStoryIndex + 1}/{selectedStory.stories.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <FiEye size={12} /> {currentStory.views || 0}
                                                </span>
                                                <button
                                                    onClick={() => handleResonance(currentStory._id)}
                                                    className={clsx(
                                                        "text-[10px] font-bold flex items-center gap-1 transition-all hover:scale-110",
                                                        currentStory.resonance?.includes(user?.id || user?._id) ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
                                                    )}
                                                >
                                                    <FiHeart size={12} fill={currentStory.resonance?.includes(user?.id || user?._id) ? "currentColor" : "none"} />
                                                    {currentStory.resonance?.length || 0}
                                                </button>
                                                {currentStory.visibility === 'close_friends' && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                                        <FiStar size={10} fill="currentColor" /> Close Friends
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <div className="mb-8 relative z-[130]">
                                                <textarea
                                                    autoFocus
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-xl md:text-2xl text-center text-slate-100 italic focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-2xl font-space"
                                                    rows={4}
                                                />
                                                <div className="flex justify-center gap-4 mt-4 font-space">
                                                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-xl">Cancel</button>
                                                    <button onClick={handleEditStory} className="text-blue-400 hover:text-blue-300 font-bold text-sm bg-black/40 px-4 py-2 rounded-xl">Shift Verse</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-2xl md:text-4xl font-space text-slate-100 italic leading-snug mb-12 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                                "{currentStory.content}"
                                            </p>
                                        )}

                                        <div className="flex flex-wrap justify-center gap-2 mb-12">
                                            {currentStory.mentions?.map((m, idx) => (
                                                <span key={m._id || idx} className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-lg">
                                                    @{m.username || m}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-center gap-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                            <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md tracking-widest">Shared {new Date(currentStory.createdAt).toLocaleTimeString()}</span>
                                            {user && (currentStory.userId?._id === (user.id || user._id) || currentStory.userId === (user.id || user._id)) && (
                                                <div className="flex items-center gap-4 bg-black/40 px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                                                    <button
                                                        onClick={() => {
                                                            setEditContent(currentStory.content)
                                                            setIsEditing(true)
                                                        }}
                                                        className="hover:text-blue-400 transition-colors flex items-center gap-1"
                                                    >
                                                        <FiEdit2 size={12} /> Edit
                                                    </button>
                                                    <div className="w-px h-3 bg-white/10" />
                                                    <button
                                                        onClick={() => handleDeleteStory(currentStory._id)}
                                                        className="hover:text-red-400 transition-colors flex items-center gap-1"
                                                    >
                                                        <FiTrash2 size={12} /> Dissolve
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                </Portal>
            )}

            {/* Create Story Modal */}
            {showCreate && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
                        <div className="glass rounded-[2.5rem] p-10 w-full max-w-lg border border-white/10 shadow-2xl animate-scaleIn my-8">
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

                            {/* Visibility Picker */}
                            <div className="flex items-center gap-4 mb-8">
                                <button
                                    onClick={() => setVisibility('public')}
                                    className={clsx(
                                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                                        visibility === 'public'
                                            ? "bg-blue-600/10 border-blue-600 shadow-lg"
                                            : "bg-white/5 border-white/5 opacity-50 hover:opacity-100"
                                    )}
                                >
                                    <FiUsers className={visibility === 'public' ? "text-blue-400" : "text-slate-400"} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Public</span>
                                </button>
                                <button
                                    onClick={() => setVisibility('close_friends')}
                                    className={clsx(
                                        "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                                        visibility === 'close_friends'
                                            ? "bg-emerald-600/10 border-emerald-600 shadow-lg"
                                            : "bg-white/5 border-white/5 opacity-50 hover:opacity-100"
                                    )}
                                >
                                    <FiStar className={visibility === 'close_friends' ? "text-emerald-400" : "text-slate-400"} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">Close Friends</span>
                                </button>
                            </div>

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

                            <button
                                onClick={() => setShowCloseFriendsModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 mb-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <FiUsers size={14} /> Manage Close Friends ({closeFriends.length})
                            </button>

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
                </Portal>
            )}
            {/* Close Friends Management Modal */}
            {showCloseFriendsModal && (
                <Portal>
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                        <div className="glass rounded-[2rem] p-8 w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-black text-slate-100 flex items-center gap-2">
                                    <FiStar className="text-emerald-400" /> Close Friends
                                </h4>
                                <button onClick={() => setShowCloseFriendsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <FiX size={20} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-400 mb-6">Verses shared to close friends are only visible to the people in this list.</p>

                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                                {closeFriends.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm italic">No close friends yet. Seek fellow poets to add them.</div>
                                ) : (
                                    closeFriends.map(friend => (
                                        <div key={friend._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                    {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : friend.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-bold text-slate-200">@{friend.username}</span>
                                            </div>
                                            <button
                                                onClick={() => toggleCloseFriend(friend._id)}
                                                className="text-[10px] font-black text-red-400/70 hover:text-red-400 uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-all"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Seek Fellow Poets</label>
                                <div className="relative">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={userSearch}
                                        onChange={(e) => searchUsers(e.target.value)}
                                        placeholder="Username..."
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute bottom-full left-0 w-full mb-2 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                                        {searchResults.map(u => {
                                            const isFriend = closeFriends.some(f => f._id === u._id)
                                            return (
                                                <button
                                                    key={u._id}
                                                    onClick={() => !isFriend && toggleCloseFriend(u._id)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-200">@{u.username}</span>
                                                    </div>
                                                    {isFriend ? (
                                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                                            <FiCheck /> Added
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Add</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowCloseFriendsModal(false)}
                                className="w-full mt-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    )
}
