import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import { Award, Check, ExternalLink, X, ArrowRight } from 'lucide-react'
import { getSportIcon } from '../data/sports.js'
import { TIER_RANK, TIER_DESC } from '../data/tiers.js'
import { getHeatStyle, getTileTextColor } from '../data/index.js'
import { pickKey } from '../lib/storageKeys.js'
import associationsData from '../data/associations.json'
import './PlayerPanel.css'

// Players with a full-career Legend Timeline. Name-matched (case-insensitive).
// When a card renders for one of these, show a "View career timeline" CTA.
const TIMELINE_PLAYERS = {
  'tom brady': 'brady_tom',
}

// Group debates by number — multiple debates can share a number (e.g. #7 global + #7 Soccer)
const ASSOC_MAP = {}
associationsData.forEach(a => {
  const key = String(a.number)
  if (!ASSOC_MAP[key]) ASSOC_MAP[key] = []
  ASSOC_MAP[key].push(a)
})

// Pick the right debate given wall + sport filter context.
// Rules:
//   1. Filter to debates scoped to this wall first.
//   2. Sport tab active → exact sport match only (no cross-sport on a sport tab).
//   3. All tab → cross-sport (sport: null) debates only.
//   4. No match at any step → null (crowd pick with all legends).
function pickAssoc(assocList, sportFilter, wallId = 'global') {
  if (!assocList || assocList.length === 0) return null
  const wallDebates = assocList.filter(a => a.wall === wallId)
  if (wallDebates.length === 0) return null
  const activeSport = sportFilter ? [...sportFilter][0] : null
  if (activeSport) {
    return wallDebates.find(a => a.sport === activeSport) ?? null
  }
  return wallDebates.find(a => a.sport === null) ?? null
}

// Tier sort order + descriptions imported from data/tiers.js (single source of truth)

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

