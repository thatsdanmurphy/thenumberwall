import { useEffect, useRef, useCallback, useMemo } from 'react'
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react'
import './ShowdownScrubber.css'

const SOX_FILL = 'rgba(210,50,60,0.88)'
const NYY_FILL = 'rgba(20,50,105,0.88)'
const FUTURE   = 'rgba(255,255,255,0.06)'

// Short result labels shown in the position display
const RESULT_SHORT = {
  K:'K', W:'BB', IW:'IBB', HP:'HBP',
  S:'1B', D:'2B', T:'3B', HR:'HR',
  OUT:'OUT', DP:'GDP', SF:'SAC', SH:'SAC',
  E:'E', FC:'FC', SB:'SB', CS:'CS',
  WP:'WP', PB:'PB', BK:'BK',
}

export default function ShowdownScrubber({
  plays, games, gameStarts, position,
  onSeek, playing, onPlayPause, speed, onSpeedChange,
  extraZones = [],
}) {
  const trackRef = useRef(null)
  const dragging = useRef(false)
  const total    = plays.length
  const pct      = total > 1 ? (position / (total - 1)) * 100 : 0

  // ── Game segments with winner colors ─────────────────────────────────────
  const segments = useMemo(() => {
    const entries = Object.entries(gameStarts)
      .map(([g, idx]) => [Number(g), idx])
      .sort((a, b) => a[0] - b[0])

    return entries.map(([gNum, startIdx], i) => {
      const endIdx = entries[i + 1]?.[1] ?? total
      const game   = games[gNum - 1]
      const winner = game?.winner ?? 'NYY'
      const startPct = (startIdx / (total - 1)) * 100
      const endPct   = (Math.min(endIdx, total) / (total - 1)) * 100
      const complete  = position >= endIdx - 1
      const active    = position >= startIdx && position < endIdx
      return { gNum, startIdx, endIdx, startPct, endPct, winner, complete, active }
    })
  }, [gameStarts, games, total, position])

  // ── Extra-inning zone positions ───────────────────────────────────────────
  const extraRects = useMemo(() => extraZones.map(({ start, end }) => ({
    startPct: (start / (total - 1)) * 100,
    endPct:   (Math.min(end + 1, total - 1) / (total - 1)) * 100,
  })), [extraZones, total])

  // ── Auto-advance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return
    const ms = Math.round(600 / speed)
    const id = setInterval(() => {
      onSeek(prev => {
        const next = (typeof prev === 'number' ? prev : position) + 1
        if (next >= total) { onPlayPause(false); return prev }
        return next
      })
    }, ms)
    return () => clearInterval(id)
  }, [playing, speed, total])  // eslint-disable-line

  // ── Track interaction ─────────────────────────────────────────────────────
  const posFromEvent = useCallback((e) => {
    const track = trackRef.current
    if (!track) return position
    const rect   = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const ratio  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(ratio * (total - 1))
  }, [total, position])

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

  // ── Current play info ─────────────────────────────────────────────────────
  const play    = plays[position] ?? {}
  const gameNum = play.game   ?? 1
  const half    = play.half === 'top' ? 'T' : 'B'
  const inningN = play.inning ?? 1
  const result  = RESULT_SHORT[play.result] ?? ''

  const currentSeg = segments.find(s => s.gNum === gameNum)
  const accentColor = currentSeg?.winner === 'BOS' ? SOX_FILL : NYY_FILL

  return (
    <div className="showdown-scrubber">

      {/* ── Top controls: play + prev/label/next ─────────────────────── */}
      <div className="showdown-scrubber__controls">

        <button
          className="showdown-scrubber__playpause"
          onClick={() => onPlayPause(!playing)}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

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
              <span className="showdown-scrubber__result" style={{ color: accentColor }}>{result}</span>
            </>
          )}
        </div>

        <button
          className="showdown-scrubber__step"
          onClick={() => onSeek(p => p + 1)}
          disabled={position === total - 1}
          aria-label="Next play"
        >
          <ChevronRight size={16} />
        </button>

      </div>

      {/* ── Game marker labels ────────────────────────────────────────── */}
      <div className="showdown-scrubber__markers">
        {segments.map(seg => (
          <button
            key={seg.gNum}
            className={`showdown-scrubber__marker${seg.active ? ' showdown-scrubber__marker--active' : ''}`}
            style={{ left: `${seg.startPct}%` }}
            onClick={() => onSeek(seg.startIdx)}
          >
            G{seg.gNum}
          </button>
        ))}
      </div>

      {/* ── Track ─────────────────────────────────────────────────────── */}
      <div
        ref={trackRef}
        className="showdown-scrubber__track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Game segments — colored by winner, chunk gaps between them */}
        {segments.map((seg, i) => {
          const GAP   = 0.5  // percent gap between game chunks
          const start = seg.startPct + (i === 0 ? 0 : GAP / 2)
          const end   = seg.endPct   - (i === segments.length - 1 ? 0 : GAP / 2)
          const width = Math.max(0, end - start)
          const played = position >= seg.startIdx
          const bg = played
            ? (seg.winner === 'BOS' ? SOX_FILL : NYY_FILL)
            : FUTURE
          return (
            <div
              key={seg.gNum}
              className="showdown-scrubber__segment"
              style={{
                left:       `${start}%`,
                width:      `${width}%`,
                background: bg,
              }}
            />
          )
        })}

        {/* Brightness fill: highlights only the portion BEFORE thumb */}
        <div
          className="showdown-scrubber__fill-highlight"
          style={{ width: `${pct}%` }}
        />

        {/* Extra-inning crosshatch overlays */}
        {extraRects.map((r, i) => (
          <div
            key={i}
            className="showdown-scrubber__extra-zone"
            style={{
              left:  `${r.startPct}%`,
              width: `${r.endPct - r.startPct}%`,
            }}
          />
        ))}

        {/* Thumb */}
        <div
          className="showdown-scrubber__thumb"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* ── Speed buttons — below track ───────────────────────────────── */}
      <div className="showdown-scrubber__speeds">
        {[1, 2, 4].map(s => (
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
  )
}
