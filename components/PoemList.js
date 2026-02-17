'use client';
import React, { useEffect, useRef, useState } from 'react'
import PoemCard from './PoemCard'
import { FiTrash2, FiShare2, FiLoader, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../contexts/ToastContext'
import html2canvas from 'html2canvas'

const PoemList = React.forwardRef(({ refreshTrigger }, ref) => {
  const { user } = useAuth()
  const [poems, setPoems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sharingId, setSharingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [feedType, setFeedType] = useState('explore') // 'explore' or 'following'
  const listRef = useRef(null)

  // Fetch poems on mount and when user changes or refreshTrigger/feedType changes
  useEffect(() => {
    fetchPoems()
  }, [user, refreshTrigger, feedType])

  const fetchPoems = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      let url = '/api/poems'
      
      if (feedType === 'following' && user) {
        url = '/api/poems/following'
      }

      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!response.ok) {
        throw new Error('Failed to fetch poems')
      }

      const data = await response.json()
      setPoems(data)
    } catch (err) {
      setError('Failed to load poems')
      console.error('Fetch poems error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/poems/${poemId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to like poem')
      }

      const updatedPoem = await response.json()
      setPoems(poems.map(p => p._id === poemId ? updatedPoem : p))
      toast.success('Liked!')
    } catch (err) {
      console.error('Like error:', err)
      toast.error(err.message || 'Failed to like poem')
    }
  }

  const handleUnlike = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/poems/${poemId}/unlike`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to unlike poem')
      }

      const updatedPoem = await response.json()
      setPoems(poems.map(p => p._id === poemId ? updatedPoem : p))
      toast.success('Unliked')
    } catch (err) {
      console.error('Unlike error:', err)
      toast.error(err.message || 'Failed to unlike poem')
    }
  }

  const handleShare = async (poemId) => {
    setSharingId(poemId)
    try {
      const element = document.getElementById(`poem-card-${poemId}`)
      if (element) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#1f2937',
          scale: 2
        })
        
        const link = document.createElement('a')
        link.download = `poem-${poemId}.png`
        link.href = canvas.toDataURL()
        link.click()
        
        toast.success('Poem image saved!')
      }
    } catch (err) {
      console.error('Share error:', err)
      toast.error('Failed to generate image')
    } finally {
      setSharingId(null)
    }
  }

  const handleEdit = (poem) => {
    setEditingId(poem._id)
    setEditForm({
      title: poem.title,
      content: poem.content
    })
  }

  const handleEditSubmit = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/poems/${poemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update poem')
      }

      const updatedPoem = await response.json()
      setPoems(poems.map(p => p._id === poemId ? updatedPoem : p))
      setEditingId(null)
      setEditForm({ title: '', content: '' })
      toast.success('Poem updated successfully!')
    } catch (err) {
      console.error('Edit error:', err)
      toast.error(err.message || 'Failed to update poem')
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditForm({ title: '', content: '' })
  }

  const handleDelete = (poemId) => {
    setPoems(poems.filter(p => p._id !== poemId))
    toast.success('Poem deleted successfully!')
  }

  const isLikedByUser = (poem) => {
    if (!user || !poem.likes) return false
    return poem.likes.some(like => like.userId === user.id || like.userId === user._id)
  }

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Poem Collection</h2>
        {user && (
          <div className="flex gap-2">
            <button
              onClick={() => setFeedType('explore')}
              className={`px-4 py-2 rounded-lg transition ${
                feedType === 'explore' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setFeedType('following')}
              className={`px-4 py-2 rounded-lg transition ${
                feedType === 'following' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Following
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="animate-spin text-2xl" />
          <span className="ml-2">Loading poems...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-500/50 flex items-center gap-2 text-red-200">
          <FiAlertCircle size={20} />
          {error}
        </div>
      )}

      {!loading && !error && poems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No poems found. Be the first to create one!</p>
        </div>
      )}

      <div className="space-y-6" ref={listRef}>
        {poems.map((poem) => (
          <div key={poem._id} id={`poem-card-${poem._id}`}>
            {editingId === poem._id ? (
              <div className="rounded-2xl glass p-6">
                <h3 className="text-lg font-semibold mb-4">Edit Poem</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSubmit(poem._id)}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <PoemCard
                poem={poem}
                currentUserId={user?.id || user?._id}
                onLike={handleLike}
                onUnlike={handleUnlike}
                currentUserLiked={isLikedByUser(poem)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                extraActions={
                  <button
                    onClick={() => handleShare(poem._id)}
                    disabled={sharingId === poem._id}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition disabled:opacity-50"
                    title="Share as image"
                  >
                    {sharingId === poem._id ? (
                      <FiLoader className="animate-spin" size={16} />
                    ) : (
                      <FiShare2 size={16} />
                    )}
                  </button>
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
})

PoemList.displayName = 'PoemList'

export default PoemList
