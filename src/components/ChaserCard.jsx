/**
 * ChaserCard — A record in reach, shown on the /live chaser strip.
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

// How close = "could happen tonight": distance ≤ 1 typical game output
function couldHappenTonight({ variant, current, target, singleGameOutput, isPlaying, statDir }) {
  if (!isPlaying) return false
  if (variant === 'uncharted') return false  // no finish line to approach
  const distance = statDir === 'lower-is-better'
    ? current - target
    : target - current
  return distance <= singleGameOutput && distance > 0
}

function formatNumber(n) {
  if (n == null) return '—'
  if (n >= 1000) return n.toLocaleString()
  // ERA-style: show two decimals
  if (n < 10 && !Number.isInteger(n)) return n.toFixed(2)
  return n.toString()
}

function progressPercent({ current, target, statDir }) {
  if (!target) return null
  if (statDir === 'lower-is-better') {
    // 0% = at the record, 100% = at start (invert so bar fills as they approach)
    // We show how far THROUGH the journey they are, not how far remaining
    // Keep it simple: distance remaining as a fraction of some baseline
    // For now: fill = (baseline - current) / baseline, capped at 95%
    const baseline = target * 4  // rough starting point
    return Math.min(95, Math.max(5, ((baseline - current) / baseline) * 100))
  }
  // For regular stats: current / target * 100, cap at 98% until they hit it
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

      {/* Tonight pill */}
      {tonight && (
        <div className="chaser-card__tonight-pill" aria-label="Could happen tonight">
          TONIGHT
        </div>
      )}

      {/* Header */}
      <div className="chaser-card__header">
        <span className="chaser-card__number">#{number}</span>
        <span className="chaser-card__lens">{lens}</span>
      </div>

      {/* Player + team */}
      <div className="chaser-card__player">
        <span className="chaser-card__player-name">{player}</span>
        <span className="chaser-card__team">{team}</span>
      </div>

      {/* ── Record-approach variant ────────────────────────────────── */}
      {variant === 'record-approach' && (
        <>
          <div className="chaser-card__stat-row">
            <div className="chaser-card__stat-block">
              <span className="chaser-card__stat-value">{formatNumber(current)}</span>
              <span className="chaser-card__stat-label">{stat}</span>
            </div>
            {distance != null && (
              <div className="chaser-card__distance">
                <span className="chaser-card__distance-value">
                  {statDir === 'lower-is-better' ? '−' : '+'}{formatNumber(Math.abs(distance))}
                </span>
                <span className="chaser-card__distance-label">to go</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {pct != null && (
            <div className="chaser-card__bar-wrap" role="meter" aria-valuenow={current} aria-valuemax={target}>
              <div className="chaser-card__bar-track">
                <div
                  className="chaser-card__bar-fill"
                  style={{ width: `${pct}%` }}
                />
                {/* Dot at the tip */}
                <div
                  className="chaser-card__bar-dot"
                  style={{ left: `${pct}%` }}
                />
              </div>
              {targetLabel && (
                <span className="chaser-card__target-label">{targetLabel}</span>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Uncharted variant ─────────────────────────────────────── */}
      {variant === 'uncharted' && (
        <>
          <div className="chaser-card__stat-row">
            <div className="chaser-card__stat-block">
              <span className="chaser-card__stat-value">{formatNumber(current)}</span>
              <span className="chaser-card__stat-label">{stat}</span>
            </div>
          </div>
          <div className="chaser-card__uncharted-bar-wrap">
            <div className="chaser-card__uncharted-track">
              <div className="chaser-card__uncharted-fill" />
              <div className="chaser-card__uncharted-dot" />
              <span className="chaser-card__uncharted-horizon">∞</span>
            </div>
          </div>
          {contextLine && (
            <p className="chaser-card__context">{contextLine}</p>
          )}
        </>
      )}

      {/* Playing indicator */}
      {isPlaying && (
        <div className="chaser-card__playing">
          <span className="chaser-card__playing-dot" aria-hidden="true" />
          <span className="chaser-card__playing-label">Playing tonight</span>
        </div>
      )}

    </article>
  )
}
