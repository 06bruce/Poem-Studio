'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import PoemCard from './PoemCard'
import PoemReadMode from './PoemReadMode'
import { FiAlertCircle, FiLoader, FiShare2 } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from '../contexts/ToastContext'
import { cachedFetch, invalidateCache } from '../lib/clientCache'
import { getPoemPresentation } from '../lib/poemPresentation'

const PAGE_SIZE = 12

const PoemList = React.forwardRef(({ refreshTrigger }, ref) => {
  const { user } = useAuth()
  const [poems, setPoems] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [sharingId, setSharingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [feedType, setFeedType] = useState('explore')
  const [readIndex, setReadIndex] = useState(null)
  const requestRef = useRef(0)

  const feedUrl = feedType === 'following' && user ? '/api/poems/following' : '/api/poems'
  const cachePrefix = feedType === 'following' ? `/api/poems/following:${user?._id || user?.id}` : '/api/poems'

  const fetchPage = useCallback(async ({ cursor = null, replace = false } = {}) => {
    if (feedType === 'following' && !user) return
    const requestId = ++requestRef.current
    if (replace) setLoading(true)
    else setLoadingMore(true)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const query = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (cursor) query.set('before', cursor)
      const url = `${feedUrl}?${query.toString()}`
      const cacheKey = `${cachePrefix}?limit=${PAGE_SIZE}${cursor ? `&before=${cursor}` : ''}`
      const { data } = await cachedFetch(cacheKey, async () => {
        const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!response.ok) throw new Error('Failed to fetch poems')
        return response.json()
      }, feedType === 'following' ? 15000 : 30000)
      if (requestId !== requestRef.current) return
      const page = Array.isArray(data) ? { items: data, nextCursor: null, hasMore: false } : data
      setPoems((current) => {
        if (replace) return page.items || []
        const merged = [...current, ...(page.items || [])]
        return Array.from(new Map(merged.map((poem) => [poem._id, poem])).values())
      })
      setNextCursor(page.nextCursor || null)
      setHasMore(Boolean(page.hasMore))
    } catch (err) {
      if (replace) setError('Failed to load poems')
      console.error('Fetch poems error:', err)
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [cachePrefix, feedType, feedUrl, user])

  useEffect(() => {
    if (refreshTrigger > 0) invalidateCache(cachePrefix)
    setPoems([])
    setNextCursor(null)
    setHasMore(true)
    fetchPage({ replace: true })
  }, [cachePrefix, fetchPage, refreshTrigger])

  const virtualizer = useWindowVirtualizer({
    count: poems.length,
    estimateSize: () => 430,
    overscan: 3,
    getItemKey: (index) => poems[index]?._id || index
  })
  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (lastItem && lastItem.index >= poems.length - 4 && hasMore && !loadingMore && nextCursor) fetchPage({ cursor: nextCursor })
  }, [fetchPage, hasMore, loadingMore, nextCursor, poems.length, virtualItems])

  const updatePoem = useCallback((poemId, updater) => {
    setPoems((current) => current.map((poem) => poem._id === poemId ? updater(poem) : poem))
  }, [])

  const handleLike = useCallback(async (poemId) => {
    const previous = poems.find((poem) => poem._id === poemId)
    if (!previous) return
    updatePoem(poemId, (poem) => ({ ...poem, likedByMe: true, likeCount: (poem.likeCount ?? poem.likes?.length ?? 0) + 1 }))
    try {
      const response = await fetch(`/api/poems/${poemId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to like poem')
      const updated = await response.json()
      updatePoem(poemId, (poem) => ({ ...poem, ...updated }))
      invalidateCache('/api/poems')
    } catch (err) {
      updatePoem(poemId, () => previous)
      toast.error(err.message || 'Failed to like poem')
    }
  }, [poems, updatePoem])

  const handleUnlike = useCallback(async (poemId) => {
    const previous = poems.find((poem) => poem._id === poemId)
    if (!previous) return
    updatePoem(poemId, (poem) => ({ ...poem, likedByMe: false, likeCount: Math.max(0, (poem.likeCount ?? poem.likes?.length ?? 0) - 1) }))
    try {
      const response = await fetch(`/api/poems/${poemId}/unlike`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to unlike poem')
      const updated = await response.json()
      updatePoem(poemId, (poem) => ({ ...poem, ...updated }))
      invalidateCache('/api/poems')
    } catch (err) {
      updatePoem(poemId, () => previous)
      toast.error(err.message || 'Failed to unlike poem')
    }
  }, [poems, updatePoem])

  const handleShare = async (poemId) => {
    setSharingId(poemId)
    try {
      const element = document.getElementById(`poem-card-${poemId}`)
      if (!element) return
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(element, { backgroundColor: '#1f2937', scale: 2 })
      const link = document.createElement('a')
      link.download = `poem-${poemId}.png`
      link.href = canvas.toDataURL()
      link.click()
      toast.success('Poem image saved!')
    } catch (err) {
      console.error('Share error:', err)
      toast.error('Failed to generate image')
    } finally {
      setSharingId(null)
    }
  }

  const handleEdit = (poem) => {
    setEditingId(poem._id)
    setEditForm({ title: poem.title, content: poem.content })
  }

  const handleEditSubmit = async (poemId) => {
    try {
      const response = await fetch(`/api/poems/${poemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` }, body: JSON.stringify(editForm) })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update poem')
      const updated = await response.json()
      updatePoem(poemId, () => updated)
      setEditingId(null)
      setEditForm({ title: '', content: '' })
      invalidateCache(cachePrefix)
      toast.success('Poem updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update poem')
    }
  }

  const handleDelete = (poemId) => {
    setPoems((current) => current.filter((poem) => poem._id !== poemId))
    invalidateCache(cachePrefix)
    toast.success('Poem deleted successfully!')
  }

  const currentReadPoem = readIndex === null ? null : poems[readIndex]
  const currentPresentation = currentReadPoem ? getPoemPresentation(currentReadPoem, readIndex) : null

  return (
    <div ref={ref} className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-space text-xl font-semibold">Poem Collection</h2>
        {user && <div className="flex gap-2">{['explore', 'following'].map((type) => <button key={type} onClick={() => setFeedType(type)} className={`rounded-lg px-4 py-2 capitalize transition ${feedType === type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{type}</button>)}</div>}
      </div>
      {loading && <div className="flex items-center justify-center py-12"><FiLoader className="animate-spin text-2xl" /><span className="ml-2">Loading poems...</span></div>}
      {error && <div className="glass flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 p-6 text-center"><FiAlertCircle className="text-red-400" size={32} /><p className="text-red-200">{error}</p><button onClick={() => fetchPage({ replace: true })} className="rounded-xl border border-red-500/20 bg-red-500/20 px-6 py-2 text-red-300">Retry</button></div>}
      {!loading && !error && poems.length === 0 && <div className="py-12 text-center text-gray-400">No poems found. Be the first to create one!</div>}
      <div className="relative w-full pr-1" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualItems.map((virtualRow) => {
            const poem = poems[virtualRow.index]
            const presentation = getPoemPresentation(poem, virtualRow.index)
            return <div key={poem._id} ref={virtualizer.measureElement} data-index={virtualRow.index} id={`poem-card-${poem._id}`} className="absolute left-0 top-0 w-full pb-6" style={{ transform: `translateY(${virtualRow.start}px)` }}>
              {editingId === poem._id ? <div className="glass rounded-2xl p-6"><h3 className="mb-4 text-lg font-semibold">Edit Poem</h3><div className="space-y-4"><input value={editForm.title} onChange={(event) => setEditForm((form) => ({ ...form, title: event.target.value }))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 outline-none" /><textarea value={editForm.content} onChange={(event) => setEditForm((form) => ({ ...form, content: event.target.value }))} rows={6} className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 outline-none" /><div className="flex gap-2"><button onClick={() => handleEditSubmit(poem._id)} className="rounded-lg bg-green-600 px-4 py-2">Save Changes</button><button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-700 px-4 py-2">Cancel</button></div></div></div> : <PoemCard poem={poem} presentation={presentation} currentUserId={user?.id || user?._id} currentUserLiked={poem.likedByMe ?? Boolean(poem.likes?.some((like) => like.userId === (user?.id || user?._id)))} onLike={handleLike} onUnlike={handleUnlike} onEdit={handleEdit} onDelete={handleDelete} onRead={() => setReadIndex(virtualRow.index)} extraActions={<button onClick={() => handleShare(poem._id)} disabled={sharingId === poem._id} className="rounded-lg bg-gray-700 p-2 text-gray-300 transition hover:bg-gray-600 disabled:opacity-50" title="Share as image">{sharingId === poem._id ? <FiLoader className="animate-spin" size={16} /> : <FiShare2 size={16} />}</button>} />}
            </div>
          })}
      </div>
      {loadingMore && <div className="flex justify-center py-4"><FiLoader className="animate-spin" /></div>}
      <PoemReadMode poem={currentReadPoem} presentation={currentPresentation} hasPrevious={readIndex > 0} hasNext={readIndex !== null && readIndex < poems.length - 1} onPrevious={() => setReadIndex((index) => Math.max(0, index - 1))} onNext={() => setReadIndex((index) => Math.min(poems.length - 1, index + 1))} onClose={() => setReadIndex(null)} />
    </div>
  )
})

PoemList.displayName = 'PoemList'
export default PoemList
