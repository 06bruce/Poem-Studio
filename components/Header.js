'use client';
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiSun, FiMoon, FiLogOut, FiBell, FiUser, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from '../contexts/ToastContext'

export default function Header({ onToggleSnow, showSnow, onAuthClick, onNotificationsClick }) {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000)
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
    <header className="flex items-center justify-between mb-6 sm:mb-8 px-4 sm:px-6 pt-6 animate-fadeIn" role="banner">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 sm:gap-4 group cursor-pointer transition-transform active:scale-95">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <Image
            src="/logo.jpg"
            alt="Poem Studio Logo"
            width={40}
            height={40}
            className="relative rounded-xl sm:rounded-2xl object-cover ring-1 ring-white/10 shadow-2xl sm:w-12 sm:h-12"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-gradient leading-none">Poem Studio</h1>
          <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-extra-widest hidden xs:block text-shadow-glow">Sanctuary of Verses</p>
        </div>
      </Link>

      {/* Desktop Actions */}
      <div className="hidden sm:flex flex-wrap gap-3 items-center">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 glass-pill text-sm font-medium text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="truncate max-w-[120px] lg:max-w-[200px]">Hello, {user.username}</p>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="My profile"
                onClick={() => router.push(`/profile/${user.username}`)}
                className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 group min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="My Profile"
              >
                {user.image ? (
                  <img src={user.image} alt={`${user.username}'s avatar`} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <FiUser className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
                )}
              </button>
              <button
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                onClick={onNotificationsClick}
                className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 relative group min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                aria-label="Logout"
                onClick={handleLogout}
                className="p-2.5 rounded-xl glass hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 group min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all duration-300 text-sm font-semibold shadow-lg shadow-blue-900/20 active:scale-95 min-h-[44px]"
          >
            Sign In
          </button>
        )}
        <button
          aria-label={showSnow ? 'Disable weather effects' : 'Enable weather effects'}
          onClick={onToggleSnow}
          className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 group min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {showSnow ?
            <FiSun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" /> :
            <FiMoon className="w-5 h-5 text-blue-300 group-hover:-rotate-12 transition-transform" />
          }
        </button>
      </div>

      {/* Mobile Menu Button */}
      <div className="flex sm:hidden items-center gap-2">
        {user && unreadCount > 0 && (
          <button
            aria-label={`${unreadCount} unread notifications`}
            onClick={onNotificationsClick}
            className="p-2 rounded-xl glass relative min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <FiBell className="w-5 h-5 text-slate-400" />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-[9px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </button>
        )}
        <button
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl glass hover:bg-slate-700/50 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {mobileMenuOpen ? <FiX className="w-5 h-5 text-slate-300" /> : <FiMenu className="w-5 h-5 text-slate-300" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mx-4 mt-2 glass rounded-2xl border border-white/10 shadow-2xl animate-fadeIn sm:hidden">
          <nav className="p-4 space-y-2" role="navigation" aria-label="Mobile navigation">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-slate-200 truncate">{user.username}</span>
                </div>
                <button
                  onClick={() => { router.push(`/profile/${user.username}`); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left min-h-[48px]"
                >
                  <FiUser className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-200">My Profile</span>
                </button>
                <button
                  onClick={() => { onNotificationsClick(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left min-h-[48px]"
                >
                  <FiBell className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-blue-600 text-[10px] font-bold text-white rounded-full px-2 py-0.5">{unreadCount}</span>
                  )}
                </button>
                <button
                  onClick={() => { onToggleSnow(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left min-h-[48px]"
                >
                  {showSnow ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5 text-blue-300" />}
                  <span className="text-sm text-slate-200">{showSnow ? 'Disable Weather' : 'Enable Weather'}</span>
                </button>
                <div className="border-t border-white/5 my-2"></div>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-left min-h-[48px]"
                >
                  <FiLogOut className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-400">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { onAuthClick(); setMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-sm font-semibold min-h-[48px]"
                >
                  Sign In / Sign Up
                </button>
                <button
                  onClick={() => { onToggleSnow(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left min-h-[48px]"
                >
                  {showSnow ? <FiSun className="w-5 h-5 text-amber-400" /> : <FiMoon className="w-5 h-5 text-blue-300" />}
                  <span className="text-sm text-slate-200">{showSnow ? 'Disable Weather' : 'Enable Weather'}</span>
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
