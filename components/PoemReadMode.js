'use client'

import React, { useEffect, useRef } from 'react'
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi'
import Portal from './Portal'
import { getPoemText } from '../lib/poemPresentation'

export default function PoemReadMode({ poem, presentation, hasPrevious, hasNext, onPrevious, onNext, onClose }) {
  const closeButtonRef = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    if (!poem) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && hasPrevious) onPrevious()
      if (event.key === 'ArrowRight' && hasNext) onNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [poem, hasPrevious, hasNext, onClose, onNext, onPrevious])

  if (!poem) return null
  const lines = getPoemText(poem).split('\n')

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[120] flex min-h-screen items-center justify-center overflow-hidden bg-slate-950/90 px-5 py-10 backdrop-blur-xl"
        onTouchStart={(event) => { touchStartX.current = event.changedTouches[0].clientX }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return
          const distance = event.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(distance) > 55) {
            if (distance > 0) onPrevious()
            else onNext()
          }
          touchStartX.current = null
        }}
      >
        <div className="absolute inset-0 opacity-40" style={presentation.background} />
        <button ref={closeButtonRef} onClick={onClose} className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-3 text-slate-200 transition hover:bg-white/20" aria-label="Close read mode">
          <FiX size={22} />
        </button>

        <button onClick={onPrevious} disabled={!hasPrevious} className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-slate-200 transition hover:bg-white/20 disabled:opacity-20" aria-label="Previous poem">
          <FiArrowLeft size={22} />
        </button>
        <button onClick={onNext} disabled={!hasNext} className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-slate-200 transition hover:bg-white/20 disabled:opacity-20" aria-label="Next poem">
          <FiArrowRight size={22} />
        </button>

        <article className="relative z-[1] max-h-full w-full max-w-3xl overflow-y-auto px-8 text-center sm:px-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: presentation.palette.accent }}>{presentation.moodLabel}</p>
          <h2 className="mb-10 font-space text-3xl font-bold text-white sm:text-5xl">{poem.title}</h2>
          <div className={`poem-read-lines poem-type-${presentation.typography}`}>
            {lines.map((line, index) => <p key={`${index}-${line}`} className="mb-3 text-slate-100">{line || '\u00a0'}</p>)}
          </div>
          <p className="mt-12 text-sm text-slate-400">— {poem.authorName || poem.author?.username || 'Anonymous'}</p>
        </article>
      </div>
    </Portal>
  )
}
