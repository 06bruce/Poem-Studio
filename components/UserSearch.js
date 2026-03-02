'use client';
import React, { useState, useEffect } from 'react'
import { FiSearch, FiUsers } from 'react-icons/fi'

export default function UserSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleUserClick = (username) => {
    window.location.href = `/profile/${username}`
    setShowResults(false)
    setQuery('')
  }

  // Close results on escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowResults(false) }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="relative group">
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search for fellow poets..."
          className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-2xl bg-slate-800/30 border border-slate-700/50 focus:border-blue-500/50 text-slate-200 outline-none transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-md placeholder:text-slate-600 text-sm sm:text-base"
          aria-label="Search for poets"
          role="combobox"
          aria-expanded={showResults && results.length > 0}
          aria-autocomplete="list"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500/30 border-t-blue-500"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 sm:mt-3 w-full bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl z-50 max-h-72 sm:max-h-80 overflow-y-auto backdrop-blur-xl animate-fadeIn p-2 ring-1 ring-white/5" role="listbox">
          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => handleUserClick(user.username)}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-all duration-200 group/item text-left min-h-[52px]"
              role="option"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 font-bold text-sm group-hover/item:scale-110 transition-transform flex-shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-100 group-hover/item:text-blue-400 transition-colors text-sm sm:text-base">@{user.username}</div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{user.bio || 'Poet in the making'}</div>
              </div>
              <div className="text-[10px] text-slate-600 font-medium hidden sm:block">
                Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full mt-2 sm:mt-3 w-full bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl z-50 p-6 sm:p-8 text-center text-slate-500 backdrop-blur-xl animate-fadeIn">
          <FiUsers className="mx-auto mb-3 text-slate-600" size={28} />
          <p className="font-medium text-sm">No poets found for &quot;{query}&quot;</p>
          <p className="text-xs mt-1">Try a different name or invite them!</p>
        </div>
      )}
    </div>
  )
}
