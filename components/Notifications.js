'use client';
import React, { useState, useEffect } from 'react'
import { FiBell, FiX, FiHeart, FiUser, FiMessageCircle } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export default function Notifications({ isOpen, onClose, inline = false }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ((isOpen || inline) && user) {
      fetchNotifications()
    }
  }, [isOpen, inline, user])

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
        return <FiHeart className="text-red-500" />
      case 'follow':
        return <FiUser className="text-blue-500" />
      case 'comment':
        return <FiMessageCircle className="text-green-500" />
      default:
        return <FiBell className="text-gray-500" />
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
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

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
            <FiBell size={24} className="opacity-30" />
          </div>
          <p className="font-bold text-slate-200">No activity yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">When someone appreciates your art, you&apos;ll be notified here</p>
        </div>
      ) : (
        <div className={`space-y-3 ${inline ? "pb-4" : "max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar"}`}>
          {notifications.map((notification) => (
            <button
              key={notification._id}
              onClick={() => !notification.read && markAsRead(notification._id)}
              className={`w-full p-4 rounded-2xl cursor-pointer transition text-left group/item relative overflow-hidden ${notification.read ? 'bg-white/5 opacity-70' : 'bg-blue-500/10 border border-blue-500/10'
                } hover:bg-white/10 hover:opacity-100 transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 leading-tight mb-1">{notification.message}</p>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{formatTime(notification.createdAt)}</span>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0 shadow-lg shadow-blue-500/50"></div>
                )}
              </div>
            </button>
          ))}
        </div>
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

