/**
 * LiveGameCard — One historically significant game on the /live feed.
 *
 * Layout (top to bottom):
 *   1. Tile row   — player number cells, wall-tile aesthetic. Legend = heat, Watch = sacred.
 *   2. Headline   — one editorial sentence about what this game means to the wall.
 *   3. Game footer — compressed: SPORT · AWAY score–score HOME · period · clock · live dot
 *   4. Wall Watch — vote row for players not yet on the wall (if any)
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
 *   wallWeight  number    — 0–100, sort order only (not displayed)
 *   headline    string    — one sentence, editorial framing
 *   players     Player[]
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

const SPORT_LABEL = { nhl: 'NHL', nba: 'NBA', mlb: 'MLB', nfl: 'NFL' }

// ── Wall Watch row ────────────────────────────────────────────────────────────

function WallWatchRow({ player, onVote }) {
  return (
    <div className="lgc-wall-watch">
      <span className="lgc-wall-watch__tag">WALL WATCH</span>
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
  const [localPlayers, setLocalPlayers] = useState(players)

  function handleVote(playerId, dir) {
    setLocalPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p
      const prevVote = p.wallWatchVotes?.myVote ?? null
      const newVote  = prevVote === dir ? null : dir
      const delta    = (newVote ?? 0) - (prevVote ?? 0)
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

  const isLive      = status === 'live'
  const watchPlayers = localPlayers.filter(p => !p.isOnWall && p.wallWatchVotes)

  return (
    <article className="live-game-card">

      {/* ── 1. Tile row ─────────────────────────────────────────────────── */}
      {localPlayers.length > 0 && (
        <div className="lgc-tiles">
          {localPlayers.map(p => (
            <div key={p.id} className="lgc-tile-wrap">
              <div className={`lgc-tile${p.isOnWall ? ' lgc-tile--legend' : ' lgc-tile--watch'}`}>
                <span className="lgc-tile__num">#{p.number}</span>
                {p.isOnWall && <span className="lgc-tile__star" aria-label="On The Number Wall">★</span>}
              </div>
              <div className="lgc-tile__meta">
                <span className="lgc-tile__name">{p.name.split(' ').pop()}</span>
                <span className="lgc-tile__stat">{p.stat}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 2. Headline ─────────────────────────────────────────────────── */}
      <p className="lgc-headline">{headline}</p>

      {/* ── 3. Compressed game footer ───────────────────────────────────── */}
      <div className="lgc-footer">
        {isLive && <span className="lgc-footer__dot" aria-label="Live" />}
        <span className="lgc-footer__sport">{SPORT_LABEL[sport] ?? sport.toUpperCase()}</span>
        <span className="lgc-footer__sep">·</span>
        <span className="lgc-footer__score">{awayTeam} {awayScore}–{homeScore} {homeTeam}</span>
        <span className="lgc-footer__sep">·</span>
        <span className="lgc-footer__period">{period}</span>
        {clock && (
          <>
            <span className="lgc-footer__sep">·</span>
            <span className="lgc-footer__clock">{clock}</span>
          </>
        )}
      </div>

      {/* ── 4. Wall Watch rows ──────────────────────────────────────────── */}
      {watchPlayers.map(p => (
        <WallWatchRow key={p.id} player={p} onVote={handleVote} />
      ))}

    </article>
  )
}
