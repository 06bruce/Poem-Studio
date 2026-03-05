'use client';
import React, { useState, useEffect } from 'react'
import { FiBell, FiX, FiHeart, FiUser, FiMessageCircle } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export default function Notifications({ isOpen, onClose, inline = false }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [sharedPoems, setSharedPoems] = useState([])
  const [activeTab, setActiveTab] = useState('activity') // 'activity' or 'shared'

  useEffect(() => {
    if ((isOpen || inline) && user) {
      if (activeTab === 'activity') {
        fetchNotifications()
      } else {
        fetchSharedPoems()
      }
    }
  }, [isOpen, inline, user, activeTab])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || inline) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, inline, onClose])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSharedPoems = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/users/shared-poems', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSharedPoems(data)
      }
    } catch (error) {
      console.error('Failed to fetch shared poems:', error)
    } finally {
      setLoading(false)
    }
  }

  const markSharedAsRead = async (sharedPoemId) => {
    try {
      const token = localStorage.getItem('authToken')
      await fetch('/api/users/shared-poems', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sharedPoemIds: [sharedPoemId] })
      })

      setSharedPoems(prev =>
        prev.map(p => p._id === sharedPoemId ? { ...p, read: true } : p)
      )
    } catch (error) {
      console.error('Failed to mark shared poem as read:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken')
      await fetch(`/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FiHeart className="text-red-500 fill-red-500" size={14} />
      case 'follow':
        return <FiUser className="text-blue-500" size={14} />
      case 'comment':
        return <FiMessageCircle className="text-emerald-500 fill-emerald-500" size={14} />
      case 'mention':
        return <span className="text-purple-500 font-bold text-[10px]">@</span>
      default:
        return <FiBell className="text-gray-500" size={14} />
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`
    return `${Math.floor(diffInMinutes / 10080)}w`
  }

  const renderNotificationMessage = (notification) => {
    const sender = notification.sender?.username || 'Someone'
    const poemTitle = notification.poem?.title ? `"${notification.poem.title}"` : 'your poem'

    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="font-bold text-white">{sender}</span> liked {poemTitle}
          </>
        )
      case 'follow':
        return (
          <>
            <span className="font-bold text-white">{sender}</span> started following you
          </>
        )
      case 'comment':
        return (
          <>
            <span className="font-bold text-white">{sender}</span> commented on {poemTitle}
          </>
        )
      case 'mention':
        return (
          <>
            <span className="font-bold text-white">{sender}</span> mentioned you in a {notification.poem ? 'poem' : 'comment'}
          </>
        )
      default:
        return notification.message
    }
  }

  const Content = (
    <div className={inline ? "" : "bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] sm:max-h-[80vh] overflow-hidden border border-white/10 shadow-2xl animate-fadeIn"}>
      {!inline && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <FiBell className="text-blue-400" />
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close notifications"
          >
            <FiX className="text-slate-400" />
          </button>
        </div>
      )}

      {/* Drag indicator on mobile */}
      {!inline && <div className="flex justify-center mb-3 sm:hidden">
        <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
      </div>}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/5 px-1">
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'activity' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Activity
          {activeTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"></div>}
          {notifications.some(n => !n.read) && <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`pb-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'shared' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Shared
          {activeTab === 'shared' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full"></div>}
          {sharedPoems.some(p => !p.read) && <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'activity' ? (
        notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <FiBell size={24} className="opacity-30" />
            </div>
            <p className="font-bold text-slate-200">No activity yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">When someone appreciates your art, you&apos;ll be notified here</p>
          </div>
        ) : (
          <div className={`space-y-1 ${inline ? "pb-4" : "max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar"}`}>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.read && markAsRead(notification._id)}
                className={`w-full p-3 rounded-xl cursor-pointer transition text-left group/item relative flex items-center gap-3 ${notification.read ? 'opacity-70' : 'bg-blue-500/5'
                  } hover:bg-white/5 transition-all`}
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 overflow-hidden">
                    {notification.sender?.avatar ? (
                      <img src={notification.sender.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="text-slate-500" size={20} />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">
                    {renderNotificationMessage(notification)}
                    <span className="text-slate-500 ml-2 text-xs">{formatTime(notification.createdAt)}</span>
                  </p>
                </div>

                {notification.type === 'follow' && (
                  <button className="shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                    Follow
                  </button>
                )}

                {notification.poem && notification.type !== 'follow' && (
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden">
                    <div className="text-[10px] text-slate-500 text-center px-1 font-serif line-clamp-2 italic leading-tight">
                      Verse
                    </div>
                  </div>
                )}

                {!notification.read && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (

        sharedPoems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <FiMessageCircle size={24} className="opacity-30 text-emerald-400" />
            </div>
            <p className="font-bold text-slate-200">No shared verses</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Verses shared specifically with you will appear here</p>
          </div>
        ) : (
          <div className={`space-y-3 ${inline ? "pb-4" : "max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar"}`}>
            {sharedPoems.map((shared) => (
              <div
                key={shared._id}
                onClick={() => !shared.read && markSharedAsRead(shared._id)}
                className={`w-full p-4 rounded-2xl transition text-left relative overflow-hidden group/share ${shared.read ? 'bg-white/5 opacity-80' : 'bg-emerald-500/10 border border-emerald-500/10'
                  } hover:bg-white/10 hover:opacity-100 transition-all`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-lg shadow-emerald-900/20">
                        {shared.sender?.avatar ? <img src={shared.sender.avatar} className="w-full h-full object-cover" /> : shared.sender?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-200">@{shared.sender?.username} shared</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-extra-widest">{formatTime(shared.createdAt)}</span>
                  </div>

                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-1 italic">Title</p>
                    <p className="text-sm font-bold text-white mb-2">{shared.poem?.title}</p>
                    {shared.message && (
                      <div className="mt-2 text-xs text-slate-400 bg-white/5 p-2 rounded-lg italic border-l-2 border-emerald-500/30">
                        &quot;{shared.message}&quot;
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      onClick={() => window.location.href = `/poem/${shared.poem?.id || shared.poem?._id}`}
                      className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      Read verse
                    </button>
                  </div>
                </div>
                {!shared.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )

  if (inline) return Content

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {Content}
    </div>
  )
}

