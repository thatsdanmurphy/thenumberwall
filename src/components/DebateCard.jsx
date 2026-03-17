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

function saveVote(number, side) {
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

export default function DebateCard({ debate }) {
  const saved               = getSavedVote(debate.number)
  const [vote, setVote]     = useState(saved)          // { side: 'A'|'B', ts } | null
  const [choosing, setChoosing] = useState(null)       // 'A' | 'B' | null — the in-flight tap
  const [revealed, setRevealed] = useState(!!saved)    // true once result is shown

  // Reset state when debate changes (different number opened)
  useEffect(() => {
    const s = getSavedVote(debate.number)
    setVote(s)
    setChoosing(null)
    setRevealed(!!s)
  }, [debate.number])

  function handlePick(side) {
    if (vote || choosing) return   // already voted or mid-animation
    setChoosing(side)

    // Step 1: animate the pick (400ms)
    // Step 2: save + reveal result
    setTimeout(() => {
      saveVote(debate.number, side)
      const v = { side, ts: Date.now() }
      setVote(v)
      track('debate_side_chosen', { number: debate.number, side, debate: debate.question })

      // Brief pause then reveal
      setTimeout(() => {
        setRevealed(true)
        setChoosing(null)
      }, 180)
    }, 420)
  }

  const { pctA, pctB, totalVotes } = computeSplit(debate, vote?.side)
  const userSide = vote?.side

  return (
    <div className="debate-card">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="debate-card__header">
        <span className="debate-card__eyebrow">LIVE DEBATE</span>
        <h3 className="debate-card__question">{debate.question}</h3>
        <p className="debate-card__context">{debate.context}</p>
      </div>

      {/* ── Pre-vote: pick a side ───────────────────────────────── */}
      {!revealed && (
        <div className="debate-card__arena">
          <button
            className={[
              'debate-card__side',
              'debate-card__side--a',
              choosing === 'A' && 'debate-card__side--choosing',
              choosing === 'B' && 'debate-card__side--dismissed',
            ].filter(Boolean).join(' ')}
            onClick={() => handlePick('A')}
            disabled={!!choosing}
          >
            <span className="debate-card__side-name">{debate.sideA.name}</span>
            <span className="debate-card__side-team">{debate.sideA.team} · {debate.sideA.sport}</span>
            <p className="debate-card__side-arg">{debate.sideA.argument}</p>
            <span className="debate-card__side-cta">I'm with {debate.sideA.name.split(' ').pop()} →</span>
          </button>

          <div className="debate-card__vs" aria-hidden="true">VS</div>

          <button
            className={[
              'debate-card__side',
              'debate-card__side--b',
              choosing === 'B' && 'debate-card__side--choosing',
              choosing === 'A' && 'debate-card__side--dismissed',
            ].filter(Boolean).join(' ')}
            onClick={() => handlePick('B')}
            disabled={!!choosing}
          >
            <span className="debate-card__side-name">{debate.sideB.name}</span>
            <span className="debate-card__side-team">{debate.sideB.team} · {debate.sideB.sport}</span>
            <p className="debate-card__side-arg">{debate.sideB.argument}</p>
            <span className="debate-card__side-cta">I'm with {debate.sideB.name.split(' ').pop()} →</span>
          </button>
        </div>
      )}

      {/* ── Post-vote: result ────────────────────────────────────── */}
      {revealed && (
        <div className="debate-card__result">

          {/* User's declared position */}
          <div className="debate-card__verdict">
            <span className="debate-card__verdict-label">YOUR CALL</span>
            <span className="debate-card__verdict-name">
              {userSide === 'A' ? debate.sideA.name : debate.sideB.name}
            </span>
          </div>

          {/* Split bar */}
          <div className="debate-card__split" aria-label={`${pctA}% ${debate.sideA.name}, ${pctB}% ${debate.sideB.name}`}>
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
              <span
                className={`debate-card__split-pct${userSide === 'A' ? ' debate-card__split-pct--yours' : ''}`}
              >
                {pctA}% {debate.sideA.name.split(' ').pop()}
              </span>
              <span
                className={`debate-card__split-pct${userSide === 'B' ? ' debate-card__split-pct--yours' : ''}`}
              >
                {debate.sideB.name.split(' ').pop()} {pctB}%
              </span>
            </div>
          </div>

          {/* Position framing */}
          <p className="debate-card__position">
            {userSide === 'A'
              ? pctA >= 50
                ? `You're with the majority — ${pctA}% of voters agree.`
                : `You're in the minority — only ${pctA}% of voters agree. Hold your ground.`
              : pctB >= 50
                ? `You're with the majority — ${pctB}% of voters agree.`
                : `You're in the minority — only ${pctB}% of voters agree. Hold your ground.`
            }
          </p>

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
