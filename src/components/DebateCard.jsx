import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics'
import './DebateCard.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSavedVote(number) {
  try {
    const raw = localStorage.getItem(`nw_debate_${number}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveVoteToStorage(number, side) {
  try {
    localStorage.setItem(`nw_debate_${number}`, JSON.stringify({ side, ts: Date.now() }))
  } catch {}
}

// Given seeded votes + optional user vote, return { pctA, pctB, totalVotes }
function computeSplit(debate, userSide) {
  const a = debate.seedVotesA + (userSide === 'A' ? 1 : 0)
  const b = debate.seedVotesB + (userSide === 'B' ? 1 : 0)
  const total = a + b
  return {
    pctA:       Math.round((a / total) * 100),
    pctB:       Math.round((b / total) * 100),
    totalVotes: total,
  }
}

// ── DebateCard ────────────────────────────────────────────────────────────────
//
// Two-phase mechanic:
//   Pre-vote  — shows the claim + two name-only buttons. No arguments shown.
//               Forces a gut declaration before the case is revealed.
//   Post-vote — reveals the crowd split, your argument, and the counter.
//               The reveal is the moment, not the vote.

export default function DebateCard({ debate }) {
  const saved                   = getSavedVote(debate.number)
  const [vote, setVote]         = useState(saved)          // { side: 'A'|'B', ts } | null
  const [choosing, setChoosing] = useState(null)           // 'A' | 'B' | null — in-flight tap
  const [revealed, setRevealed] = useState(!!saved)        // true once result is shown

  // Reset when a different debate number is opened
  useEffect(() => {
    const s = getSavedVote(debate.number)
    setVote(s)
    setChoosing(null)
    setRevealed(!!s)
  }, [debate.number])

  function handlePick(side) {
    if (vote || choosing) return  // already voted or mid-animation
    setChoosing(side)

    // Step 1: animate the pick (420ms)
    // Step 2: save + brief pause + reveal
    setTimeout(() => {
      saveVoteToStorage(debate.number, side)
      const v = { side, ts: Date.now() }
      setVote(v)
      track('debate_side_chosen', { number: debate.number, side, debate: debate.claim })

      setTimeout(() => {
        setRevealed(true)
        setChoosing(null)
      }, 180)
    }, 420)
  }

  const { pctA, pctB, totalVotes } = computeSplit(debate, vote?.side)
  const userSide  = vote?.side
  const userPick  = userSide === 'A' ? debate.sideA : debate.sideB
  const otherPick = userSide === 'A' ? debate.sideB : debate.sideA
  const userPct   = userSide === 'A' ? pctA : pctB

  return (
    <div className="debate-card">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="debate-card__header">
        <span className="debate-card__eyebrow">DECLARE YOUR SIDE</span>
        <h3 className="debate-card__claim">{debate.claim}</h3>
        <p className="debate-card__context">{debate.context}</p>
      </div>

      {/* ── Pre-vote: name-only pick buttons ───────────────────── */}
      {!revealed && (
        <div className="debate-card__arena">
          <div className="debate-card__picks">

            <button
              className={[
                'debate-card__pick',
                'debate-card__pick--a',
                choosing === 'A' && 'debate-card__pick--choosing',
                choosing === 'B' && 'debate-card__pick--dismissed',
              ].filter(Boolean).join(' ')}
              onClick={() => handlePick('A')}
              disabled={!!choosing}
            >
              <span className="debate-card__pick-name">{debate.sideA.name}</span>
              <span className="debate-card__pick-team">{debate.sideA.team}</span>
            </button>

            <div className="debate-card__vs" aria-hidden="true">VS</div>

            <button
              className={[
                'debate-card__pick',
                'debate-card__pick--b',
                choosing === 'B' && 'debate-card__pick--choosing',
                choosing === 'A' && 'debate-card__pick--dismissed',
              ].filter(Boolean).join(' ')}
              onClick={() => handlePick('B')}
              disabled={!!choosing}
            >
              <span className="debate-card__pick-name">{debate.sideB.name}</span>
              <span className="debate-card__pick-team">{debate.sideB.team}</span>
            </button>

          </div>
          <p className="debate-card__commit-note">The argument reveals after you pick.</p>
        </div>
      )}

      {/* ── Post-vote: reveal ───────────────────────────────────── */}
      {revealed && userSide && (
        <div className="debate-card__result">

          {/* Your declared position */}
          <div className="debate-card__verdict">
            <span className="debate-card__verdict-label">YOUR CALL</span>
            <span className="debate-card__verdict-name">{userPick.name}</span>
          </div>

          {/* Crowd split bar */}
          <div
            className="debate-card__split"
            aria-label={`${pctA}% ${debate.sideA.name}, ${pctB}% ${debate.sideB.name}`}
          >
            <div className="debate-card__split-bar">
              <div
                className="debate-card__split-fill debate-card__split-fill--a"
                style={{ width: `${pctA}%` }}
              />
              <div
                className="debate-card__split-fill debate-card__split-fill--b"
                style={{ width: `${pctB}%` }}
              />
            </div>
            <div className="debate-card__split-labels">
              <span className={`debate-card__split-pct${userSide === 'A' ? ' debate-card__split-pct--yours' : ''}`}>
                {pctA}% {debate.sideA.name.split(' ').pop()}
              </span>
              <span className={`debate-card__split-pct${userSide === 'B' ? ' debate-card__split-pct--yours' : ''}`}>
                {debate.sideB.name.split(' ').pop()} {pctB}%
              </span>
            </div>
          </div>

          {/* Your position — 1-2 sentences making the stance feel articulated */}
          <p className="debate-card__position">{userPick.position}</p>

          {/* Your argument — the case for the side you chose, now revealed */}
          <div className="debate-card__argument">
            <span className="debate-card__argument-label">THE CASE</span>
            <p className="debate-card__argument-text">{userPick.argument}</p>
          </div>

          {/* The counter — other side's argument, dimmed */}
          <div className="debate-card__counter">
            <span className="debate-card__counter-label">THE OTHER SIDE</span>
            <p className="debate-card__counter-text">{otherPick.argument}</p>
          </div>

          {/* Season + vote count */}
          <div className="debate-card__meta">
            <span className="debate-card__season">{debate.seasonLabel}</span>
            <span className="debate-card__votes">{totalVotes.toLocaleString()} votes</span>
          </div>

        </div>
      )}

    </div>
  )
}