// Sport icons imported from data/sports.js (single source of truth)

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
// Exported so the Design System page can render the real card (reuse discipline —
// the DS must mirror the build, not a parallel sketch).
export function PlayerCard({ entry, isTop = false }) {
  const navigate       = useNavigate()
  const SportIcon      = getSportIcon(entry.sport) || Award
  const showStat       = Boolean(entry.stat) && (entry.tier === 'LEGEND' || entry.tier === 'SACRED')
  const teamAccent     = TEAM_ACCENT[entry.team] ?? null
  const teamBadgeStyle = teamAccent
    ? { background: teamAccent.bg, borderColor: teamAccent.border, color: teamAccent.text }
    : {}
  const timelineId     = TIMELINE_PLAYERS[(entry.name || '').toLowerCase()]

  return (
    <div className={`player-card${isTop ? ' player-card--top' : ''}`}>
      <div className="player-card__row">

        <div className="player-card__info">
          <div className="player-card__name-row">
            <span className="player-card__name">{entry.name} <SportIcon size={12} className="player-card__sport-icon" aria-label={entry.sport} /></span>
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

      {timelineId && (
        <a
          className="player-card__timeline-cta"
          href={`/timeline/${timelineId}`}
          onClick={(e) => {
            // React Router's navigate() is the only reliable way to move
            // without a full reload. The earlier pushState + PopStateEvent
            // hack didn't update the router's internal state, which left
            // the PlayerPanel overlay on top of an empty body — the "wall
            // goes dark" bug.
            e.preventDefault()
            try { track('timeline_open_from_card', { player: entry.name }) } catch {}
            navigate(`/timeline/${timelineId}`)
          }}
        >
          <span>View his career timeline</span>
          <ArrowRight size={14} />
        </a>
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
    const raw = localStorage.getItem(pickKey(number))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function savePick(number, idx) {
  try {
    localStorage.setItem(pickKey(number), JSON.stringify({ idx, ts: Date.now() }))
  } catch {}
}

// clearPick retained for future use (e.g. admin/debug tools) but not exposed in UI.
// Pick is permanent by design — prevents vote inflation from reset/re-vote loops.
function clearPick(number) { // eslint-disable-line no-unused-vars
  try { localStorage.removeItem(pickKey(number)) } catch {}
}

// Last name only for compact chips
function shortName(name) {
  const parts = (name || '').trim().split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : name
}

// Graded amber by rank position — rank 0 (leader) = full amber, steps down.
// Applied as inline color so each label feels like a heat reading, not just white text.
const RANK_ORANGE = [
  'rgba(232, 124, 42, 1.00)',  // rank 1 — full amber
  'rgba(232, 124, 42, 0.70)',  // rank 2
  'rgba(232, 124, 42, 0.50)',  // rank 3
  'rgba(232, 124, 42, 0.36)',  // rank 4
  'rgba(232, 124, 42, 0.26)',  // rank 5
  'rgba(232, 124, 42, 0.20)',  // rank 6+
]
function rankOrange(i) {
  return RANK_ORANGE[Math.min(i, RANK_ORANGE.length - 1)]
}

// ─── YourNumberPick ───────────────────────────────────────────────────────────
// Unified "who owns this number?" mechanic — handles both curated head-to-heads
// (when assoc is provided) and open crowd picks (all visible legends).
//
// With assoc:    2-chip debate, seeds from assoc.seedVotes, wall note post-pick.
// Without assoc: all-legend chips, auto-seeded by rank, crowd message post-pick.
// Same UI, same storage key — one component, two data sources.

function YourNumberPick({ number, legends, assoc, leadIdx = 0 }) {
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

  // Build unified options list — either the 2 curated players or all visible legends
  const options = assoc ? assoc.options.map(opt => ({ name: opt.name })) : legends
  if (options.length < 2) return null

  // Seed votes — from assoc data or auto-generated by rank
  const seeds = assoc
    ? assoc.options.map(opt => assoc.seedVotes[opt.id] ?? 0)
    : autoSeedVotes(legends)

  function handlePick(idx) {
    if (pick || tapping !== null) return
    setTapping(idx)
    setTimeout(() => {
      savePick(number, idx)
      setPick({ idx, ts: Date.now() })
      if (assoc) {
        const pickedName     = assoc.options[idx]?.name ?? ''
        const agreedWithWall = assoc.options[idx]?.id === assoc.wallCall
        track('debate_vote', { number, picked: pickedName, agreedWithWall })
      } else {
        track('your_number_pick', { number, picked: legends[idx]?.name })
      }
      setTimeout(() => { setRevealed(true); setTapping(null) }, 160)
    }, 340)
  }

  const pickedIdx = pick?.idx ?? null
  const votes     = seeds.map((s, i) => s + (pickedIdx === i ? 1 : 0))
  const total     = votes.reduce((a, b) => a + b, 0)
  const pcts      = votes.map(v => Math.round((v / total) * 100))

  // Post-pick note — wall editorial (debate) or crowd scoreboard (open pick)
  function postPickNote() {
    if (pickedIdx === null) return null
    if (assoc) {
      const wallAgrees = assoc.options[pickedIdx]?.id === assoc.wallCall
      return (
        <>
          <span className="your-pick__wall-verdict">
            {wallAgrees ? 'THE WALL AGREES · ' : 'THE WALL DIFFERS · '}
          </span>
          {assoc.wallNote}
        </>
      )
    }
    // Crowd message — scoreboard voice
    const leaderPct  = pcts[0]
    const yourPct    = pcts[pickedIdx]
    const gap        = leaderPct - yourPct
    const leaderName = shortName(legends[0].name)
    if (pickedIdx === 0) {
      if (leaderPct >= 70) return `${leaderName} — ${leaderPct}% of the wall.`
      if (leaderPct >= 57) return `${leaderName} leads. ${100 - leaderPct}% push back.`
      return `No clear owner. Split.`
    }
    const yourName = shortName(legends[pickedIdx].name)
    if (gap >= 35) return `${leaderName} leads this one. You're with ${yourPct}%.`
    if (gap >= 18) return `${leaderName} leads. ${yourName} has ${yourPct}%.`
    if (gap >= 6)  return `${gap}% gap. Closer than it looks.`
    return gap > 0 ? `${gap}% gap.` : `Split.`
  }

  // Split bar — all amber, no blue. Leading option gets full amber, trailing is dim.
  function barStyle(i) {
    const isLeader = i === leadIdx
    return {
      background: isLeader ? 'rgba(232,124,42,0.80)' : 'rgba(255,255,255,0.10)',
      opacity:    i === pickedIdx ? 1 : 0.55,
    }
  }

  return (
    <div className="your-pick">
      {!revealed && (
        <>
          <span className="your-pick__label">WHO REALLY OWNS THIS NUMBER?</span>
          <div className="your-pick__chips">
            {options.map((opt, i) => (
              <button
                key={i}
                className={[
                  'your-pick__chip',
                  i === leadIdx                     && 'your-pick__chip--top',
                  tapping === i                     && 'your-pick__chip--tapping',
                  tapping !== null && tapping !== i && 'your-pick__chip--fading',
                ].filter(Boolean).join(' ')}
                onClick={() => handlePick(i)}
                disabled={tapping !== null}
              >
                {shortName(opt.name)}
              </button>
            ))}
            <a
              className="your-pick__nominate"
              href="https://forms.gle/FdUYZoLakEYm9GiK8"
              target="_blank"
              rel="noopener noreferrer"
            >
              + missing someone?
            </a>
          </div>
        </>
      )}

      {revealed && pickedIdx !== null && (
        <div className="your-pick__result">
          <div className="your-pick__your-call">
            <span className="your-pick__your-call-label">YOUR PICK</span>
            <span className="your-pick__your-call-name">{options[pickedIdx]?.name}</span>
          </div>

          <div className="your-pick__split">
            <div className="your-pick__split-bar">
              {options.map((_, i) => (
                <div
                  key={i}
                  className="your-pick__split-fill"
                  style={{ width: `${pcts[i]}%`, ...barStyle(i) }}
                />
              ))}
            </div>
            <div className="your-pick__split-labels">
              {options.map((opt, i) => (
                pcts[i] >= 5 ? (
                  <span
                    key={i}
                    className={[
                      'your-pick__split-pct',
                      i === pickedIdx && 'your-pick__split-pct--yours',
                    ].filter(Boolean).join(' ')}
                    style={{ color: assoc ? undefined : rankOrange(i) }}
                  >
                    {pcts[i]}% {shortName(opt.name)}
                  </span>
                ) : null
              ))}
            </div>
          </div>

          <p className="your-pick__wall-note">{postPickNote()}</p>
          {assoc && (
            <p className="your-pick__vote-count">{total.toLocaleString()} picks</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Swipe-down-to-close hook (mobile bottom sheet) ──────────────────────────
// Tracks vertical touch drag on the panel. If user swipes down > threshold,
// fires onClose. Applies live translateY during drag for rubber-band feel.
function useSwipeDown(panelRef, onClose) {
  const startY  = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

  const onTouchStart = useCallback((e) => {
    // Only enable swipe when panel is scrolled to top (not mid-scroll)
    const el = panelRef.current
    if (!el || el.scrollTop > 5) return
    startY.current = e.touches[0].clientY
    currentY.current = startY.current
    dragging.current = true
    el.style.transition = 'none'
  }, [panelRef])

  const onTouchMove = useCallback((e) => {
    if (!dragging.current) return
    currentY.current = e.touches[0].clientY
    const dy = currentY.current - startY.current
    if (dy > 0) {
      // Dragging down — apply dampened translateY
      const dampened = Math.min(dy * 0.6, 200)
      panelRef.current.style.transform = `translateY(${dampened}px)`
    }
  }, [panelRef])

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    const dy = currentY.current - startY.current
    const el = panelRef.current
    if (!el) return

    // Restore transition for snap-back or close
    el.style.transition = ''

    if (dy > 80) {
      // Swipe was far enough — close
      el.style.transform = 'translateY(100%)'
      setTimeout(onClose, 200)
    } else {
      // Snap back
      el.style.transform = ''
    }
  }, [panelRef, onClose])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    // Only attach on mobile
    if (window.matchMedia('(min-width: 768px)').matches) return

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  })
}

// ─── PlayerPanel ─────────────────────────────────────────────────────────────
export default function PlayerPanel({ selected, onClear, mode = 'default', sportFilter = null, wallId = 'global' }) {
  const [copied, setCopied] = useState(false)
  const panelRef = useRef(null)
  useSwipeDown(panelRef, onClear)

  const hasSelection = Boolean(selected)
  const entries      = selected?.entries ?? []
  const number       = selected?.number  ?? null
  const assocList    = number ? (ASSOC_MAP[String(number)] ?? []) : []
  const assoc        = pickAssoc(assocList, sportFilter, wallId)

  // Which debate option leads by seed votes — shared by YourNumberPick and card stack
  const panelLeadIdx = assoc
    ? ((assoc.seedVotes[assoc.options[0]?.id] ?? 0) >= (assoc.seedVotes[assoc.options[1]?.id] ?? 0) ? 0 : 1)
    : 0

  // Cards sort by tier + stat weight — independent of the debate.
  // The debate asks a contextual question; the cards show the global legend ranking.
  const legends = sortLegends(entries.filter(e => e.tier !== 'UNWRITTEN'))

  const isSacred    = legends.some(e => e.tier === 'SACRED')
  const heat        = getHeatStyle(legends, isSacred)
  const numberColor = getTileTextColor(legends, isSacred)
  const numberGlow  = `0 0 28px ${heat.border}`

  const legendCount = legends.length

  const subtitle = legendCount === 0
    ? 'UNWRITTEN'
    : mode === 'current'
      ? null
      : legendCount === 1
        ? '1 LEGEND WORE THIS NUMBER'
        : `${legendCount} LEGENDS WORE #${number}`

  function handleShare() {
    track('player_share', { number })
    shareNumber(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <aside ref={panelRef} className={`player-panel${!hasSelection ? ' player-panel--idle' : ''}`}>

      <div className="player-panel__handle" aria-hidden="true" />

      <div className="player-panel__inner">

        {/* ── Idle state ─────────────────────────────────── */}
        {!hasSelection && (
          <div className="player-panel__idle">
            <svg className="player-panel__idle-jersey" viewBox="0 0 496 359" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M265.686 351H141.686C137.268 351 133.686 347.418 133.686 343V162.314C133.686 155.186 125.069 151.617 120.029 156.657L77.8431 198.843C74.7189 201.967 69.6536 201.967 66.5294 198.843L10.3431 142.657C7.21894 139.533 7.21894 134.467 10.3431 131.343L131.343 10.3431C132.843 8.84285 134.878 8 137 8H194.873C196.994 8 199.029 8.84286 200.529 10.3431L239.029 48.8431C242.154 51.9673 247.219 51.9673 250.343 48.8431L288.843 10.3431C290.343 8.84285 292.378 8 294.5 8H358.873C360.994 8 363.029 8.84285 364.529 10.3431L485.529 131.343C488.654 134.467 488.654 139.533 485.529 142.657L429.343 198.843C426.219 201.967 421.154 201.967 418.029 198.843L375.843 156.657C370.803 151.617 362.186 155.186 362.186 162.314V343C362.186 347.418 358.605 351 354.186 351H307.186" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
              <path d="M32.1863 120.5L91.6863 181M50.6863 99L110.186 159.5" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
              <path d="M466.186 120.5L406.686 181M447.686 99L388.186 159.5" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
              <path d="M214.506 142C213.946 146.16 212.026 151.36 208.746 157.6C205.466 163.76 201.546 169.96 196.986 176.2C192.506 182.36 188.306 187.44 184.386 191.44H208.146V174.28C210.626 170.76 213.146 166.6 215.706 161.8C218.266 157 219.946 153.04 220.746 149.92H230.946V191.44H242.466V209.08H230.946V226H208.146V209.08H167.946V191.2C172.266 184.96 176.546 177.4 180.786 168.52C185.026 159.64 188.426 150.8 190.986 142H214.506ZM286.745 142C293.225 142 298.825 143.04 303.545 145.12C308.345 147.12 312.025 150 314.585 153.76C317.225 157.52 318.545 161.88 318.545 166.84C318.545 171.48 317.385 175.68 315.065 179.44C312.745 183.2 309.825 186.52 306.305 189.4C302.785 192.28 297.945 195.8 291.785 199.96C288.345 202.2 285.545 204.12 283.385 205.72H319.505V226H251.105V220.24C251.105 216 252.065 212.24 253.985 208.96C255.985 205.6 258.865 202.24 262.625 198.88C266.465 195.52 271.985 190.96 279.185 185.2C284.945 180.64 288.985 177.16 291.305 174.76C293.625 172.36 294.785 170 294.785 167.68C294.785 165.2 293.905 163.12 292.145 161.44C290.465 159.76 287.905 158.92 284.465 158.92C280.865 158.92 278.025 159.96 275.945 162.04C273.865 164.12 272.825 166.84 272.825 170.2V172.6H251.465C251.385 171.96 251.345 171.08 251.345 169.96C251.345 161.32 254.345 154.52 260.345 149.56C266.425 144.52 275.225 142 286.745 142Z" fill="currentColor"/>
              <path d="M137.186 317H324.686" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
            </svg>
            <div className="player-panel__idle-wall">PICK A NUMBER.</div>
            <div className="player-panel__idle-prompt">Every number has an owner. Find out who.</div>
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
                {(() => {
                  const retiredEntry = legends.find(e => e.leagueWideRetired && e.retiredBadge)
                  return retiredEntry ? (
                    <div className="player-panel__retired-badge">{retiredEntry.retiredBadge}</div>
                  ) : null
                })()}
              </div>

              <div className="player-panel__header-actions">
                <button
                  className={`player-panel__share${copied ? ' player-panel__share--copied' : ''}`}
                  onClick={handleShare}
                  aria-label={`Share #${number}`}
                >
                  {copied ? <Check size={14} /> : <ExternalLink size={14} />}
                </button>
                <button className="player-panel__close" onClick={onClear} aria-label="Close panel">
                  <X size={14} />
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

            {/* ── Who owns this number? ──
                 Sport filter active + debate exists → full vote mechanic.
                 Sport filter active + no debate but 2+ legends → crowd pick.
                 ALL view + contested → light "contested" nudge, no vote. */}
            {sportFilter && sportFilter.size > 0 && (assoc || (!isSacred && legendCount >= 2)) && (
              <YourNumberPick number={number} legends={legends} assoc={assoc} leadIdx={panelLeadIdx} />
            )}
            {(!sportFilter || sportFilter.size === 0) && !isSacred && legendCount >= 2 && (
              <div className="player-panel__contested">
                <span className="player-panel__contested-label">CONTESTED</span>
                <span className="player-panel__contested-hint">
                  {legendCount} legends wore #{number}. Filter by sport to debate who owns it.
                </span>
              </div>
            )}

            {/* ── Legend cards ─────────────────────────────────── */}
            {legendCount > 0 && (
              <div className="player-panel__cards">
                {legends.map((entry, i) => (
                  <PlayerCard key={`${entry.name}-${i}`} entry={entry} isTop={i === 0} />
                ))}
                <a
                  className="player-panel__add-legend"
                  href={`mailto:dan@thenumberwall.com?subject=Add a Legend — %23${number}`}
                >
                  + Add a Legend
                </a>
              </div>
            )}
          </>
        )}

      </div>
    </aside>
  )
}
