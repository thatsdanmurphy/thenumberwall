import { useState, useEffect } from 'react'
import { fetchVotes, castVote, hasVoted } from '../lib/voteStore.js'
import './WhatsNext.css'

/**
 * WhatsNext — community feature-voting section for the About page.
 * Anonymous, 1 vote per option per browser. Backed by Supabase.
 */

const OPTIONS = [
  {
    id: 'more_timelines',
    label: 'More Player Timelines',
    desc: 'Career arcs for more legends — who should be next after Brady?',
  },
  {
    id: 'more_cities',
    label: 'More City Walls',
    desc: 'Chicago, LA, Philly, Dallas, and beyond',
  },
  {
    id: 'debate_voting',
    label: 'Debate Voting',
    desc: 'Vote on who truly owns a contested number',
  },
  {
    id: 'college_teams',
    label: 'More College Walls',
    desc: 'Every school deserves a wall — which ones should come next?',
  },
]

export default function WhatsNext() {
  const [counts, setCounts] = useState({})
  const [voted, setVoted]   = useState({})
  const [animating, setAnimating] = useState(null)

  useEffect(() => {
    // Load existing votes from Supabase
    fetchVotes().then(setCounts)
    // Load local vote state
    const local = {}
    for (const opt of OPTIONS) {
      local[opt.id] = hasVoted(opt.id)
    }
    setVoted(local)
  }, [])

  async function handleVote(optionId) {
    if (voted[optionId]) return
    const success = await castVote(optionId)
    if (success) {
      setCounts(prev => ({ ...prev, [optionId]: (prev[optionId] || 0) + 1 }))
      setVoted(prev => ({ ...prev, [optionId]: true }))
      setAnimating(optionId)
      setTimeout(() => setAnimating(null), 600)
    }
  }

  // Sort by vote count (highest first), preserving original order for ties
  const sorted = [...OPTIONS].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
  const maxCount = Math.max(1, ...Object.values(counts).map(Number))

  return (
    <div className="whats-next">
      <div className="whats-next__options">
        {sorted.map(opt => {
          const count = counts[opt.id] || 0
          const isVoted = voted[opt.id]
          const isAnimating = animating === opt.id
          const barWidth = maxCount > 0 ? Math.max(2, (count / maxCount) * 100) : 2

          return (
            <button
              key={opt.id}
              className={`whats-next__option ${isVoted ? 'whats-next__option--voted' : ''} ${isAnimating ? 'whats-next__option--pop' : ''}`}
              onClick={() => handleVote(opt.id)}
              disabled={isVoted}
            >
              <div className="whats-next__bar" style={{ width: `${barWidth}%` }} />
              <div className="whats-next__content">
                <div className="whats-next__label-row">
                  <span className="whats-next__label">{opt.label}</span>
                  <span className="whats-next__count">
                    {count > 0 ? count : ''}
                    {isVoted && <span className="whats-next__check"> ✓</span>}
                  </span>
                </div>
                <span className="whats-next__desc">{opt.desc}</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="whats-next__footnote">One vote per option. Your picks shape what gets built.</p>
    </div>
  )
}
