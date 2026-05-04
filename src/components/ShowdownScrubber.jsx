import { useRef, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './ShowdownScrubber.css'

const SOX_FILL    = 'rgba(210,50,60,0.88)'
const NYY_FILL    = 'rgba(20,50,105,0.88)'
const ORANGE_FILL = 'rgba(232,124,42,0.88)'
const FUTURE      = 'rgba(255,255,255,0.06)'

const RESULT_SHORT = {
  K:'K', W:'BB', IW:'IBB', HP:'HBP',
  S:'1B', D:'2B', T:'3B', HR:'HR',
  OUT:'OUT', DP:'GDP', SF:'SAC', SH:'SAC',
  E:'E', FC:'FC', SB:'SB', CS:'CS',
  WP:'WP', PB:'PB', BK:'BK',
}

export default function ShowdownScrubber({
  plays, games, gameStarts, position,
  onSeek,
  extraZones = [], highlights = [],
}) {
  const trackRef = useRef(null)
  const dragging = useRef(false)
  const total    = plays.length
  const pct      = total > 1 ? (position / (total - 1)) * 100 : 0

  // ── Game segments ─────────────────────────────────────────────────────────
  const segments = useMemo(() => {
    const entries = Object.entries(gameStarts)
      .map(([g, idx]) => [Number(g), idx])
      .sort((a, b) => a[0] - b[0])

    return entries.map(([gNum, startIdx], i) => {
      const endIdx   = entries[i + 1]?.[1] ?? total
      const game     = games[gNum - 1]
      const winner   = game?.winner ?? 'NYY'
      const startPct = (startIdx / (total - 1)) * 100
      const endPct   = (Math.min(endIdx, total) / (total - 1)) * 100
      const played   = position >= startIdx
      const complete = endIdx >= total ? position >= total - 1 : position >= endIdx
      const active   = played && !complete
      return { gNum, startIdx, endIdx, startPct, endPct, winner, played, complete, active }
    })
  }, [gameStarts, games, total, position])

  // ── Extra-inning zones ────────────────────────────────────────────────────
  const extraRects = useMemo(() => extraZones.map(({ start, end }) => ({
    startPct: (start / (total - 1)) * 100,
    endPct:   (Math.min(end + 1, total - 1) / (total - 1)) * 100,
  })), [extraZones, total])

  // ── Track interaction ─────────────────────────────────────────────────────
  const posFromEvent = useCallback((e) => {
    const track = trackRef.current
    if (!track) return position
    const rect    = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const ratio   = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
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

  return (
    <div className="showdown-scrubber">

      {/* ── Controls: prev / label / next ────────────────────────────── */}
      <div className="showdown-scrubber__controls">

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
        <div className="showdown-scrubber__track-inner">

          {segments.map((seg, i) => {
            const GAP   = 0.5
            const start = seg.startPct + (i === 0 ? 0 : GAP / 2)
            const end   = seg.endPct   - (i === segments.length - 1 ? 0 : GAP / 2)
            const width = Math.max(0, end - start)

            const bg = !seg.played
              ? FUTURE
              : seg.active
                ? ORANGE_FILL
                : (seg.winner === 'BOS' ? SOX_FILL : NYY_FILL)

            const shadow = seg.active
              ? '0 0 10px rgba(232,124,42,0.65), 0 0 22px rgba(232,124,42,0.28)'
              : 'none'

            return (
              <div
                key={seg.gNum}
                className="showdown-scrubber__segment"
                style={{ left: `${start}%`, width: `${width}%`, background: bg, boxShadow: shadow }}
              />
            )
          })}

          <div
            className="showdown-scrubber__fill-highlight"
            style={{ width: `${pct}%` }}
          />

          {extraRects.map((r, i) => (
            <div
              key={i}
              className="showdown-scrubber__extra-zone"
              style={{ left: `${r.startPct}%`, width: `${r.endPct - r.startPct}%` }}
            />
          ))}

        </div>

        {/* Highlight moment dots */}
        {highlights.map(h => {
          const hPct = (h.idx / (total - 1)) * 100
          return (
            <button
              key={h.idx}
              className={`showdown-scrubber__highlight showdown-scrubber__highlight--${h.intensity}`}
              style={{ left: `${hPct}%` }}
              onClick={(e) => { e.stopPropagation(); onSeek(h.idx) }}
              title={h.label}
              aria-label={h.label}
            />
          )
        })}

        {/* Thumb */}
        <div
          className="showdown-scrubber__thumb"
          style={{ left: `${pct}%` }}
        />
      </div>

    </div>
  )
}
