'use client';
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiSun, FiMoon, FiLogOut, FiBell, FiUser } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from '../contexts/ToastContext'

export default function Header({ onToggleSnow, showSnow, onAuthClick, onNotificationsClick }) {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('/api/users/notifications/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired
        console.warn('Authentication token invalid or expired. Logging out.')
        handleLogout()
        return
      }

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    window.location.reload()
  }

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 sm:gap-0 px-2 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Image
            src="/logo.jpg"
            alt="Poem Studio Logo"
            width={48}
            height={48}
            className="relative rounded-2xl object-cover ring-1 ring-white/10 shadow-2xl"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-gradient leading-none">Poem Studio</h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-extra-widest">Sanctuary of Verses</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden xs:flex items-center gap-2 px-4 py-2 glass-pill text-sm font-medium text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="truncate max-w-[120px] lg:max-w-[200px]">Hello, {user.username}</p>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="profile"
                onClick={() => router.push(`/profile/${user.username}`)}
                className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 group"
                title="My Profile"
              >
                {user.image ? (
                  <img src={user.image} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <FiUser className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                )}
              </button>
              <button
                aria-label="notifications"
                onClick={onNotificationsClick}
                className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 relative group"
                title="Notifications"
              >
                <FiBell className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                aria-label="logout"
                onClick={handleLogout}
                className="p-2.5 rounded-xl glass hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 group"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg shadow-blue-900/20 active:scale-95"
          >
            Sign In
          </button>
        )}
        <button
          aria-label="toggle weather"
          onClick={onToggleSnow}
          className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 group"
          title={showSnow ? 'Disable Weather Effects' : 'Enable Weather Effects'}
        >
          {showSnow ?
            <FiSun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" /> :
            <FiMoon className="w-5 h-5 text-blue-300 group-hover:-rotate-12 transition-transform" />
          }
        </button>
      </div>
    </header>
  )
}
