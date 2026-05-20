/**
 * LiveGameCard — One historically significant game on the /live feed.
 *
 * Player layout varies by count:
 *   0 players — quiet card, score + headline only
 *   1 player  — wide solo block
 *   2 players — side-by-side
 *   3+        — horizontal scroll of compact pills
 *
 * Wall Watch: editorial nomination row for players NOT yet on the wall.
 *   - Reuses VoteButtons (compact mode)
 *   - One sentence of editorial framing max
 *   - Only renders if player.isOnWall === false
 *
 * Props:
 *   sport       string    — 'nhl' | 'nba' | 'mlb' | 'nfl'
 *   homeTeam    string    — team abbr
 *   awayTeam    string    — team abbr
 *   homeScore   number
 *   awayScore   number
 *   period      string    — '2nd', 'Bot 6', 'Q3', etc.
 *   clock       string?   — time remaining or null (MLB has no clock)
 *   status      string    — 'live' | 'final' | 'pre'
 *   wallWeight  number    — 0–100, used for sort order (not displayed)
 *   headline    string    — one sentence, editorial framing
 *   players     Player[]  — see shape below
 *
 * Player shape:
 *   id            string
 *   name          string
 *   number        number
 *   team          string
 *   isOnWall      boolean
 *   stat          string    — tonight's line (e.g. '22 PTS tonight')
 *   chaser        object?   — { stat, current, target?, targetLabel? }
 *   wallWatchVotes object?  — { netScore, myVote } — only for non-wall players
 */

import { useState } from 'react'
import VoteButtons from './VoteButtons.jsx'
import './LiveGameCard.css'

// ── Sport badge colors (reuse team tokens where they exist) ───────────────────
const SPORT_LABEL = { nhl: 'NHL', nba: 'NBA', mlb: 'MLB', nfl: 'NFL' }

// ── Player block variants ─────────────────────────────────────────────────────

function PlayerSolo({ player, onVote }) {
  return (
    <div className="lgc-player lgc-player--solo">
      <PlayerCore player={player} />
      {!player.isOnWall && player.wallWatchVotes && (
        <WallWatchRow player={player} onVote={onVote} />
      )}
    </div>
  )
}

function PlayerPair({ players, onVote }) {
  return (
    <div className="lgc-player-pair">
      {players.map(p => (
        <div key={p.id} className="lgc-player lgc-player--half">
          <PlayerCore player={p} />
          {!p.isOnWall && p.wallWatchVotes && (
            <WallWatchRow player={p} onVote={onVote} />
          )}
        </div>
      ))}
    </div>
  )
}

function PlayerPills({ players, onVote }) {
  return (
    <div className="lgc-player-pills">
      {players.map(p => (
        <div key={p.id} className="lgc-pill">
          <span className="lgc-pill__number">#{p.number}</span>
          <span className="lgc-pill__name">{p.name.split(' ').pop()}</span>
          <span className="lgc-pill__stat">{p.stat}</span>
          {!p.isOnWall && p.wallWatchVotes && (
            <VoteButtons
              netScore={p.wallWatchVotes.netScore}
              myVote={p.wallWatchVotes.myVote}
              onVote={(dir) => onVote(p.id, dir)}
              playerName={p.name}
              number={p.number}
              compact
            />
          )}
        </div>
      ))}
    </div>
  )
}

function PlayerCore({ player }) {
  return (
    <div className="lgc-player__core">
      <div className="lgc-player__identity">
        <span className="lgc-player__number">#{player.number}</span>
        <div className="lgc-player__name-team">
          <span className="lgc-player__name">{player.name}</span>
          <span className="lgc-player__team">{player.team}</span>
        </div>
        {player.isOnWall && (
          <span className="lgc-player__on-wall" title="On The Number Wall">★</span>
        )}
      </div>
      <span className="lgc-player__tonight-stat">{player.stat}</span>
      {player.chaser && (
        <div className="lgc-player__chaser-hint">
          <span className="lgc-player__chaser-stat">{player.chaser.stat}:</span>
          <span className="lgc-player__chaser-current">{player.chaser.current.toLocaleString()}</span>
          {player.chaser.target && (
            <>
              <span className="lgc-player__chaser-sep">→</span>
              <span className="lgc-player__chaser-target">{player.chaser.targetLabel}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function WallWatchRow({ player, onVote }) {
  return (
    <div className="lgc-wall-watch">
      <div className="lgc-wall-watch__label">
        <span className="lgc-wall-watch__tag">WALL WATCH</span>
      </div>
      <div className="lgc-wall-watch__body">
        <span className="lgc-wall-watch__tally">
          {player.wallWatchVotes.netScore > 0 ? '+' : ''}{player.wallWatchVotes.netScore} say they belong
        </span>
        <VoteButtons
          netScore={player.wallWatchVotes.netScore}
          myVote={player.wallWatchVotes.myVote}
          onVote={(dir) => onVote(player.id, dir)}
          playerName={player.name}
          number={player.number}
          compact
        />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LiveGameCard({
  sport,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  period,
  clock,
  status,
  headline,
  players = [],
}) {
  // Local vote state — will be lifted to server in Task #6
  const [localPlayers, setLocalPlayers] = useState(players)

  function handleVote(playerId, dir) {
    setLocalPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p
      const prev_vote = p.wallWatchVotes?.myVote ?? null
      const newVote   = prev_vote === dir ? null : dir   // toggle off
      const delta     = (newVote ?? 0) - (prev_vote ?? 0)
      return {
        ...p,
        wallWatchVotes: {
          ...p.wallWatchVotes,
          myVote:   newVote,
          netScore: (p.wallWatchVotes?.netScore ?? 0) + delta,
        },
      }
    }))
  }

  const isLive = status === 'live'

  return (
    <article className="live-game-card">

      {/* ── Scoreboard header ───────────────────────────────────────────── */}
      <div className="lgc-scoreboard">
        <div className="lgc-scoreboard__sport">
          <span className="lgc-sport-badge">{SPORT_LABEL[sport] ?? sport.toUpperCase()}</span>
          {isLive && <span className="lgc-live-indicator" aria-label="Live" />}
        </div>

        <div className="lgc-scoreboard__teams">
          <div className="lgc-team">
            <span className="lgc-team__abbr">{awayTeam}</span>
            <span className="lgc-team__score">{awayScore}</span>
          </div>
          <div className="lgc-scoreboard__divider">
            <span className="lgc-period">{period}</span>
            {clock && <span className="lgc-clock">{clock}</span>}
          </div>
          <div className="lgc-team lgc-team--home">
            <span className="lgc-team__score">{homeScore}</span>
            <span className="lgc-team__abbr">{homeTeam}</span>
          </div>
        </div>
      </div>

      {/* ── Headline ────────────────────────────────────────────────────── */}
      <p className="lgc-headline">{headline}</p>

      {/* ── Player zone — layout varies by count ────────────────────────── */}
      {localPlayers.length === 0 && null}

      {localPlayers.length === 1 && (
        <PlayerSolo player={localPlayers[0]} onVote={handleVote} />
      )}

      {localPlayers.length === 2 && (
        <PlayerPair players={localPlayers} onVote={handleVote} />
      )}

      {localPlayers.length >= 3 && (
        <PlayerPills players={localPlayers} onVote={handleVote} />
      )}

    </article>
  )
}
