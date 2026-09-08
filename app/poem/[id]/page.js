'use client';
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FiArrowLeft, FiLoader, FiAlertCircle, FiHome } from 'react-icons/fi'
import PoemCard from '../../../components/PoemCard'
import { useAuth } from '../../../contexts/AuthContext'
import { toast } from '../../../contexts/ToastContext'
import { cachedFetch, invalidateCache } from '../../../lib/clientCache'

export default function PoemDetail() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params?.id === 'string' ? params.id : ''
  const { user } = useAuth()

  const [poem, setPoem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    cachedFetch(`/api/poems/${id}`, async () => {
      const response = await fetch(`/api/poems/${id}`)
      if (!response.ok) throw new Error(response.status === 404 ? 'Poem not found' : 'Failed to load poem')
      return response.json()
    }, 30000)
      .then(({ data }) => setPoem(data))
      .catch((err) => {
        setError(err.message || 'Failed to load poem')
        console.error('Load poem error:', err)
      })
      .finally(() => setLoading(false))
  }, [id])

  const isLikedByUser = () => {
    if (!user || !poem?.likes) return false
    return poem.likes.some(like => like.userId === user.id || like.userId === user._id)
  }

  const handleLike = async (poemId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/poems/${poemId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to like poem')
      const updatedPoem = await response.json()
      invalidateCache('/api/poems/')
      setPoem(updatedPoem)
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
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to unlike poem')
      const updatedPoem = await response.json()
      invalidateCache('/api/poems/')
      setPoem(updatedPoem)
      toast.success('Unliked')
    } catch (err) {
      console.error('Unlike error:', err)
      toast.error(err.message || 'Failed to unlike poem')
    }
  }

  const handleEdit = (target) => {
    setEditing(true)
    setEditForm({ title: target.title, content: target.content })
  }

  const handleEditSubmit = async () => {
    if (!id || !editForm.title || !editForm.content) return
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/poems/${id}`, {
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
      invalidateCache('/api/poems/')
      setPoem(updatedPoem)
      setEditing(false)
      toast.success('Poem updated successfully!')
    } catch (err) {
      console.error('Edit error:', err)
      toast.error(err.message || 'Failed to update poem')
    }
  }

  const handleDelete = () => {
    invalidateCache('/api/poems/')
    toast.success('Poem deleted successfully!')
    router.push('/')
  }

  const currentUserId = user?.id || user?._id

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 pt-6 mb-6 sm:mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Go back"
          title="Go back"
        >
          <FiArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-lg sm:text-xl font-black tracking-tighter text-slate-100">The Verse</h1>
        <button
          onClick={() => router.push('/')}
          className="p-2.5 rounded-xl glass hover:bg-slate-700/50 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to the studio"
          title="Back to the studio"
        >
          <FiHome className="w-5 h-5 text-slate-300" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <FiLoader className="animate-spin text-blue-400 text-2xl" />
            <span className="ml-3 text-sm text-slate-400 font-medium">Calling the verse home...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 rounded-3xl glass border border-red-500/20 flex flex-col items-center gap-4 text-center">
            <div className="p-3 rounded-full bg-red-500/10 text-red-400">
              <FiAlertCircle size={32} />
            </div>
            <div>
              <p className="text-red-200 font-medium mb-1">{error}</p>
              <p className="text-slate-400 text-sm">This verse may have drifted out of reach.</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold transition-all active:scale-95 border border-blue-500/20"
            >
              Return to the Studio
            </button>
          </div>
        )}

        {poem && (
          editing ? (
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
                    rows={8}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditSubmit}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
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
              currentUserId={currentUserId}
              onLike={handleLike}
              onUnlike={handleUnlike}
              currentUserLiked={isLikedByUser()}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )
        )}
      </main>
    </div>
  )
}