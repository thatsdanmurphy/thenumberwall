import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics'
import './AssociationCard.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSavedPick(number) {
  try {
    const raw = localStorage.getItem(`nw_assoc_${number}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function savePick(number, id) {
  try {
    localStorage.setItem(`nw_assoc_${number}`, JSON.stringify({ id, ts: Date.now() }))
  } catch {}
}

// Given seed votes + optional user pick, return array of { id, name, pct, votes }
function computeSplit(assoc, pickedId) {
  const totals = {}
  assoc.options.forEach(opt => {
    totals[opt.id] = (assoc.seedVotes[opt.id] ?? 0) + (pickedId === opt.id ? 1 : 0)
  })
  const total = Object.values(totals).reduce((s, v) => s + v, 0)
  return {
    splits: assoc.options.map(opt => ({
      ...opt,
      pct:   Math.round((totals[opt.id] / total) * 100),
      votes: totals[opt.id],
    })),
    totalVotes: total,
  }
}

// ── AssociationCard ───────────────────────────────────────────────────────────
//
// FIRST THOUGHT mechanic:
//   Pre-pick  — question + name-only buttons. No arguments, no framing.
//               Forces an instant gut response.
//   Post-pick — crowd split + the wall's one-line editorial call.
//               The wall has a take. It shares it after you share yours.

export default function AssociationCard({ assoc }) {
  const saved               = getSavedPick(assoc.number)
  const [pick, setPick]     = useState(saved)          // { id, ts } | null
  const [tapping, setTapping] = useState(null)         // option id mid-animation
  const [revealed, setRevealed] = useState(!!saved)

  useEffect(() => {
    const s = getSavedPick(assoc.number)
    setPick(s)
    setTapping(null)
    setRevealed(!!s)
  }, [assoc.number])

  function handlePick(id) {
    if (pick || tapping) return
    setTapping(id)

    setTimeout(() => {
      savePick(assoc.number, id)
      const p = { id, ts: Date.now() }
      setPick(p)
      const pickedName = assoc.options.find(o => o.id === id)?.name ?? id
      const agreedWithWall = id === assoc.wallCall
      track('debate_vote', { number: assoc.number, picked: pickedName, agreedWithWall })

      setTimeout(() => {
        setRevealed(true)
        setTapping(null)
      }, 160)
    }, 380)
  }

  const { splits, totalVotes } = computeSplit(assoc, pick?.id)
  const pickedId   = pick?.id
  const wallPicked = assoc.options.find(o => o.id === assoc.wallCall)
  const wallAgrees = pickedId === assoc.wallCall

  return (
    <div className="assoc-card">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="assoc-card__header">
        <span className="assoc-card__eyebrow">FIRST THOUGHT</span>
        <span className="assoc-card__context">{assoc.wallContext}</span>
        <h3 className="assoc-card__question">{assoc.question}</h3>
      </div>

      {/* ── Pre-pick: name buttons only ────────────────────────── */}
      {!revealed && (
        <div className="assoc-card__options">
          {assoc.options.map((opt, i) => (
            <button
              key={opt.id}
              className={[
                'assoc-card__option',
                `assoc-card__option--${opt.id.toLowerCase()}`,
                tapping === opt.id && 'assoc-card__option--tapping',
                tapping && tapping !== opt.id && 'assoc-card__option--fading',
              ].filter(Boolean).join(' ')}
              onClick={() => handlePick(opt.id)}
              disabled={!!tapping}
            >
              <span className="assoc-card__option-name">{opt.name}</span>
              <span className="assoc-card__option-team">{opt.team}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Post-pick: split + wall's call ─────────────────────── */}
      {revealed && pickedId && (
        <div className="assoc-card__result">

          {/* What you said */}
          <div className="assoc-card__your-call">
            <span className="assoc-card__your-call-label">YOU SEE</span>
            <span className="assoc-card__your-call-name">
              {assoc.options.find(o => o.id === pickedId)?.name}
            </span>
          </div>

          {/* Crowd split bar */}
          <div className="assoc-card__split">
            <div className="assoc-card__split-bar">
              {splits.map((s, i) => (
                <div
                  key={s.id}
                  className={[
                    'assoc-card__split-fill',
                    `assoc-card__split-fill--${s.id.toLowerCase()}`,
                  ].join(' ')}
                  style={{ width: `${s.pct}%` }}
                />
              ))}
            </div>
            <div className="assoc-card__split-labels">
              {splits.map(s => (
                <span
                  key={s.id}
                  className={[
                    'assoc-card__split-pct',
                    s.id === pickedId && 'assoc-card__split-pct--yours',
                  ].filter(Boolean).join(' ')}
                >
                  {s.pct}% {s.name.split(' ').pop()}
                </span>
              ))}
            </div>
          </div>

          {/* The wall's take */}
          <div className="assoc-card__wall-take">
            <span className="assoc-card__wall-take-label">
              {wallAgrees ? 'THE WALL AGREES' : 'THE WALL SEES IT DIFFERENTLY'}
            </span>
            <p className="assoc-card__wall-note">{assoc.wallNote}</p>
          </div>

          {/* Footer */}
          <div className="assoc-card__meta">
            <span className="assoc-card__season">{assoc.seasonLabel}</span>
            <span className="assoc-card__count">{totalVotes.toLocaleString()} first thoughts</span>
          </div>

        </div>
      )}

    </div>
  )
}
