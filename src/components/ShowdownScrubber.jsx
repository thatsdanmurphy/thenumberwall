import { useEffect, useRef, useCallback } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import './ShowdownScrubber.css'

const SPEEDS = [1, 2, 4]

// Result abbreviations shown next to inning label
const RESULT_SHORT = {
  K:   'K',  W:  'BB', IW: 'IBB', HP: 'HBP',
  S:   '1B', D:  '2B', T:  '3B',  HR: 'HR',
  OUT: 'OUT', DP: 'GDP', SF: 'SAC', SH: 'SAC',
  E:   'E',  FC: 'FC',
  SB:  'SB', CS: 'CS', PO: 'PO',
  WP:  'WP', PB: 'PB', BK: 'BK',
}

export default function ShowdownScrubber({
  plays,
  gameStarts,
  position,
  onSeek,
  playing,
  onPlayPause,
  speed,
  onSpeedChange,
}) {
  const trackRef = useRef(null)
  const dragging = useRef(false)

  const totalPlays = plays.length
  const pct = totalPlays > 1 ? (position / (totalPlays - 1)) * 100 : 0

  // ── Auto-advance ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return
    const ms = Math.round(600 / speed)
    const id = setInterval(() => {
      onSeek(prev => {
        const next = (typeof prev === 'number' ? prev : position) + 1
        if (next >= totalPlays) { onPlayPause(false); return prev }
        return next
      })
    }, ms)
    return () => clearInterval(id)
  }, [playing, speed, totalPlays])  // eslint-disable-line

  // ── Drag / click on track ───────────────────────────────────────────────────
  const posFromEvent = useCallback((e) => {
    const track = trackRef.current
    if (!track) return position
    const rect   = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const ratio  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(ratio * (totalPlays - 1))
  }, [totalPlays, position])

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

  // ── Current play info ───────────────────────────────────────────────────────
  const play    = plays[position] ?? {}
  const gameNum = play.game   ?? 1
  const half    = play.half === 'top' ? 'T' : 'B'
  const inningN = play.inning ?? 1
  const result  = RESULT_SHORT[play.result] ?? ''

  return (
    <div className="showdown-scrubber">

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div className="showdown-scrubber__controls">

        {/* Play/pause */}
        <button
          className="showdown-scrubber__playpause"
          onClick={() => onPlayPause(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Prev / position label / Next */}
        <button
          className="showdown-scrubber__step"
          onClick={() => onSeek(p => p - 1)}
          disabled={position === 0}
          aria-label="Previous play"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="showdown-scrubber__pos-label">
          <span className="showdown-scrubber__game">G{gameNum}</span>
          <span className="showdown-scrubber__dot">·</span>
          <span className="showdown-scrubber__half">{half}{inningN}</span>
          {result && (
            <>
              <span className="showdown-scrubber__dot">·</span>
              <span className="showdown-scrubber__result">{result}</span>
            </>
          )}
        </div>

        <button
          className="showdown-scrubber__step"
          onClick={() => onSeek(p => p + 1)}
          disabled={position === totalPlays - 1}
          aria-label="Next play"
        >
          <ChevronRight size={16} />
        </button>

        {/* Speed */}
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

      {/* ── Track wrap ────────────────────────────────────────────────────── */}
      <div className="showdown-scrubber__track-wrap">

        {/* Game markers */}
        <div className="showdown-scrubber__markers">
          {Object.entries(gameStarts).map(([g, idx]) => {
            const markerPct = (idx / (totalPlays - 1)) * 100
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
          <div className="showdown-scrubber__fill" style={{ width: `${pct}%` }} />
          <div className="showdown-scrubber__thumb" style={{ left: `${pct}%` }} />
          {Object.entries(gameStarts).map(([g, idx]) => {
            if (idx === 0) return null
            const tickPct = (idx / (totalPlays - 1)) * 100
            return (
              <div key={g} className="showdown-scrubber__tick" style={{ left: `${tickPct}%` }} />
            )
          })}
        </div>

      </div>
    </div>
  )
}
