'use client';
import React, { useEffect, useRef } from 'react'

// Dark ("ink") mode: bright specks screen-blended over the dark page read as
// falling starlight/snow. Light ("paper") mode inverts the metaphor — darker,
// ink-toned specks multiply-blended over the pale page read as falling ink.
const moodColorsDark = {
  happy: { r: 255, g: 215, b: 100 },
  sad: { r: 120, g: 160, b: 255 },
  peaceful: { r: 140, g: 230, b: 170 },
  mysterious: { r: 180, g: 130, b: 255 },
  passionate: { r: 255, g: 120, b: 140 },
  melancholy: { r: 150, g: 170, b: 200 },
  neutral: { r: 255, g: 255, b: 255 },
}

const moodColorsLight = {
  happy: { r: 181, g: 128, b: 20 },
  sad: { r: 60, g: 90, b: 170 },
  peaceful: { r: 50, g: 120, b: 85 },
  mysterious: { r: 91, g: 63, b: 150 },
  passionate: { r: 176, g: 58, b: 78 },
  melancholy: { r: 90, g: 100, b: 120 },
  neutral: { r: 28, g: 26, b: 43 },
}

export default function WeatherEffect({ mood = 'neutral', theme = 'dark' }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const particles = []
    const particleCount = canvas.width < 768 ? 24 : 60

    const moodColors = theme === 'light' ? moodColorsLight : moodColorsDark
    const color = moodColors[mood] || moodColors.neutral

    class Particle {
      constructor(anywhere = false) {
        this.reset(anywhere)
      }

      reset(anywhere = false) {
        this.x = Math.random() * canvas.width
        this.y = anywhere ? Math.random() * canvas.height : Math.random() * canvas.height - canvas.height
        this.size = Math.random() * 2.5 + 0.5
        this.speedY = Math.random() * 0.8 + 0.3
        this.speedX = Math.random() * 0.4 - 0.2
        this.opacity = Math.random() * 0.4 + 0.1
      }

      update() {
        this.y += this.speedY
        this.x += this.speedX

        if (this.y > canvas.height) {
          this.reset()
          this.y = -10
        }

        if (this.x > canvas.width) {
          this.x = 0
        } else if (this.x < 0) {
          this.x = canvas.width
        }
      }

      draw() {
        ctx.save()
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(reducedMotion))
    }

    // When reduced motion is requested, render one static frame instead of animating.
    const drawStatic = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(particle => particle.draw())
    }

    if (reducedMotion) {
      drawStatic()
      return () => {}
    }

    // Throttle to ~30fps so the compositor isn't repainted every frame.
    let lastFrame = 0
    const animate = (timestamp) => {
      if (timestamp - lastFrame >= 33) {
        lastFrame = timestamp
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particles.forEach(particle => {
          particle.update()
          particle.draw()
        })
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    // Pause animation when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      } else {
        if (!animationRef.current) {
          animate(performance.now())
        }
      }
    }

    animate(performance.now())

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (reducedMotion) {
        drawStatic()
      }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [mood, theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: theme === 'light' ? 'multiply' : 'screen' }}
      aria-hidden="true"
    />
  )
}
