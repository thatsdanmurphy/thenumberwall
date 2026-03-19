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

// Last name only for compact chips
function shortName(name) {
  const parts = (name || '').trim().split(' ')
  return parts.length > 1 ? parts[parts.length - 1] : name
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
// FIRST THOUGHT mechanic — compact chip style, consistent with YourNumberPick.
// Pre-pick:  label + name chips. No framing, no stats. Gut tap only.
// Post-pick: split bar + the wall's editorial call.

export default function AssociationCard({ assoc }) {
  const saved                 = getSavedPick(assoc.number)
  const [pick, setPick]       = useState(saved)
  const [tapping, setTapping] = useState(null)
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
      const pickedName    = assoc.options.find(o => o.id === id)?.name ?? id
      const agreedWithWall = id === assoc.wallCall
      track('debate_vote', { number: assoc.number, picked: pickedName, agreedWithWall })
      setTimeout(() => {
        setRevealed(true)
        setTapping(null)
      }, 160)
    }, 340)
  }

  const { splits, totalVotes } = computeSplit(assoc, pick?.id)
  const pickedId   = pick?.id
  const wallAgrees = pickedId === assoc.wallCall

  return (
    <div className="assoc-card">

      {/* ── Pre-pick ────────────────────────────────────────────── */}
      {!revealed && (
        <>
          <span className="assoc-card__label">WHO REALLY OWNS THIS NUMBER?</span>
          <div className="assoc-card__chips">
            {assoc.options.map((opt, i) => (
              <button
                key={opt.id}
                className={[
                  'assoc-card__chip',
                  i === 0                            && 'assoc-card__chip--top',
                  tapping === opt.id                 && 'assoc-card__chip--tapping',
                  tapping && tapping !== opt.id      && 'assoc-card__chip--fading',
                ].filter(Boolean).join(' ')}
                onClick={() => handlePick(opt.id)}
                disabled={!!tapping}
              >
                {shortName(opt.name)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Post-pick ───────────────────────────────────────────── */}
      {revealed && pickedId && (
        <div className="assoc-card__result">

          <div className="assoc-card__your-call">
            <span className="assoc-card__your-call-label">YOUR PICK</span>
            <span className="assoc-card__your-call-name">
              {assoc.options.find(o => o.id === pickedId)?.name}
            </span>
          </div>

          <div className="assoc-card__split">
            <div className="assoc-card__split-bar">
              {splits.map((s, i) => (
                <div
                  key={s.id}
                  className="assoc-card__split-fill"
                  style={{
                    width:      `${s.pct}%`,
                    background: i === 0
                      ? 'rgba(74, 140, 255, 0.72)'
                      : 'rgba(232, 124, 42, 0.72)',
                    opacity: s.id === pickedId ? 1 : 0.45,
                  }}
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
                  {s.pct}% {shortName(s.name)}
                </span>
              ))}
            </div>
          </div>

          <p className="assoc-card__wall-note">
            <span className="assoc-card__wall-verdict">
              {wallAgrees ? 'THE WALL AGREES · ' : 'THE WALL DIFFERS · '}
            </span>
            {assoc.wallNote}
          </p>

          <div className="assoc-card__meta">
            <span className="assoc-card__count">{totalVotes.toLocaleString()} first thoughts</span>
          </div>

        </div>
      )}

    </div>
  )
}
