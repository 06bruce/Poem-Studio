'use client';
import React, { useState, useEffect } from 'react'
import { FiTrendingUp, FiUsers } from 'react-icons/fi'

export default function TrendingUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrendingUsers = async () => {
      try {
        const response = await fetch('/api/users/trending')
        if (response.ok) {
          const data = await response.json()
          setUsers(data)
        }
      } catch (error) {
        console.error('Failed to fetch trending users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrendingUsers()
  }, [])

  const handleUserClick = (username) => {
    window.location.href = `/profile/${username}`
  }

  if (loading) {
    return (
      <div className="rounded-xl glass p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FiTrendingUp />
          Trending Users
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-700 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl glass p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <FiTrendingUp />
        Trending Users
      </h3>
      
      {users.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <FiUsers className="mx-auto mb-2" size={24} />
          <p className="text-sm">No trending users yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user.username)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                {index < 3 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">@{user.username}</div>
                <div className="text-xs text-gray-400">
                  {user.poemCount || 0} poems • {user.followers?.length || 0} followers
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
