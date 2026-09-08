'use client'

import { useEffect, useRef } from 'react'

/**
 * Subscribes to /api/notifications/stream (Server-Sent Events) so unread
 * notifications arrive the instant they happen instead of waiting for the next
 * poll. Falls back to calling `pollFn` on an interval if SSE isn't supported or
 * the connection can't be kept open (e.g. an infra layer that doesn't support
 * long-lived responses) — the poll path is the same one this replaces, so
 * behavior never regresses below what polling already provided.
 *
 * @param {object} options
 * @param {boolean} options.enabled - only connect when true (matches existing "only poll when logged in" gating)
 * @param {string|null} options.token - JWT used to authenticate the stream when there's no session cookie
 * @param {() => void} options.pollFn - refetches the current state; called on every push event and as the fallback
 * @param {number} [options.pollIntervalMs=30000]
 */
export function useNotificationStream({ enabled, token, pollFn, pollIntervalMs = 30000 }) {
  const pollFnRef = useRef(pollFn)

  useEffect(() => {
    pollFnRef.current = pollFn
  }, [pollFn])

  useEffect(() => {
    if (!enabled) return undefined

    let pollTimer = null
    let source = null
    let stopped = false

    const startPolling = () => {
      if (pollTimer || stopped) return
      pollFnRef.current()
      pollTimer = setInterval(() => pollFnRef.current(), pollIntervalMs)
    }

    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      startPolling()
      return () => { if (pollTimer) clearInterval(pollTimer) }
    }

    pollFnRef.current()
    const query = token ? `?token=${encodeURIComponent(token)}` : ''
    source = new EventSource(`/api/notifications/stream${query}`)

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload?.type === 'notification') pollFnRef.current()
      } catch {
        // ignore malformed/heartbeat events
      }
    }

    source.onerror = () => {
      source.close()
      source = null
      startPolling()
    }

    return () => {
      stopped = true
      if (source) source.close()
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [enabled, token, pollIntervalMs])
}
