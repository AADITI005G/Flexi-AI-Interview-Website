import React, { useEffect, useRef } from 'react'

export default function PixelCanvasOverlay({ tileSize = 16, speed = { x: 12, y: 6 } }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const offARef = useRef(null)
  const offBRef = useRef(null)
  const stateRef = useRef({ offsetX: 0, offsetY: 0, lastTs: 0, width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function buildOffscreens() {
      const patternTiles = 32
      const pw = tileSize * patternTiles
      const ph = tileSize * patternTiles

      const offA = document.createElement('canvas')
      offA.width = pw
      offA.height = ph
      const octxA = offA.getContext('2d')
      octxA.clearRect(0, 0, pw, ph)

      const basePalette = [
        'rgba(193,158,120,0.32)',
        'rgba(227,204,183,0.28)',
        'rgba(94,48,35,0.26)'
      ]
      const densityA = 0.28
      for (let y = 0; y < ph; y += tileSize) {
        for (let x = 0; x < pw; x += tileSize) {
          if (Math.random() < densityA) {
            octxA.fillStyle = basePalette[(x / tileSize + y / tileSize) % basePalette.length]
            octxA.fillRect(x, y, tileSize, tileSize)
          }
        }
      }

      const offB = document.createElement('canvas')
      offB.width = pw
      offB.height = ph
      const octxB = offB.getContext('2d')
      octxB.clearRect(0, 0, pw, ph)
      const shimmerPalette = [
        'rgba(227,204,183,0.22)',
        'rgba(193,158,120,0.18)'
      ]
      const densityB = 0.12
      for (let y = 0; y < ph; y += tileSize) {
        for (let x = 0; x < pw; x += tileSize) {
          if (Math.random() < densityB) {
            octxB.fillStyle = shimmerPalette[(x / tileSize + y / tileSize) % shimmerPalette.length]
            octxB.fillRect(x, y, tileSize, tileSize)
          }
        }
      }

      offARef.current = offA
      offBRef.current = offB
      stateRef.current.offsetX = 0
      stateRef.current.offsetY = 0
    }

    function resize() {
      const dpr = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = '100vw'
      canvas.style.height = '100vh'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stateRef.current.width = window.innerWidth
      stateRef.current.height = window.innerHeight
      buildOffscreens()
    }

    function tick(ts) {
      const s = stateRef.current
      const last = s.lastTs || ts
      const dt = Math.min(0.05, (ts - last) / 1000)
      s.lastTs = ts

      s.offsetX = (s.offsetX + speed.x * dt) % (offARef.current?.width || 1)
      s.offsetY = (s.offsetY + speed.y * dt) % (offARef.current?.height || 1)

      ctx.clearRect(0, 0, s.width, s.height)

      if (offARef.current) {
        ctx.save()
        ctx.globalAlpha = 0.48
        const patternA = ctx.createPattern(offARef.current, 'repeat')
        if (patternA) {
          ctx.fillStyle = patternA
          ctx.translate(-s.offsetX, -s.offsetY)
          ctx.fillRect(s.offsetX, s.offsetY, s.width + offARef.current.width, s.height + offARef.current.height)
        }
        ctx.restore()
      }

      if (offBRef.current) {
        ctx.save()
        const pulse = 0.16 + 0.08 * Math.sin(ts / 1800)
        ctx.globalAlpha = pulse
        const patternB = ctx.createPattern(offBRef.current, 'repeat')
        if (patternB) {
          ctx.fillStyle = patternB
          ctx.translate(-s.offsetX * 1.05, -s.offsetY * 1.05)
          ctx.fillRect(s.offsetX, s.offsetY, s.width + offBRef.current.width, s.height + offBRef.current.height)
        }
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    resize()
    rafRef.current = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [tileSize, speed.x, speed.y])

  return <canvas className="pixel-pattern" ref={canvasRef} aria-hidden="true" />
}