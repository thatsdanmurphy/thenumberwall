import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import { Award, Check, Share2, X, ArrowRight } from 'lucide-react'
import { getSportIcon } from '../data/sports.js'
import { TIER_RANK, TIER_DESC } from '../data/tiers.js'
import { getHeatStyle, getTileTextColor } from '../data/index.js'
import { fetchWallScores, fetchMyVotes, castPlayerVote } from '../lib/playerVoteStore.js'
import VoteButtons from './VoteButtons.jsx'
import './PlayerPanel.css'

// Players with a full-career Legend Timeline. Name-matched (case-insensitive).
// When a card renders for one of these, show a "View career timeline" CTA.
const TIMELINE_PLAYERS = {
  'tom brady': 'brady_tom',
}

// Tier sort order + descriptions imported from data/tiers.js (single source of truth)

function sortLegends(entries) {
  return [...entries].sort((a, b) => {
    const tierDiff = (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9)
    if (tierDiff !== 0) return tierDiff
    return (b.statWeight || 0) - (a.statWeight || 0)  // higher statWeight first
  })
}

// ─── Team accent colors ───────────────────────────────────────────────────────
// Team accent colors removed — all teams render with the same neutral badge
// style on every wall. City walls can re-introduce team colors later as a
// per-wall feature, but the main wall should feel sport-neutral.

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
export function PlayerCard({ entry, isTop = false, voteData = null }) {
  const navigate       = useNavigate()
  const SportIcon      = getSportIcon(entry.sport) || Award
  const showStat       = Boolean(entry.stat) && (entry.tier === 'LEGEND' || entry.tier === 'SACRED')
  const teamBadgeStyle = {}
  const timelineId     = TIMELINE_PLAYERS[(entry.name || '').toLowerCase()]

  return (
    <div className={`player-card${isTop ? ' player-card--top' : ''}${voteData ? ' player-card--voting' : ''}`}>
      <div className="player-card__row">

        {/* ── Vote buttons (NYC mode) ──────────────────── */}
        {voteData && (
          <VoteButtons
            netScore={voteData.netScore}
            myVote={voteData.myVote}
            onVote={voteData.onVote}
            playerName={entry.name}
            number={entry.number}
            compact
          />
        )}

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

  // ── Internal voting state ──────────────────────────────────────────────────
  // Voting is opt-in: user taps "WHO OWNS THIS NUMBER?" to activate.
  // Panel fetches scores from Supabase when activated — no page-level wiring.
  const [votingActive, setVotingActive] = useState(false)
  const [voteScores,   setVoteScores]   = useState(null)  // Map: "number|name" → { netScore }
  const [myVotes,      setMyVotes]      = useState(null)   // Map: "number|name" → 1 | -1

  const hasSelection = Boolean(selected)
  const entries      = selected?.entries ?? []
  const number       = selected?.number  ?? null

  // Reset voting when number changes
  useEffect(() => {
    setVotingActive(false)
    setVoteScores(null)
    setMyVotes(null)
  }, [number])

  // Fetch vote data when voting is activated
  useEffect(() => {
    if (!votingActive || !number || wallId === 'none') return
    let stale = false
    Promise.all([
      fetchWallScores(wallId),
      fetchMyVotes(wallId),
    ]).then(([scores, mine]) => {
      if (!stale) { setVoteScores(scores); setMyVotes(mine) }
    }).catch(console.error)
    return () => { stale = true }
  }, [votingActive, wallId, number])

  // Vote callback — optimistic update + persist
  const handlePlayerVote = useCallback(async (voteNumber, playerName, direction) => {
    const key = `${voteNumber}|${playerName}`
    const currentVote = myVotes?.get(key) ?? null
    const newDir = await castPlayerVote(wallId, voteNumber, playerName, direction)

    setMyVotes(prev => {
      const next = new Map(prev)
      if (newDir === null) next.delete(key)
      else next.set(key, newDir)
      return next
    })

    setVoteScores(prev => {
      const next = new Map(prev)
      const existing = next.get(key) ?? { netScore: 0, totalVotes: 0 }
      let delta = 0
      let countDelta = 0
      if (newDir === null) {
        delta = -currentVote; countDelta = -1
      } else if (currentVote === null) {
        delta = newDir; countDelta = 1
      } else {
        delta = newDir - currentVote
      }
      next.set(key, { netScore: existing.netScore + delta, totalVotes: existing.totalVotes + countDelta })
      return next
    })

    return newDir
  }, [wallId, myVotes])

  function activateVoting() {
    setVotingActive(true)
    track('voting_activated', { number, wallId })
  }

  // Cards sort by tier + stat weight — or by net votes when voting is active.
  const votingMode = votingActive && Boolean(voteScores)
  const legendsBase = entries.filter(e => e.tier !== 'UNWRITTEN')
  const legends = votingMode
    ? [...legendsBase].sort((a, b) => {
        const scoreA = voteScores.get(`${a.number}|${a.name}`)?.netScore ?? 0
        const scoreB = voteScores.get(`${b.number}|${b.name}`)?.netScore ?? 0
        if (scoreB !== scoreA) return scoreB - scoreA
        const tierDiff = (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9)
        if (tierDiff !== 0) return tierDiff
        return (b.statWeight || 0) - (a.statWeight || 0)
      })
    : sortLegends(legendsBase)

  const isSacred    = legends.some(e => e.tier === 'SACRED')
  const heat        = getHeatStyle(legends, isSacred)
  const numberColor = getTileTextColor(legends, isSacred)
  const numberGlow  = `0 0 28px ${heat.border}`

  const legendCount = legends.length

  // Show the trigger when: 2+ legends, not sacred, not already voting, not current-roster mode
  const showVoteTrigger = legendCount >= 2 && !isSacred && !votingActive && mode !== 'current' && wallId !== 'none'

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
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                </button>
                <button className="player-panel__close" onClick={onClear} aria-label="Close panel">
                  <X size={14} />
                </button>
              </div>
            </div>

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

            {/* ── "WHO OWNS THIS NUMBER?" trigger ─────────── */}
            {showVoteTrigger && (
              <button className="player-panel__vote-trigger" onClick={activateVoting}>
                <span className="player-panel__vote-trigger-label">WHO OWNS #{number}?</span>
                <span className="player-panel__vote-trigger-hint">Vote on the legends below</span>
              </button>
            )}

            {/* Voting active indicator */}
            {votingActive && !votingMode && (
              <div className="player-panel__vote-loading">
                <span className="player-panel__vote-trigger-label">LOADING VOTES…</span>
              </div>
            )}

            {/* ── Legend cards ─────────────────────────────────── */}
            {legendCount > 0 && (
              <div className="player-panel__cards">
                {legends.map((entry, i) => {
                  const voteKey = `${entry.number}|${entry.name}`
                  const cardVoteData = votingMode ? {
                    netScore: voteScores.get(voteKey)?.netScore ?? 0,
                    myVote:   myVotes?.get(voteKey) ?? null,
                    onVote:   (dir) => handlePlayerVote(number, entry.name, dir),
                  } : null
                  return (
                    <PlayerCard key={`${entry.name}-${i}`} entry={entry} isTop={i === 0} voteData={cardVoteData} />
                  )
                })}
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
