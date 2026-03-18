import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics'
import { getHeatStyle, getTileTextColor } from '../data/index.js'
import associationsData from '../data/associations.json'
import './PlayerPanel.css'

// O(1) lookup: number string → association (for wallNote only)
const ASSOC_MAP = Object.fromEntries(associationsData.map(a => [String(a.number), a]))

// ─── Tier sort order ──────────────────────────────────────────────────────────
const TIER_RANK = { SACRED: 0, LEGEND: 1, CONDITIONAL: 2, ACTIVE: 3 }

function sortLegends(entries) {
  return [...entries].sort((a, b) => {
    const tierDiff = (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9)
    if (tierDiff !== 0) return tierDiff
    return (b.statWeight || 0) - (a.statWeight || 0)  // higher statWeight first
  })
}

// ─── Vote seed generator ──────────────────────────────────────────────────────
// Rank-based distribution so the top legend always leads the crowd.
// 1st: 60% · 2nd: 25% · 3rd: 10% · remainder ~2% each
const RANK_SHARES = [0.60, 0.25, 0.10, 0.03, 0.015, 0.01]
const SEED_BASE   = 480

function autoSeedVotes(sortedLegends) {
  return sortedLegends.map((_, i) => {
    const share = i < RANK_SHARES.length ? RANK_SHARES[i] : 0.005
    return Math.max(1, Math.round(SEED_BASE * share))
  })
}

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
  const icon           = SPORT_ICON[entry.sport] || '🏅'
  const showStat       = Boolean(entry.stat) && (entry.tier === 'LEGEND' || entry.tier === 'SACRED')
  const teamAccent     = TEAM_ACCENT[entry.team] ?? null
  const teamBadgeStyle = teamAccent
    ? { background: teamAccent.bg, borderColor: teamAccent.border, color: teamAccent.text }
    : {}

  return (
    <div className="player-card">
      <div className="player-card__row">

        <div className="player-card__info">
          <div className="player-card__name-row">
            <span className="player-card__name">{entry.name}</span>
            <span className="player-card__sport-icon" aria-label={entry.sport}>{icon}</span>
          </div>

          <div className="player-card__badges">
            {entry.team && (
              <span className="player-card__badge" style={teamBadgeStyle}>{entry.team}</span>
            )}
            {entry.role && (
              <span className="player-card__badge player-card__badge--dim">{entry.role}</span>
            )}
          </div>
        </div>

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

// ─── YourNumberPick ───────────────────────────────────────────────────────────
// Inline "who owns this number for you?" — lives at the bottom of the legends
// list. Works for any count ≥ 2. Auto-seeds votes from sort rank so the top
// legend always leads. No separate tab — the moment is part of the same view.

function getSavedPick(number) {
  try {
    const raw = localStorage.getItem(`nw_pick_${number}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function savePick(number, idx) {
  try {
    localStorage.setItem(`nw_pick_${number}`, JSON.stringify({ idx, ts: Date.now() }))
  } catch {}
}

// Last name only for compact chips
function shortName(name) {
  const parts = (name || '').trim().split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : name
}

function YourNumberPick({ number, legends, assoc }) {
  const saved                   = getSavedPick(number)
  const [pick, setPick]         = useState(saved)
  const [tapping, setTapping]   = useState(null)
  const [revealed, setRevealed] = useState(!!saved)

  useEffect(() => {
    const s = getSavedPick(number)
    setPick(s)
    setTapping(null)
    setRevealed(!!s)
  }, [number])

  if (legends.length < 2) return null

  const seeds = autoSeedVotes(legends)

  function handlePick(idx) {
    if (pick || tapping !== null) return
    setTapping(idx)
    setTimeout(() => {
      savePick(number, idx)
      setPick({ idx, ts: Date.now() })
      track('your_number_pick', { number, picked: legends[idx]?.name })
      setTimeout(() => {
        setRevealed(true)
        setTapping(null)
      }, 160)
    }, 340)
  }

  const pickedIdx = pick?.idx ?? null
  const votes     = seeds.map((s, i) => s + (pickedIdx === i ? 1 : 0))
  const total     = votes.reduce((a, b) => a + b, 0)
  const pcts      = votes.map(v => Math.round((v / total) * 100))

  const wallNote = assoc?.wallNote
    ?? `The wall's call: ${legends[0]?.name}.`

  return (
    <div className="your-pick">
      <div className="your-pick__divider" />

      {!revealed && (
        <>
          <span className="your-pick__label">WHO OWNS THIS NUMBER FOR YOU?</span>
          <div className="your-pick__chips">
            {legends.map((leg, i) => (
              <button
                key={i}
                className={[
                  'your-pick__chip',
                  tapping === i           && 'your-pick__chip--tapping',
                  tapping !== null && tapping !== i && 'your-pick__chip--fading',
                ].filter(Boolean).join(' ')}
                onClick={() => handlePick(i)}
                disabled={tapping !== null}
              >
                {shortName(leg.name)}
              </button>
            ))}
          </div>
        </>
      )}

      {revealed && pickedIdx !== null && (
        <div className="your-pick__result">
          <div className="your-pick__your-call">
            <span className="your-pick__your-call-label">YOUR PICK</span>
            <span className="your-pick__your-call-name">{legends[pickedIdx]?.name}</span>
          </div>

          <div className="your-pick__split">
            <div className="your-pick__split-bar">
              {legends.map((_, i) => (
                <div
                  key={i}
                  className="your-pick__split-fill"
                  style={{
                    width:   `${pcts[i]}%`,
                    opacity: i === pickedIdx ? 1 : 0.42,
                    background: i === 0
                      ? 'rgba(232, 124, 42, 0.85)'
                      : `rgba(232, 124, 42, ${0.55 - i * 0.08})`,
                  }}
                />
              ))}
            </div>
            <div className="your-pick__split-labels">
              {legends.map((leg, i) => (
                pcts[i] >= 5 ? (
                  <span
                    key={i}
                    className={[
                      'your-pick__split-pct',
                      i === pickedIdx && 'your-pick__split-pct--yours',
                    ].filter(Boolean).join(' ')}
                  >
                    {pcts[i]}% {shortName(leg.name)}
                  </span>
                ) : null
              ))}
            </div>
          </div>

          <p className="your-pick__wall-note">{wallNote}</p>
        </div>
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
  const assoc        = number ? ASSOC_MAP[String(number)] : null

  const legends     = sortLegends(entries.filter(e => e.tier !== 'UNWRITTEN'))
  const isSacred    = legends.some(e => e.tier === 'SACRED')
  const heat        = getHeatStyle(legends, isSacred)
  const numberColor = getTileTextColor(legends, isSacred)
  const numberGlow  = `0 0 28px ${heat.border}`

  const legendCount = legends.length

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

            {/* SACRED reads through the tile's blue glow — no badge here.
                "Retired league-wide" is only true for #42 (Robinson/MLB) and
                #99 (Gretzky/NHL). Brady, Hašek, Russell, Jordan, Parish are not.
                If we reinstate this, it needs a per-entry leagueWideRetired field. */}

            {/* ── Unwritten ────────────────────────────────── */}
            {legendCount === 0 && (
              <div className="player-panel__unwritten">
                <div className="player-panel__unwritten-line">No legend has claimed this number yet.</div>
                <div className="player-panel__unwritten-sub">This could be your story.</div>
                <a className="player-panel__unwritten-cta" href="mailto:dan@thenumberwall.com?subject=Missing%20Legend">
                  Submit a legend →
                </a>
              </div>
            )}

            {/* ── Legend cards + inline pick ────────────────── */}
            {legendCount > 0 && (
              <div className="player-panel__cards">
                {legends.map((entry, i) => (
                  <PlayerCard key={`${entry.name}-${i}`} entry={entry} />
                ))}
                <YourNumberPick number={number} legends={legends} assoc={assoc} />
              </div>
            )}
          </>
        )}

      </div>
    </aside>
  )
}
