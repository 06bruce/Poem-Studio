'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    FiUsers, FiEdit3, FiWind, FiTrash2, FiShield, FiTrendingUp,
    FiSearch, FiChevronDown, FiChevronUp, FiRefreshCw, FiHome,
    FiEye, FiHeart, FiMessageSquare, FiCalendar, FiAward,
    FiAlertCircle, FiCheck, FiX, FiEdit, FiMoreVertical,
    FiArrowUp, FiArrowDown, FiClock, FiZap, FiActivity
} from 'react-icons/fi'
import clsx from 'clsx'

// ─── Helper: Auth headers for API calls ──────────────────────
function getHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
}

// ─── Sub-Component: Stat Card ──────────────────────
function StatCard({ label, total, today, week, growth, icon: Icon, color, gradient }) {
    const isPositive = growth >= 0
    return (
        <div className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${gradient}`} />
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                </div>
                {growth !== undefined && (
                    <div className={clsx("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                        isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                        {isPositive ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>
            <p className="text-3xl font-black text-white mb-1">{total?.toLocaleString() ?? '—'}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
            {(today !== undefined || week !== undefined) && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
                    {today !== undefined && <span className="text-[10px] text-slate-500"><span className="text-slate-300 font-bold">{today}</span> today</span>}
                    {week !== undefined && <span className="text-[10px] text-slate-500"><span className="text-slate-300 font-bold">{week}</span> this week</span>}
                </div>
            )}
        </div>
    )
}

// ─── Sub-Component: Confirm Modal ──────────────────────
function ConfirmModal({ open, title, message, onConfirm, onCancel, danger }) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
            <div className="glass rounded-2xl p-6 max-w-sm w-full mx-4 border border-white/10 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center mb-4", danger ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400")}>
                    <FiAlertCircle size={24} />
                </div>
                <h3 className="text-lg font-black text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all text-sm font-bold">Cancel</button>
                    <button onClick={onConfirm} className={clsx("flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all",
                        danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
                    )}>Confirm</button>
                </div>
            </div>
        </div>
    )
}

// ─── Sub-Component: Edit User Modal ──────────────────────
function EditUserModal({ open, user, onSave, onClose }) {
    const [form, setForm] = useState({ username: '', email: '', role: 'user', bio: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (user) setForm({ username: user.username || '', email: user.email || '', role: user.role || 'user', bio: user.bio || '' })
    }, [user])

    if (!open || !user) return null

    const handleSave = async () => {
        setSaving(true)
        await onSave(user._id, form)
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="glass rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-white flex items-center gap-2"><FiEdit className="text-blue-400" /> Edit User</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"><FiX size={18} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Username</label>
                        <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Email</label>
                        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Bio</label>
                        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Role</label>
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all text-sm font-bold">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <FiRefreshCw className="animate-spin" size={14} /> : <FiCheck size={14} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Sub-Component: View Poem Modal ──────────────────────
function ViewPoemModal({ poem, onClose }) {
    if (!poem) return null
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="glass rounded-2xl max-w-2xl w-full mx-4 border border-white/10 animate-scaleIn max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-xl font-black text-white mb-2 leading-snug">{poem.title}</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[9px] font-black text-white overflow-hidden flex-shrink-0">
                                    {poem.author?.avatar ? <img src={poem.author.avatar} className="w-full h-full object-cover" alt="" /> : (poem.author?.username || poem.authorName || '?').charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-400">@{poem.author?.username || poem.authorName}</span>
                            </div>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-slate-400">{poem.theme || 'general'}</span>
                            {poem.mood && poem.mood !== 'neutral' && (
                                <><span className="text-slate-700">·</span><span className="text-[10px] text-slate-500 italic">{poem.mood}</span></>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all flex-shrink-0"><FiX size={18} /></button>
                </div>

                {/* Poem Content */}
                <div className="px-6 py-6 overflow-y-auto flex-1">
                    <div className="text-slate-200 leading-[1.9] font-serif text-base whitespace-pre-wrap">
                        {poem.content}
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center gap-4 flex-wrap text-sm flex-shrink-0">
                    <span className="flex items-center gap-1.5 text-pink-400 font-bold"><FiHeart size={14} />{poem.likes?.length || 0}</span>
                    <span className="flex items-center gap-1.5 text-blue-400 font-bold"><FiMessageSquare size={14} />{poem.comments?.length || 0}</span>
                    <span className="flex items-center gap-1.5 text-slate-500"><FiCalendar size={14} />{new Date(poem.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    {poem.source && poem.source !== 'user-created' && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold uppercase tracking-widest">{poem.source}</span>
                    )}
                </div>

                {/* Comments Preview */}
                {poem.comments?.length > 0 && (
                    <div className="px-6 py-4 border-t border-white/5 flex-shrink-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Comments ({poem.comments.length})</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {poem.comments.slice(0, 5).map((c, i) => (
                                <div key={i} className="flex gap-2 text-sm">
                                    <span className="text-blue-400 font-bold flex-shrink-0">@{c.username}</span>
                                    <span className="text-slate-400">{c.content}</span>
                                </div>
                            ))}
                            {poem.comments.length > 5 && (
                                <p className="text-[10px] text-slate-600">+{poem.comments.length - 5} more comments</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Sub-Component: Toast ──────────────────────
function AdminToast({ toast, onClose }) {
    useEffect(() => {
        if (toast) {
            const t = setTimeout(onClose, 3000)
            return () => clearTimeout(t)
        }
    }, [toast, onClose])

    if (!toast) return null
    return (
        <div className={clsx("fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl animate-fadeIn border",
            toast.type === 'success' ? "bg-emerald-900/90 border-emerald-500/30 text-emerald-300" : "bg-red-900/90 border-red-500/30 text-red-300"
        )}>
            {toast.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════
//  MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState('overview')
    const [dashData, setDashData] = useState(null)
    const [users, setUsers] = useState([])
    const [poems, setPoems] = useState([])
    const [stories, setStories] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState('createdAt')
    const [sortDir, setSortDir] = useState('desc')

    // Modals
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', action: null, danger: false })
    const [editModal, setEditModal] = useState({ open: false, user: null })
    const [viewPoem, setViewPoem] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = (message, type = 'success') => setToast({ message, type })

    // ─── Redirect non-admins ──────────────────────
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/')
        }
    }, [user, authLoading, router])

    // ─── Data Fetching ──────────────────────
    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/dashboard', { headers: getHeaders() })
            if (res.ok) {
                setDashData(await res.json())
            } else {
                showToast('Failed to load dashboard', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users', { headers: getHeaders() })
            if (res.ok) setUsers(await res.json())
            else showToast('Failed to load users', 'error')
        } catch { showToast('Network error', 'error') }
        finally { setLoading(false) }
    }, [])

    const fetchPoems = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/poems', { headers: getHeaders() })
            if (res.ok) setPoems(await res.json())
            else showToast('Failed to load poems', 'error')
        } catch { showToast('Network error', 'error') }
        finally { setLoading(false) }
    }, [])

    const fetchStories = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/stories', { headers: getHeaders() })
            if (res.ok) setStories(await res.json())
            else showToast('Failed to load stories', 'error')
        } catch { showToast('Network error', 'error') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => {
        if (!user || user.role !== 'admin') return
        if (activeTab === 'overview') fetchDashboard()
        if (activeTab === 'users') fetchUsers()
        if (activeTab === 'poems') fetchPoems()
        if (activeTab === 'stories') fetchStories()
    }, [activeTab, user, fetchDashboard, fetchUsers, fetchPoems, fetchStories])

    // ─── CRUD Actions ──────────────────────
    const handleDeleteUser = (userId, username) => {
        setConfirmModal({
            open: true, danger: true,
            title: 'Delete User',
            message: `Permanently delete @${username} and all their content? This cannot be undone.`,
            action: async () => {
                try {
                    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE', headers: getHeaders() })
                    if (res.ok) { showToast(`@${username} deleted`); fetchUsers(); fetchDashboard() }
                    else { const d = await res.json(); showToast(d.error || 'Failed', 'error') }
                } catch { showToast('Network error', 'error') }
                setConfirmModal(m => ({ ...m, open: false }))
            }
        })
    }

    const handleUpdateUser = async (userId, fields) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH', headers: getHeaders(),
                body: JSON.stringify({ userId, ...fields })
            })
            if (res.ok) {
                showToast('User updated')
                fetchUsers()
                setEditModal({ open: false, user: null })
            } else {
                const d = await res.json()
                showToast(d.error || 'Update failed', 'error')
            }
        } catch { showToast('Network error', 'error') }
    }

    const handleDeletePoem = (poemId, title) => {
        setConfirmModal({
            open: true, danger: true,
            title: 'Delete Poem',
            message: `Permanently delete "${title}"? This cannot be undone.`,
            action: async () => {
                try {
                    const res = await fetch(`/api/admin/poems?poemId=${poemId}`, { method: 'DELETE', headers: getHeaders() })
                    if (res.ok) { showToast('Poem deleted'); fetchPoems(); fetchDashboard() }
                    else showToast('Failed to delete', 'error')
                } catch { showToast('Network error', 'error') }
                setConfirmModal(m => ({ ...m, open: false }))
            }
        })
    }

    const handleDeleteStory = (storyId, username) => {
        setConfirmModal({
            open: true, danger: true,
            title: 'Delete Ripple',
            message: `Remove this ripple by @${username}? This cannot be undone.`,
            action: async () => {
                try {
                    const res = await fetch(`/api/admin/stories?storyId=${storyId}`, { method: 'DELETE', headers: getHeaders() })
                    if (res.ok) { showToast('Ripple dissolved'); fetchStories(); fetchDashboard() }
                    else showToast('Failed to delete', 'error')
                } catch { showToast('Network error', 'error') }
                setConfirmModal(m => ({ ...m, open: false }))
            }
        })
    }

    // ─── Search + Sort helpers ──────────────────────
    const filterItems = (items, fields) => {
        if (!searchQuery.trim()) return items
        const q = searchQuery.toLowerCase()
        return items.filter(item => fields.some(f => {
            const val = f.split('.').reduce((o, k) => o?.[k], item)
            return val && String(val).toLowerCase().includes(q)
        }))
    }

    const sortItems = (items, field, dir) => {
        return [...items].sort((a, b) => {
            const av = field.split('.').reduce((o, k) => o?.[k], a)
            const bv = field.split('.').reduce((o, k) => o?.[k], b)
            if (av == null) return 1
            if (bv == null) return -1
            if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
            return dir === 'asc' ? av - bv : bv - av
        })
    }

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('desc') }
    }

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <FiChevronDown size={12} className="text-slate-600" />
        return sortDir === 'asc' ? <FiChevronUp size={12} className="text-blue-400" /> : <FiChevronDown size={12} className="text-blue-400" />
    }

    // ─── Guard ──────────────────────
    if (authLoading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <FiRefreshCw className="animate-spin text-blue-500 text-3xl" />
                    <p className="text-slate-500 text-sm font-medium">Verifying access...</p>
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FiActivity },
        { id: 'users', label: 'Users', icon: FiUsers, count: users.length },
        { id: 'poems', label: 'Poems', icon: FiEdit3, count: poems.length },
        { id: 'stories', label: 'Ripples', icon: FiWind, count: stories.length },
    ]

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            {/* ─── Top Bar ──────────────────────── */}
            <header className="sticky top-0 z-50 glass border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all" title="Back to site">
                            <FiHome size={20} />
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <FiShield className="text-blue-500" size={20} />
                            <h1 className="text-lg font-black tracking-tight hidden sm:block">Admin Panel</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-40 sm:w-56"
                            />
                        </div>
                        <button onClick={() => {
                            if (activeTab === 'overview') fetchDashboard()
                            if (activeTab === 'users') fetchUsers()
                            if (activeTab === 'poems') fetchPoems()
                            if (activeTab === 'stories') fetchStories()
                        }} className={clsx("p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all", loading && "animate-spin")}>
                            <FiRefreshCw size={16} />
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs font-bold text-blue-400 hidden sm:block">{user.username}</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* ─── Tabs ──────────────────────── */}
                <nav className="flex gap-1 mb-6 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && activeTab === tab.id && (
                                <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-md font-black">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Loading bar */}
                {loading && (
                    <div className="h-0.5 bg-slate-900 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-blue-500 rounded-full animate-shimmer" style={{ width: '60%' }} />
                    </div>
                )}

                {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === 'overview' && dashData && (
                    <div className="animate-fadeIn space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard label="Total Users" total={dashData.stats.users.total} today={dashData.stats.users.today} week={dashData.stats.users.week} growth={dashData.stats.users.growth} icon={FiUsers} color="bg-blue-500/20 text-blue-400" gradient="bg-blue-500" />
                            <StatCard label="Total Poems" total={dashData.stats.poems.total} today={dashData.stats.poems.today} week={dashData.stats.poems.week} growth={dashData.stats.poems.growth} icon={FiEdit3} color="bg-purple-500/20 text-purple-400" gradient="bg-purple-500" />
                            <StatCard label="Active Ripples" total={dashData.stats.stories.total} icon={FiWind} color="bg-emerald-500/20 text-emerald-400" gradient="bg-emerald-500" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Users */}
                            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FiUsers size={14} className="text-blue-400" /> Recent Users</h3>
                                    <button onClick={() => setActiveTab('users')} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">View All →</button>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {dashData.recentUsers?.map(u => (
                                        <div key={u._id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-lg object-cover" alt="" /> : u.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">@{u.username}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                                            </div>
                                            <span className={clsx("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                u.role === 'admin' ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
                                            )}>{u.role || 'user'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Poems */}
                            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FiEdit3 size={14} className="text-purple-400" /> Recent Poems</h3>
                                    <button onClick={() => setActiveTab('poems')} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">View All →</button>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {dashData.recentPoems?.map(p => (
                                        <div key={p._id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                            <p className="text-sm font-bold text-white truncate">{p.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500">by @{p.author?.username || 'Unknown'}</span>
                                                <span className="text-slate-700">·</span>
                                                <span className="text-[10px] text-slate-600">{p.likes?.length || 0} ♥</span>
                                                <span className="text-[10px] text-slate-600">{p.comments?.length || 0} 💬</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Poets */}
                            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/5">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FiAward size={14} className="text-amber-400" /> Top Poets</h3>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {dashData.topPoets?.map((p, i) => (
                                        <div key={p._id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                            <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                                i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-slate-400/20 text-slate-300" : i === 2 ? "bg-orange-600/20 text-orange-400" : "bg-slate-800 text-slate-500"
                                            )}>{i + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">@{p.username}</p>
                                                <p className="text-[10px] text-slate-500">{p.totalPoems || 0} poems · {p.followers?.length || 0} followers</p>
                                            </div>
                                            {p.currentStreak > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400"><FiZap size={10} />{p.currentStreak}d</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ USERS TAB ═══ */}
                {activeTab === 'users' && (
                    <div className="animate-fadeIn">
                        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            {[
                                                { key: 'username', label: 'User' },
                                                { key: 'email', label: 'Email' },
                                                { key: 'role', label: 'Role' },
                                                { key: 'totalPoems', label: 'Poems' },
                                                { key: 'currentStreak', label: 'Streak' },
                                                { key: 'createdAt', label: 'Joined' },
                                            ].map(col => (
                                                <th key={col.key} className="px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => toggleSort(col.key)}>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {col.label} <SortIcon field={col.key} />
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {sortItems(filterItems(users, ['username', 'email']), sortField, sortDir).map(u => (
                                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 overflow-hidden">
                                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : u.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white">@{u.username}</p>
                                                            <p className="text-[10px] text-slate-600">{u.followers?.length || 0} followers</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-400 font-mono text-[12px]">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                                        u.role === 'admin' ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
                                                    )}>{u.role || 'user'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-300 font-bold">{u.totalPoems || 0}</td>
                                                <td className="px-4 py-3">
                                                    {u.currentStreak > 0 ? (
                                                        <span className="flex items-center gap-1 text-sm text-orange-400 font-bold"><FiZap size={12} />{u.currentStreak}d</span>
                                                    ) : <span className="text-sm text-slate-600">—</span>}
                                                </td>
                                                <td className="px-4 py-3 text-[12px] text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditModal({ open: true, user: u })} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 transition-all" title="Edit"><FiEdit size={14} /></button>
                                                        <button onClick={() => handleDeleteUser(u._id, u.username)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all" title="Delete" disabled={u._id === user.id}><FiTrash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filterItems(users, ['username', 'email']).length === 0 && !loading && (
                                <div className="text-center py-12 text-slate-500 text-sm">No users found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ POEMS TAB ═══ */}
                {activeTab === 'poems' && (
                    <div className="animate-fadeIn">
                        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            {[
                                                { key: 'title', label: 'Title' },
                                                { key: 'authorName', label: 'Author' },
                                                { key: 'theme', label: 'Theme' },
                                                { key: 'likes', label: 'Likes' },
                                                { key: 'comments', label: 'Comments' },
                                                { key: 'createdAt', label: 'Created' },
                                            ].map(col => (
                                                <th key={col.key} className="px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => toggleSort(col.key)}>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                        {col.label} <SortIcon field={col.key} />
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {sortItems(filterItems(poems, ['title', 'authorName', 'author.username', 'theme']), sortField, sortDir).map(p => (
                                            <tr key={p._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="max-w-[200px] cursor-pointer" onClick={() => setViewPoem(p)}>
                                                        <p className="text-sm font-bold text-white truncate hover:text-blue-400 transition-colors">{p.title}</p>
                                                        <p className="text-[11px] text-slate-500 truncate italic">{p.content?.substring(0, 60)}...</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-md bg-purple-600/20 flex items-center justify-center text-[9px] font-bold text-purple-400 flex-shrink-0 overflow-hidden">
                                                            {p.author?.avatar ? <img src={p.author.avatar} className="w-full h-full object-cover" alt="" /> : (p.author?.username || p.authorName || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm text-slate-300">@{p.author?.username || p.authorName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 text-slate-400">{p.theme || 'general'}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-sm text-pink-400 font-bold"><FiHeart size={12} />{p.likes?.length || 0}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-sm text-blue-400 font-bold"><FiMessageSquare size={12} />{p.comments?.length || 0}</span>
                                                </td>
                                                <td className="px-4 py-3 text-[12px] text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setViewPoem(p)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 transition-all" title="View Poem"><FiEye size={14} /></button>
                                                        <button onClick={() => handleDeletePoem(p._id, p.title)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all" title="Delete"><FiTrash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filterItems(poems, ['title', 'authorName', 'theme']).length === 0 && !loading && (
                                <div className="text-center py-12 text-slate-500 text-sm">No poems found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ STORIES TAB ═══ */}
                {activeTab === 'stories' && (
                    <div className="animate-fadeIn grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterItems(stories, ['username', 'content', 'colorTheme']).map(s => {
                            const themeColors = {
                                blue: 'from-blue-600 to-cyan-500',
                                purple: 'from-purple-600 to-pink-500',
                                emerald: 'from-emerald-600 to-teal-500',
                                rose: 'from-rose-600 to-pink-500',
                                amber: 'from-amber-600 to-orange-500',
                            }
                            return (
                                <div key={s._id} className="glass rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-all">
                                    <div className={`h-1 bg-gradient-to-r ${themeColors[s.colorTheme] || themeColors.blue}`} />
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 overflow-hidden">
                                                    {s.userId?.avatar ? <img src={s.userId.avatar} className="w-full h-full object-cover" alt="" /> : s.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">@{s.username}</p>
                                                    <p className="text-[9px] text-slate-500 flex items-center gap-1"><FiClock size={8} />{new Date(s.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteStory(s._id, s.username)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-200 font-serif italic leading-relaxed">"{s.content}"</p>
                                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                                            <span className="flex items-center gap-1 text-[10px] text-slate-500"><FiEye size={10} />{s.views || 0} views</span>
                                            <span className="flex items-center gap-1 text-[10px] text-slate-500"><FiHeart size={10} />{s.resonance?.length || 0} resonance</span>
                                            <span className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-gradient-to-r ${themeColors[s.colorTheme] || themeColors.blue} text-white/80`}>{s.colorTheme}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {filterItems(stories, ['username', 'content']).length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 text-slate-500 text-sm">No ripples found</div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Modals ──────────────────────── */}
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                danger={confirmModal.danger}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal(m => ({ ...m, open: false }))}
            />
            <EditUserModal
                open={editModal.open}
                user={editModal.user}
                onSave={handleUpdateUser}
                onClose={() => setEditModal({ open: false, user: null })}
            />
            {viewPoem && <ViewPoemModal poem={viewPoem} onClose={() => setViewPoem(null)} />}
            <AdminToast toast={toast} onClose={() => setToast(null)} />
        </div>
    )
}
