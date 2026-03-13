import { useState } from 'react'
import { track } from '@vercel/analytics'
import { getHeatStyle, getTileTextColor } from '../data/index.js'
import './PlayerPanel.css'

// ─── Team accent colors ───────────────────────────────────────────────────────
const TEAM_ACCENT = {
  'Boston Red Sox':       { bg: 'rgba(255,58,74,0.15)',  border: 'rgba(255,58,74,0.40)',  text: '#FF3A4A' },
  'Boston Celtics':       { bg: 'rgba(0,224,90,0.12)',   border: 'rgba(0,224,90,0.38)',   text: '#00E05A' },
  'Boston Bruins':        { bg: 'rgba(255,211,64,0.12)', border: 'rgba(255,211,64,0.38)', text: '#FFD340' },
  'New England Patriots': { bg: 'rgba(74,140,255,0.12)', border: 'rgba(74,140,255,0.38)', text: '#4A8CFF' },
  'Boston Patriots':      { bg: 'rgba(74,140,255,0.12)', border: 'rgba(74,140,255,0.38)', text: '#4A8CFF' },
}

const SPORT_ICON = {
  Basketball: '🏀',
  Football:   '🏈',
  Baseball:   '⚾',
  Hockey:     '🏒',
  Soccer:     '⚽',
}

// ─── Share helper ─────────────────────────────────────────────────────────────
function shareNumber(number) {
  const url = `${window.location.origin}${window.location.pathname}#${number}`
  if (navigator.share) {
    navigator.share({ title: `#${number} — The Number Wall`, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).catch(() => {})
  }
}

// ─── PlayerCard ──────────────────────────────────────────────────────────────
function PlayerCard({ entry }) {
  const icon        = SPORT_ICON[entry.sport] || '🏅'
  const showStat    = Boolean(entry.stat) && (entry.tier === 'LEGEND' || entry.tier === 'SACRED')
  const teamAccent  = TEAM_ACCENT[entry.team] ?? null
  const teamBadgeStyle = teamAccent
    ? { background: teamAccent.bg, borderColor: teamAccent.border, color: teamAccent.text }
    : {}

  return (
    <div className="player-card">
      <div className="player-card__row">

        <div className="player-card__info">
          {/* Name + sport icon inline */}
          <div className="player-card__name-row">
            <span className="player-card__name">{entry.name}</span>
            <span className="player-card__sport-icon" aria-label={entry.sport}>{icon}</span>
          </div>

          <div className="player-card__badges">
            {/* Team first, then position */}
            {entry.team && (
              <span className="player-card__badge" style={teamBadgeStyle}>{entry.team}</span>
            )}
            {entry.role && (
              <span className="player-card__badge player-card__badge--dim">{entry.role}</span>
            )}
          </div>
        </div>

        {/* Stat — white, fixed width, overflow safe */}
        {showStat && (
          <div className="player-card__stat">
            <div className="player-card__stat-value">{entry.stat}</div>
            <div className="player-card__stat-label">{entry.statLabel}</div>
          </div>
        )}

      </div>

      {entry.funFact && (
        <div className="player-card__fact">{entry.funFact}</div>
      )}
    </div>
  )
}

// ─── PlayerPanel ─────────────────────────────────────────────────────────────
export default function PlayerPanel({ selected, onClear, mode = 'default' }) {
  const [copied, setCopied] = useState(false)

  const hasSelection = Boolean(selected)
  const entries      = selected?.entries ?? []
  const number       = selected?.number  ?? null

  const legends     = entries.filter(e => e.tier !== 'UNWRITTEN')
  const isSacred    = legends.some(e => e.tier === 'SACRED')
  const heat        = getHeatStyle(legends, isSacred)
  const numberColor = getTileTextColor(legends, isSacred)
  const numberGlow  = `0 0 28px ${heat.border}`

  const legendCount = legends.length

  // Subtitle: legends wall shows count; current roster shows nothing (it's obvious); unwritten stays
  const subtitle = legendCount === 0
    ? 'UNWRITTEN'
    : mode === 'current'
      ? null
      : `${legendCount} LEGEND${legendCount !== 1 ? 'S' : ''} WORE THIS`

  function handleShare() {
    track('player_share', { number })
    shareNumber(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <aside className={`player-panel${!hasSelection ? ' player-panel--idle' : ''}`}>

      <div className="player-panel__handle" aria-hidden="true" />

      <div className="player-panel__inner">

        {/* ── Idle state ─────────────────────────────────── */}
        {!hasSelection && (
          <div className="player-panel__idle">
            <svg className="player-panel__idle-jersey" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M45 8 L18 24 L27 46 L38 38 L38 100 L82 100 L82 38 L93 46 L102 24 L75 8 Q68 20 60 20 Q52 20 45 8Z" fill="currentColor" />
            </svg>
            <div className="player-panel__idle-wall">THE NUMBER WALL</div>
            <div className="player-panel__idle-prompt">TAP A NUMBER.</div>
          </div>
        )}

        {/* ── Selected state ─────────────────────────────── */}
        {hasSelection && (
          <>
            <div className="player-panel__header">
              <div className="player-panel__header-left">
                <div className="player-panel__number" style={{ color: numberColor, textShadow: numberGlow }}>
                  #{number}
                </div>
                {subtitle && <div className="player-panel__subtitle">{subtitle}</div>}
              </div>

              <div className="player-panel__header-actions">
                <button
                  className={`player-panel__share${copied ? ' player-panel__share--copied' : ''}`}
                  onClick={handleShare}
                  aria-label={`Share #${number}`}
                >
                  {copied ? '✓ COPIED' : '↗ SHARE'}
                </button>
                <button className="player-panel__close" onClick={onClear} aria-label="Close panel">
                  ✕ CLOSE
                </button>
              </div>
            </div>

            {isSacred && (
              <div className="player-panel__sacred-badge">RETIRED LEAGUE-WIDE</div>
            )}

            {legendCount === 0 && (
              <div className="player-panel__unwritten">
                <div className="player-panel__unwritten-line">No legend has claimed this number yet.</div>
                <div className="player-panel__unwritten-sub">This could be your story.</div>
                <a className="player-panel__unwritten-cta" href="mailto:dan@thenumberwall.com?subject=Missing%20Legend">
                  Submit a legend →
                </a>
              </div>
            )}

            {legendCount > 0 && (
              <div className="player-panel__cards">
                {legends.map((entry, i) => (
                  <PlayerCard key={`${entry.name}-${i}`} entry={entry} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </aside>
  )
}
