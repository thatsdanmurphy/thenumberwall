/**
 * VoteButtons — Reddit-style up/down vote on a player card.
 *
 * Props:
 *   netScore    — current net score (upvotes - downvotes)
 *   myVote      — user's current vote: 1, -1, or null
 *   onVote(dir) — callback when user taps up (1) or down (-1)
 *   compact     — smaller layout for tight card spaces
 */

import { ChevronUp, ChevronDown } from 'lucide-react'
import { track } from '@vercel/analytics'
import './VoteButtons.css'

export default function VoteButtons({ netScore = 0, myVote = null, onVote, playerName, number, compact = false }) {

  function handleUp(e) {
    e.stopPropagation()
    const newDir = onVote(1)
    track('player_vote', { number, player: playerName, direction: 'up', result: newDir })
  }

  function handleDown(e) {
    e.stopPropagation()
    const newDir = onVote(-1)
    track('player_vote', { number, player: playerName, direction: 'down', result: newDir })
  }

  const isUp   = myVote === 1
  const isDown = myVote === -1

  return (
    <div className={`vote-buttons${compact ? ' vote-buttons--compact' : ''}`}>
      <button
        className={`vote-buttons__btn vote-buttons__btn--up${isUp ? ' vote-buttons__btn--active' : ''}`}
        onClick={handleUp}
        aria-label="Upvote"
        title="Upvote"
      >
        <ChevronUp size={compact ? 14 : 16} />
      </button>

      <span className={`vote-buttons__score${isUp ? ' vote-buttons__score--up' : ''}${isDown ? ' vote-buttons__score--down' : ''}`}>
        {netScore}
      </span>

      <button
        className={`vote-buttons__btn vote-buttons__btn--down${isDown ? ' vote-buttons__btn--active' : ''}`}
        onClick={handleDown}
        aria-label="Downvote"
        title="Downvote"
      >
        <ChevronDown size={compact ? 14 : 16} />
      </button>
    </div>
  )
}
