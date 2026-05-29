/**
 * ChaserCard — A record in reach, shown on the /live chaser strip.
 *
 * Layout: tile (left) + body (right) — the number cell is the hero.
 *
 * Two variants:
 *   "record-approach"  — known finish line (e.g. Gretzky's goals record)
 *   "uncharted"        — no ceiling, just distance from zero (e.g. LeBron points)
 *
 * Props:
 *   player           string   — player name
 *   number           number   — jersey number
 *   sport            string   — 'nhl' | 'nba' | 'mlb' | 'nfl'
 *   team             string   — team abbreviation
 *   stat             string   — stat label (e.g. 'Goals')
 *   variant          string   — 'record-approach' | 'uncharted'
 *   lens             string   — 'CAREER' | 'SEASON' | 'TONIGHT'
 *   current          number   — current value
 *   target           number?  — target value (record-approach only)
 *   targetLabel      string?  — human label for target (e.g. "Gretzky All-Time")
 *   contextLine      string?  — one-line framing for uncharted variant
 *   singleGameOutput number   — realistic max output in one game (for pill logic)
 *   isPlaying        boolean  — player is in tonight's lineup
 *   statDir          string?  — 'lower-is-better' for stats like ERA (default: higher)
 */

import './ChaserCard.css'

function couldHappenTonight({ variant, current, target, singleGameOutput, isPlaying, statDir }) {
  if (!isPlaying) return false
  if (variant === 'uncharted') return false
  const distance = statDir === 'lower-is-better'
    ? current - target
    : target - current
  return distance <= singleGameOutput && distance > 0
}

function formatNumber(n) {
  if (n == null) return '—'
  if (n >= 1000) return n.toLocaleString()
  if (n < 10 && !Number.isInteger(n)) return n.toFixed(2)
  return n.toString()
}

function progressPercent({ current, target, statDir }) {
  if (!target) return null
  if (statDir === 'lower-is-better') {
    const baseline = target * 4
    return Math.min(95, Math.max(5, ((baseline - current) / baseline) * 100))
  }
  return Math.min(98, (current / target) * 100)
}

export default function ChaserCard({
  player,
  number,
  sport,
  team,
  stat,
  variant = 'record-approach',
  lens = 'CAREER',
  current,
  target,
  targetLabel,
  contextLine,
  singleGameOutput,
  isPlaying = false,
  statDir,
}) {
  const tonight = couldHappenTonight({ variant, current, target, singleGameOutput, isPlaying, statDir })
  const pct     = variant === 'record-approach' ? progressPercent({ current, target, statDir }) : null

  const distance = (variant === 'record-approach' && target != null)
    ? (statDir === 'lower-is-better' ? current - target : target - current)
    : null

  return (
    <article className={`chaser-card chaser-card--${variant}${tonight ? ' chaser-card--tonight' : ''}`}>

      {/* ── Tile — the wall DNA ──────────────────────────────────── */}
      <div className="chaser-card__tile" aria-hidden="true">
        <span className="chaser-card__tile-num">{number}</span>
        {tonight && <span className="chaser-card__tile-dot" />}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="chaser-card__body">

        <div className="chaser-card__top">
          <span className="chaser-card__player">{player}</span>
          <span className="chaser-card__lens">{lens}</span>
        </div>

        {/* Progress bar — record-approach */}
        {variant === 'record-approach' && pct != null && (
          <div
            className="chaser-card__bar-track"
            role="meter"
            aria-valuenow={current}
            aria-valuemax={target}
            aria-label={`${stat}: ${formatNumber(current)} of ${formatNumber(target)}`}
          >
            <div className="chaser-card__bar-fill" style={{ width: `${pct}%` }} />
            <div className="chaser-card__bar-dot"  style={{ left:  `${pct}%` }} />
          </div>
        )}

        {/* Infinite bar — uncharted */}
        {variant === 'uncharted' && (
          <div className="chaser-card__bar-track chaser-card__bar-track--uncharted" aria-label={`${stat}: ${formatNumber(current)}, no ceiling`}>
            <div className="chaser-card__uncharted-fill" />
            <div className="chaser-card__uncharted-dot"  />
            <span className="chaser-card__horizon">∞</span>
          </div>
        )}

        <div className="chaser-card__footer">
          <span className="chaser-card__stat-val">{formatNumber(current)} {stat}</span>
          {distance != null && (
            <span className="chaser-card__to-go">
              {statDir === 'lower-is-better' ? '−' : '+'}{formatNumber(Math.abs(distance))} to {targetLabel}
            </span>
          )}
          {variant === 'uncharted' && contextLine && (
            <span className="chaser-card__context">{contextLine}</span>
          )}
        </div>

      </div>
    </article>
  )
}
