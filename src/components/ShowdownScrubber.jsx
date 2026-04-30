import { useEffect, useRef, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import './ShowdownScrubber.css'

const SPEEDS = [1, 2, 4]

// ── ShowdownScrubber ──────────────────────────────────────────────────────────
// Horizontal timeline across all half-innings of the series.
// Game markers (G1–G7) sit above the track. Thumb is draggable.
// Play/pause auto-advances at configurable speed.

export default function ShowdownScrubber({
  timeline,        // flat array of half-inning objects
  gameStarts,      // { 1: idx, 2: idx, ... } — first slot index per game
  position,        // current index into timeline
  onSeek,          // (idx) => void
  playing,
  onPlayPause,
  speed,
  onSpeedChange,
}) {
  const trackRef = useRef(null)
  const dragging = useRef(false)

  const totalSlots = timeline.length
  const pct = totalSlots > 1 ? (position / (totalSlots - 1)) * 100 : 0

  // ── Auto-advance ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return
    // ms per half-inning: 800ms at 1x, 400ms at 2x, 200ms at 4x
    const ms = Math.round(800 / speed)
    const id = setInterval(() => {
      onSeek(prev => {
        const next = (typeof prev === 'number' ? prev : position) + 1
        if (next >= totalSlots) { onPlayPause(false); return prev }
        return next
      })
    }, ms)
    return () => clearInterval(id)
  }, [playing, speed, totalSlots])  // eslint-disable-line

  // ── Drag ────────────────────────────────────────────────────────────────────
  const posFromEvent = useCallback((e) => {
    const track = trackRef.current
    if (!track) return position
    const rect = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(ratio * (totalSlots - 1))
  }, [totalSlots, position])

  const onPointerDown = useCallback((e) => {
    dragging.current = true
    onSeek(posFromEvent(e))
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [posFromEvent, onSeek])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return
    onSeek(posFromEvent(e))
  }, [posFromEvent, onSeek])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  // ── Current slot info ────────────────────────────────────────────────────────
  const slot     = timeline[position] ?? {}
  const gameNum  = slot.game ?? 1
  const half     = slot.half === 'top' ? 'T' : 'B'
  const inningN  = slot.inning ?? 1
  const note     = slot.note ?? null

  return (
    <div className="showdown-scrubber">

      {/* ── Controls row ──────────────────────────────────────────────────── */}
      <div className="showdown-scrubber__controls">
        <button
          className="showdown-scrubber__playpause"
          onClick={() => onPlayPause(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <div className="showdown-scrubber__pos-label">
          <span className="showdown-scrubber__game">G{gameNum}</span>
          <span className="showdown-scrubber__dot">·</span>
          <span className="showdown-scrubber__half">{half}{inningN}</span>
        </div>

        <div className="showdown-scrubber__speeds">
          {SPEEDS.map(s => (
            <button
              key={s}
              className={`showdown-scrubber__speed${speed === s ? ' showdown-scrubber__speed--active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── Note (key moments) ────────────────────────────────────────────── */}
      <div className={`showdown-scrubber__note${note ? ' showdown-scrubber__note--visible' : ''}`}>
        {note ?? ''}
      </div>

      {/* ── Track ─────────────────────────────────────────────────────────── */}
      <div className="showdown-scrubber__track-wrap">

        {/* Game markers */}
        <div className="showdown-scrubber__markers">
          {Object.entries(gameStarts).map(([g, idx]) => {
            const markerPct = (idx / (totalSlots - 1)) * 100
            return (
              <button
                key={g}
                className={`showdown-scrubber__marker${gameNum === Number(g) ? ' showdown-scrubber__marker--active' : ''}`}
                style={{ left: `${markerPct}%` }}
                onClick={() => onSeek(idx)}
              >
                G{g}
              </button>
            )
          })}
        </div>

        {/* Track bar */}
        <div
          ref={trackRef}
          className="showdown-scrubber__track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Filled portion */}
          <div
            className="showdown-scrubber__fill"
            style={{ width: `${pct}%` }}
          />
          {/* Thumb */}
          <div
            className="showdown-scrubber__thumb"
            style={{ left: `${pct}%` }}
          />
          {/* Game boundary ticks */}
          {Object.entries(gameStarts).map(([g, idx]) => {
            if (idx === 0) return null
            const tickPct = (idx / (totalSlots - 1)) * 100
            return (
              <div
                key={g}
                className="showdown-scrubber__tick"
                style={{ left: `${tickPct}%` }}
              />
            )
          })}
        </div>
      </div>

    </div>
  )
}
