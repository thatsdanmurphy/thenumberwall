/**
 * LivePage — /live  (split view, v3)
 *
 * Left:  Stacked 4×3 weekly grids — 12 slots per week, empty cells as
 *        dashed placeholders. Current week full opacity; past weeks dimmed.
 *        Click any filled tile to select.
 * Right: Full detail panel —
 *          1. Player mat   (number + identity + game + tonight)
 *          2. Chase section (lens tag + headline + progress bar)
 *          3. Games ahead   (upcoming games, distance countdown)
 *          4. Wall Watch    (vote row for non-wall players)
 *
 * Top:   Page placemat — "Tonight on the wall" heading + live count.
 *
 * Data: WEEKS — stacked week blocks, each with 12 entry slots (or null).
 *       Replace with useWeeklyNumbers() hook in Task #6.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { X, Trophy, Flame, TrendingUp } from 'lucide-react'
import AppShell              from '../components/AppShell.jsx'
import AppHeader             from '../components/AppHeader.jsx'
import AppLoading            from '../components/AppLoading.jsx'
import VoteButtons           from '../components/VoteButtons.jsx'
import { supabase }          from '../lib/supabase.js'
import './LivePage.css'

// ── Constants ────────────────────────────────────────────────────────────────

const SPORT_LABEL = { nhl: 'NHL', nba: 'NBA', mlb: 'MLB', nfl: 'NFL' }

// ── Weekly mock data — 12 slots per week (4×3 grid) ─────────────────────────

const WEEKS = [
  {
    id: 'week-may-19',
    weekOf: 'May 19',
    isCurrentWeek: true,
    entries: [
      // Ovechkin: broke Gretzky's record in 2024-25, not currently playing — returns next season
      {
        id: 'eichel',
        number: 9,
        player: 'Jack Eichel',
        sport: 'nhl',
        team: 'VGK',
        isOnWall: false,
        chaseWeight: 1,
        stat: '1G, 1A tonight',
        headline: 'Eichel is willing Vegas to another Cup.',
        game: {
          homeTeam: 'CAR', awayTeam: 'VGK',
          homeScore: 1,    awayScore: 2,
          period: '2nd',  clock: '11:22', status: 'live',
          gameDate: 'Tonight', gameTime: '8:00 PM ET',
        },
        chaser: {
          lens: 'SERIES',
          stat: 'Points',
          current: 7,
          target: null,
          targetLabel: null,
          holder: null, holderTeam: null, holderYear: null, remaining: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'Stanley Cup Final — VGK leads 2–1',
        gamesAhead: [
          { id: 'g1', date: 'Tonight', matchup: '@CAR', note: 'Game 4' },
          { id: 'g2', date: 'Jun 2',   matchup: 'vs CAR', note: 'Game 5' },
          { id: 'g3', date: 'Jun 5',   matchup: '@CAR', note: 'Game 6' },
        ],
      },
      {
        id: 'wembanyama',
        number: 1,
        player: 'Victor Wembanyama',
        sport: 'nba',
        team: 'SAS',
        isOnWall: false,
        chaseWeight: 1,
        stat: '28 PTS, 11 REB, 4 BLK tonight',
        headline: 'Wembanyama in the Finals. Nobody this young has ever looked like this.',
        game: {
          homeTeam: 'NYK', awayTeam: 'SAS',
          homeScore: 54,   awayScore: 58,
          period: '3rd',  clock: '5:40', status: 'live',
          gameDate: 'Tonight', gameTime: '8:30 PM ET',
        },
        chaser: {
          lens: 'SERIES',
          stat: 'Points',
          current: 91,
          target: null,
          targetLabel: null,
          holder: null, holderTeam: null, holderYear: null, remaining: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'NBA Finals — SAS leads 2–1',
        gamesAhead: [
          { id: 'g1', date: 'Tonight', matchup: '@NYK', note: 'Game 4' },
          { id: 'g2', date: 'Jun 1',   matchup: 'vs NYK', note: 'Game 5' },
          { id: 'g3', date: 'Jun 5',   matchup: '@NYK', note: 'Game 6' },
        ],
      },
      {
        id: 'degrom',
        number: 48,
        player: 'Jacob deGrom',
        sport: 'mlb',
        team: 'TEX',
        isOnWall: false,
        chaseWeight: 3,
        stat: '6 IP, 0 ER, 9 K tonight',
        headline: "deGrom ERA watch — 0.56 this season, chasing Dutch Leonard's 1.01 all-time record.",
        game: {
          homeTeam: 'TEX', awayTeam: 'HOU',
          homeScore: 2,    awayScore: 3,
          period: 'Bot 6', clock: null, status: 'live',
          gameDate: 'Tonight', gameTime: '7:05 PM ET',
        },
        chaser: {
          lens: 'SEASON',
          stat: 'ERA',
          current: 0.56,
          target: 1.01,
          targetLabel: 'Single-Season Record',
          holder: 'Dutch Leonard',
          holderTeam: 'BOS',
          holderYear: '1914',
          remaining: null,
          lowerIsBetter: true,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'ERA must hold — 3 starts to lock it',
        gamesAhead: [
          { id: 'g1', date: 'May 24', matchup: '@HOU',   note: 'Must stay under 1.01' },
          { id: 'g2', date: 'Jun 1',  matchup: 'vs LAD', note: 'Toughest test'         },
          { id: 'g3', date: 'Jun 8',  matchup: 'vs COL', note: null                    },
        ],
      },
      {
        id: 'aho',
        number: 20,
        player: 'Sebastian Aho',
        sport: 'nhl',
        team: 'CAR',
        isOnWall: false,
        chaseWeight: 1,
        stat: '1G, 2A tonight',
        headline: 'Aho is carrying Carolina — leads the Cup Final with 8 points through 3 games.',
        game: {
          homeTeam: 'CAR', awayTeam: 'VGK',
          homeScore: 2,    awayScore: 1,
          period: '2nd',  clock: '11:22', status: 'live',
          gameDate: 'Tonight', gameTime: '8:00 PM ET',
        },
        chaser: {
          lens: 'SERIES',
          stat: 'Points',
          current: 9,
          target: null,
          targetLabel: null,
          holder: null, holderTeam: null, holderYear: null, remaining: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'Stanley Cup Final — CAR leads 2–1',
        gamesAhead: [
          { id: 'g1', date: 'Tonight', matchup: 'vs VGK', note: 'Game 4' },
          { id: 'g2', date: 'Jun 2',   matchup: '@VGK',   note: 'Game 5' },
          { id: 'g3', date: 'Jun 5',   matchup: 'vs VGK', note: 'Game 6' },
        ],
      },
      {
        id: 'brunson',
        number: 11,
        player: 'Jalen Brunson',
        sport: 'nba',
        team: 'NYK',
        isOnWall: false,
        chaseWeight: 1,
        stat: '31 PTS tonight',
        headline: "Brunson is the Finals. 31 a night, every night — NYC hasn't seen this since Ewing.",
        game: {
          homeTeam: 'NYK', awayTeam: 'SAS',
          homeScore: 58,   awayScore: 54,
          period: '3rd',  clock: '5:40', status: 'live',
          gameDate: 'Tonight', gameTime: '8:30 PM ET',
        },
        chaser: {
          lens: 'SERIES',
          stat: 'Points',
          current: 94,
          target: null,
          targetLabel: null,
          holder: null, holderTeam: null, holderYear: null, remaining: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'NBA Finals — SAS leads 2–1',
        gamesAhead: [
          { id: 'g1', date: 'Tonight', matchup: 'vs SAS', note: 'Game 4 — MSG' },
          { id: 'g2', date: 'Jun 1',   matchup: 'vs SAS', note: 'Game 5'       },
          { id: 'g3', date: 'Jun 5',   matchup: '@SAS',   note: 'Game 6'       },
        ],
      },
      // 18 empty slots — 6×4 = 24 total, tiles match main wall size
      null, null, null, null, null, null,
      null, null, null, null, null, null,
      null, null, null, null, null, null,
    ],
  },
]

// ── ARCHIVE_PLACEHOLDER — past weeks removed per design direction ─────────────
// Past weeks were cut. The left column shows only the current week.
// Historical entries will surface via a future /archive or search route.

const _WEEKS_ARCHIVE = [
  {
    id: 'week-may-12',
    weekOf: 'May 12',
    isCurrentWeek: false,
    entries: [
      {
        id: 'mahomes',
        number: 15,
        player: 'Patrick Mahomes',
        sport: 'nfl',
        team: 'KC',
        isOnWall: true,
        stat: '312 YDS, 3 TD',
        headline: 'Mahomes crossed 30,000 career passing yards — the fastest ever.',
        game: {
          homeTeam: 'KC', awayTeam: 'LV',
          homeScore: 28,  awayScore: 14,
          period: 'Final', clock: null, status: 'final',
          gameDate: 'May 12', gameTime: null,
        },
        chaser: {
          lens: 'CAREER',
          stat: 'Pass Yards',
          current: 30184,
          target: null,
          targetLabel: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: null,
        gamesAhead: [],
      },
      {
        id: 'judge',
        number: 99,
        player: 'Aaron Judge',
        sport: 'mlb',
        team: 'NYY',
        isOnWall: false,
        stat: '2 HR tonight',
        headline: 'Judge hit his 62nd home run this season — breaking the AL single-season record.',
        game: {
          homeTeam: 'NYY', awayTeam: 'TEX',
          homeScore: 8,    awayScore: 3,
          period: 'Final', clock: null, status: 'final',
          gameDate: 'May 12', gameTime: null,
        },
        chaser: {
          lens: 'SEASON',
          stat: 'Home Runs',
          current: 62,
          target: 73,
          targetLabel: 'All-Time Record (Bonds)',
          lowerIsBetter: false,
        },
        wallWatchVotes: { netScore: 112, myVote: null },
        gamesAheadContext: null,
        gamesAhead: [],
      },
      // 10 empty slots
      null, null, null, null,
      null, null, null, null, null, null,
    ],
  },
]
// ── end archive ───────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return ''
  return typeof n === 'number' && !Number.isInteger(n)
    ? n.toFixed(2)
    : Number(n).toLocaleString()
}

function chasePct(chaser) {
  if (!chaser?.target) return null
  const { current, target, lowerIsBetter } = chaser
  return lowerIsBetter
    ? Math.min(100, Math.max(0, (target - current) / target * 100))
    : Math.min(100, Math.max(0, current / target * 100))
}

function chaseDistance(chaser) {
  if (!chaser?.target) return null
  return Math.abs(chaser.target - chaser.current)
}

// chaseWeight → tile heat intensity, all in the orange heat family
// Matches the main wall aesthetic — no multi-color system, just heat levels.
function tileVariant(entry) {
  const w = entry.chaseWeight ?? 1
  return `w${Math.max(1, Math.min(3, w))}`
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Flatten all non-null entries across all weeks into a map
function buildEntryMap(weeks) {
  const map = new Map()
  for (const week of weeks) {
    for (const entry of week.entries) {
      if (entry) map.set(entry.id, entry)
    }
  }
  return map
}

// ── TileBtn — grid cell selector ─────────────────────────────────────────────

function TileBtn({ entry, active, onClick }) {
  const variant = tileVariant(entry)

  return (
    <button
      className={[
        'ls-tile-btn',
        `ls-tile-btn--${variant}`,
        active ? 'ls-tile-btn--active' : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${entry.player}, number ${entry.number}`}
    >
      {entry.number}
    </button>
  )
}

// ── TileEmpty — dashed placeholder ───────────────────────────────────────────

function TileEmpty() {
  return <div className="ls-tile-empty" aria-hidden="true" />
}

// ── WeekBlock — labeled 4×3 grid ─────────────────────────────────────────────

function WeekBlock({ week, selectedId, onSelect }) {
  return (
    <div className="live-week">
      <div className="live-week__grid" role="list">
        {week.entries.map((entry, i) =>
          entry ? (
            <TileBtn
              key={entry.id}
              entry={entry}
              active={entry.id === selectedId}
              onClick={() => onSelect(entry.id)}
            />
          ) : (
            <TileEmpty key={`empty-${week.id}-${i}`} />
          )
        )}
      </div>
    </div>
  )
}

// ── LensTag — CAREER / SEASON / ALL TIME pill ────────────────────────────────

function LensTag({ lens }) {
  const slug = lens.toLowerCase().replace(/\s+/g, '-')
  return <span className={`ls-lens ls-lens--${slug}`}>{lens}</span>
}

// ── GameLine — compressed score + period + clock ─────────────────────────────

// Shorten "8:00 PM ET" → "8PM ET", "10:30 PM ET" → "10:30PM ET"
function shortTime(t) {
  if (!t) return null
  return t.replace(':00 ', '').replace(' ', '').replace('PM', 'PM ')
}

function GameLine({ game }) {
  if (!game) return null
  const { homeTeam, awayTeam, homeScore, awayScore, period, status, gameDate, gameTime } = game
  const isLive = status === 'live'
  const time   = shortTime(gameTime)
  return (
    <div className="ls-game-line">
      {isLive && <span className="ls-game-line__dot" aria-hidden="true" />}
      {gameDate && <span className="ls-game-line__date">{gameDate}</span>}
      {time && <><span className="ls-game-line__sep">·</span><span className="ls-game-line__time">{time}</span></>}
      <span className="ls-game-line__sep">·</span>
      <span className="ls-game-line__score">{awayTeam} {awayScore}–{homeScore} {homeTeam}</span>
      <span className="ls-game-line__sep">·</span>
      <span className="ls-game-line__period">{period}</span>
    </div>
  )
}

// ── Lens → color system ───────────────────────────────────────────────────────
// Matches the ls-lens--* pill colors. One source of truth for live page heat.

// Lens → color family (drives tag pills, ChaserStat colors, row bar tint)
// Must stay in sync with tileVariant() and ls-lens--* CSS classes.
const LENS_COLOR = {
  'CAREER':   'heat',    // orange — all-time permanent records
  'ALL TIME': 'heat',    // orange — same
  'SEASON':   'sacred',  // blue   — single-season, time-bounded
  'SERIES':   'blaze',   // gold   — live playoff heat
  'GAME':     'blaze',   // gold   — post-game record report
}

function lensColor(lens) {
  return LENS_COLOR[lens?.toUpperCase()] ?? 'heat'
}

// ── ChaseLine — mini SVG comparison: chaser's dot vs record ──────────────────
// Shows the closing stretch, not a 0-100% bar.
// Window anchored around the gap so it's spatially meaningful.

function ChaseLine({ current, target, lowerIsBetter, color }) {
  const dist   = Math.abs(target - current)
  // Show a window of roughly 3× the gap so both points are clearly positioned
  const buf    = Math.max(Math.round(dist * 1.5), 1)
  const lo     = lowerIsBetter ? target - buf : current - buf
  const hi     = lowerIsBetter ? current + buf : target + buf
  const range  = hi - lo

  const nowPct    = ((current - lo) / range) * 100
  const goalPct   = ((target  - lo) / range) * 100
  const leftPct   = lowerIsBetter ? goalPct : nowPct
  const rightPct  = lowerIsBetter ? nowPct  : goalPct

  // SVG dimensions (unitless — viewBox scales)
  const W = 300, H = 52, cy = 22, r = 5

  const colorVars = {
    heat:   { stroke: 'rgba(232,124,42,0.9)', dim: 'rgba(232,124,42,0.25)', track: 'rgba(255,255,255,0.08)' },
    blaze:  { stroke: 'rgba(245,193,53,0.9)', dim: 'rgba(245,193,53,0.25)', track: 'rgba(255,255,255,0.08)' },
    sacred: { stroke: 'rgba(200,220,255,0.9)', dim: 'rgba(200,220,255,0.20)', track: 'rgba(255,255,255,0.08)' },
  }
  const c = colorVars[color] ?? colorVars.heat

  const x  = pct => pct / 100 * W
  const xN = x(nowPct), xG = x(goalPct)

  return (
    <div className="ls-chase-line" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} className="ls-chase-line__svg">
        {/* Track */}
        <line x1="0" y1={cy} x2={W} y2={cy} stroke={c.track} strokeWidth="1.5"/>
        {/* Progress fill from left edge to chaser position */}
        <line x1="0" y1={cy} x2={xN} y2={cy} stroke={c.dim} strokeWidth="2" strokeLinecap="round"/>
        {/* Gap — dotted from chaser to record */}
        <line x1={xN} y1={cy} x2={xG} y2={cy} stroke={c.stroke} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.5"/>
        {/* Chaser dot */}
        <circle cx={xN} cy={cy} r={r} fill={c.stroke}/>
        {/* Record ring */}
        <circle cx={xG} cy={cy} r={r} fill="none" stroke={c.stroke} strokeWidth="1.5" opacity="0.6"/>
        {/* Labels */}
        <text x={xN} y={H - 2} textAnchor="middle" className="ls-chase-line__label">{fmt(current)}</text>
        <text x={xG} y={H - 2} textAnchor="middle" className="ls-chase-line__label ls-chase-line__label--goal">{fmt(target)}</text>
      </svg>
    </div>
  )
}

// ── ChaserStat — option 14: two stacked rows, progress bar in chaser row ──────

function ChaserStat({ chaser, chaserName, chaserTeam, chaserOpponent }) {
  const dist      = chaseDistance(chaser)
  const hasTarget = Boolean(chaser.target)
  const color     = lensColor(chaser.lens)
  const pct       = hasTarget ? Math.round(chasePct(chaser) ?? 0) : null

  // For decimal stats (SV%, ERA) format the gap as a percentage string, not a bare decimal
  const isDecimalStat = hasTarget && chaser.target != null && chaser.target < 10
  const heroNum = hasTarget
    ? (chaser.remaining != null
        ? chaser.remaining
        : isDecimalStat
          ? (Math.abs(chaser.target - (chaser.current ?? 0)) * 1000).toFixed(0) + ' points'
          : fmt(dist))
    : fmt(chaser.current)

  return (
    <div className={`ls-cstat ls-cstat--${color}`}>

      {/* Two-row design for chasers */}
      {hasTarget && (
        <div className="ls-cstat__rows">

          {/* Record holder — neutral, trophy icon */}
          <div className="ls-cstat__row ls-cstat__row--holder">
            <Trophy size={15} className="ls-cstat__row-icon" aria-hidden="true" />
            <div className="ls-cstat__row-body">
              <span className="ls-cstat__row-eye">
                {chaser.targetLabel?.toLowerCase().includes('club')
                  ? 'Last inductee'
                  : 'Record to beat'}
              </span>
              <span className="ls-cstat__row-name">
                {chaser.holder}
                {!chaser.targetLabel?.toLowerCase().includes('club') && ` — ${fmt(chaser.target)} ${chaser.stat}`}
              </span>
              {chaser.holderTeam && (
                <span className="ls-cstat__row-meta">
                  {[chaser.holderTeam, chaser.holderYear].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          </div>

          {/* Chaser — heat, flame icon, WhatsNext-style bg bar */}
          <div className="ls-cstat__row ls-cstat__row--live" aria-label={`Chasing — ${pct}% of record`}>
            {pct != null && (
              <div className="ls-cstat__row-bar" style={{ width: `${pct}%` }} aria-hidden="true" />
            )}
            <Flame size={15} className="ls-cstat__row-icon ls-cstat__row-icon--live" aria-hidden="true" />
            <div className="ls-cstat__row-body">
              <span className="ls-cstat__row-eye ls-cstat__row-eye--live">
                {chaser.lowerIsBetter
                  ? chaser.current < chaser.target
                    ? `Holding below the record · ${fmt(chaser.current)} ${chaser.stat}`
                    : `Not yet in record territory · ${fmt(chaser.current)} ${chaser.stat}`
                  : `Chasing · ${heroNum} to go`
                }
              </span>
              <span className="ls-cstat__row-name ls-cstat__row-name--live">
                {(() => {
                  const activeSb = chaser.leaderboard?.find(m => m.active)?.sb
                  const unit = activeSb != null ? 'HR' : chaser.stat
                  const extra = activeSb != null ? ` · ${activeSb} SB` : chaser.lowerIsBetter ? ' this season' : ''
                  return `${chaserName} — ${fmt(chaser.current ?? 0)} ${unit}${extra}`
                })()}
              </span>
              <span className="ls-cstat__row-meta">{chaserTeam} · Active</span>
            </div>
          </div>

        </div>
      )}

      {/* Uncharted state — live row first (they own the record now), past record below */}
      {!hasTarget && (
        <div className="ls-cstat__rows">

          {/* Their current total */}
          <div className="ls-cstat__row ls-cstat__row--live">
            <TrendingUp size={15} className="ls-cstat__row-icon ls-cstat__row-icon--live" aria-hidden="true" />
            <div className="ls-cstat__row-body">
              <span className="ls-cstat__row-eye ls-cstat__row-eye--live">
                {chaser.prevHolder ? 'Record holder · No ceiling' : 'Series watch'}
              </span>
              <span className="ls-cstat__row-name ls-cstat__row-name--live">
                {chaserName} — {fmt(chaser.current ?? 0)} {chaser.stat}
              </span>
              <span className="ls-cstat__row-meta">
                {chaserTeam}{chaserOpponent ? ` vs ${chaserOpponent}` : ''} · {chaser.prevHolder ? 'Still climbing' : 'Finals ahead'}
              </span>
            </div>
          </div>

          {/* Previous record they broke */}
          {chaser.prevHolder && (
            <div className="ls-cstat__row ls-cstat__row--holder">
              <Trophy size={15} className="ls-cstat__row-icon" aria-hidden="true" />
              <div className="ls-cstat__row-body">
                <span className="ls-cstat__row-eye">Record they broke</span>
                <span className="ls-cstat__row-name">{chaser.prevHolder} — {fmt(chaser.prevRecord)} {chaser.stat}</span>
                <span className="ls-cstat__row-meta">
                  {chaser.prevHolderTeam} · broken in {chaser.prevBreakYear}
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Constellation — historical greats only, active player shown in chaser row */}
      {chaser.leaderboard?.filter(m => !m.active).length > 0 && (
        <div className="ls-cstat__constellation">
          <span className="ls-cstat__constellation-title">In company with the greats</span>
          <div className="ls-cstat__constellation-list">
            {chaser.leaderboard.filter(m => !m.active).map((m, i) => (
              <div key={i} className="ls-cstat__constellation-row">
                <span className="ls-cstat__constellation-rank">#{m.rank}</span>
                <span className="ls-cstat__constellation-name">{m.name}</span>
                <span className="ls-cstat__constellation-meta">
                  {m.opponent ? `${m.team} vs ${m.opponent} · ${m.year}` : `${m.team} · ${m.year}`}
                </span>
                <span className="ls-cstat__constellation-value">
                  {m.value}{m.sb != null ? ' HR' : ''}
                  {m.sb  != null && ` · ${m.sb} SB`}
                  {m.ppg != null && ` · ${m.ppg} PPG`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ── GamesAheadRow ─────────────────────────────────────────────────────────────

function GamesAheadRow({ game }) {
  return (
    <div className="lga-row">
      <span className="lga-row__date">{game.date}</span>
      <span className="lga-row__matchup">{game.matchup}</span>
      {game.note && <span className="lga-row__note">{game.note}</span>}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="ls-empty">
      <div className="ls-empty__heat-bar" aria-hidden="true" />
      <p className="ls-empty__hook">History is live.</p>
      <p className="ls-empty__text">
        Records within reach. Games on right now. Pick a number to see what's at stake tonight.
      </p>
    </div>
  )
}

// ── DetailPanel — right panel ─────────────────────────────────────────────────

// DetailPanel renders content only — card wrapper lives in LivePage for mobile sheet control.
function DetailPanel({ entry, onVote, onClear }) {
  if (!entry) return null

  const {
    number, player, sport, team, isOnWall,
    stat, game, chaser,
    gamesAhead, gamesAheadContext,
  } = entry

  const variant = tileVariant(entry)

  return (
    <div className={`ls-detail ls-detail--${variant}`}>

      {/* ── 1. Player mat: number alone on top, details below ───────────── */}
      <div className="ls-player-mat">
        <div className="ls-player-mat__top-row">
          <span className={`ls-player-mat__num ls-player-mat__num--${variant}`}>
            {number}
          </span>
          <button className="tnw-close-btn ls-player-mat__close" onClick={onClear} aria-label="Clear selection">
            <X size={14} />
          </button>
        </div>
        <div className="ls-player-mat__info">
          <h2 className="ls-player-mat__name">{player}</h2>
          <div className="ls-player-mat__sub">
            <span className="ls-player-mat__squad">
              {SPORT_LABEL[sport] ?? sport.toUpperCase()} · {team}
            </span>
            {stat && <span className="ls-player-mat__tonight">{stat}</span>}
          </div>
          <GameLine game={game} />
        </div>
      </div>

      {/* ── 2. Hook — the "why this player is here" lede ────────────────── */}
      {gamesAheadContext && (
        <p className="ls-detail__hook">{gamesAheadContext}</p>
      )}

      {/* ── 3. Chase section: lens tag + stat ───────────────────────────── */}
      {chaser && (
        <section className="ls-chase-section" aria-label="Record chase">
          <div className="ls-chase-section__header">
            <LensTag lens={chaser.lens} />
            <span className="ls-chase-section__stat-name">{chaser.stat}</span>
          </div>
          <ChaserStat
            chaser={chaser}
            chaserName={player}
            chaserTeam={team}
            chaserOpponent={game ? (game.homeTeam === team ? game.awayTeam : game.homeTeam) : null}
          />
        </section>
      )}

      {/* ── 4. Games ahead ───────────────────────────────────────────────── */}
      {gamesAhead?.length > 0 && (
        <section className="ls-games-ahead" aria-label="Games ahead">
          <div className="ls-games-ahead__header">
            <span className="ls-games-ahead__title">GAMES AHEAD</span>
          </div>
          <div className="ls-games-ahead__list">
            {gamesAhead.map(g => <GamesAheadRow key={g.id} game={g} />)}
          </div>
        </section>
      )}

      {/* Wall Watch removed — didn't fit the live context */}

    </div>
  )
}

// ── Supabase data layer ───────────────────────────────────────────────────────
// Transforms a flat live_entries row into the shape LivePage components expect.

function rowToEntry(row) {
  return {
    id:           row.id,
    number:       row.number,
    player:       row.player,
    sport:        row.sport,
    team:         row.team,
    isOnWall:     row.is_on_wall ?? false,
    chaseWeight:  row.chase_weight ?? 1,
    stat:         row.tonight_stat,
    game: (row.game_status || row.home_team || row.game_date) ? {
      homeTeam:  row.home_team,
      awayTeam:  row.away_team,
      homeScore: row.home_score ?? 0,
      awayScore: row.away_score ?? 0,
      period:    row.period,
      status:    row.game_status ?? 'upcoming',
      gameDate:  row.game_date,
      gameTime:  row.game_time,
    } : null,
    chaser: row.stat_name ? {
      lens:           row.lens,
      stat:           row.stat_name,
      current:        row.current_stat,
      target:         row.target ?? null,
      targetLabel:    row.target_label ?? null,
      holder:         row.holder ?? null,
      holderTeam:     row.holder_team ?? null,
      holderYear:     row.holder_year ?? null,
      remaining:      row.remaining ?? null,
      lowerIsBetter:  row.lower_is_better ?? false,
      prevHolder:     row.prev_holder ?? null,
      prevHolderTeam: row.prev_holder_team ?? null,
      prevRecord:     row.prev_record ?? null,
      prevBreakYear:  row.prev_break_year ?? null,
      leaderboard:    row.leaderboard ?? null,
    } : null,
    wallWatchVotes:    null,
    gamesAheadContext: row.games_ahead_context ?? null,
    gamesAhead:        row.games_ahead ?? [],
  }
}

// Groups sorted rows into the WEEKS array shape the component renders.
function rowsToWeeks(rows) {
  const grouped = {}
  for (const row of rows) {
    const key = row.week_of
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(rowToEntry(row))
  }

  const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))
  return dates.map((date, i) => {
    const entries = grouped[date]
    const padded  = [...entries, ...Array(Math.max(0, 24 - entries.length)).fill(null)]
    return {
      id:            `week-${date}`,
      weekOf:        new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isCurrentWeek: i === 0,
      entries:       padded.slice(0, 24),
    }
  })
}

// Fetches live_entries + subscribes to Realtime updates.
function useLiveEntries() {
  const [weeks,   setWeeks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    supabase
      .from('live_entries')
      .select('*')
      .eq('active', true)
      .order('week_of', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('live_entries fetch:', error)
        setWeeks(data?.length ? rowsToWeeks(data) : [])
        setLoading(false)
      })

    // Realtime — stat updates push immediately to every open tab
    const channel = supabase
      .channel('live_entries_updates')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'live_entries',
        filter: 'active=eq.true',
      }, (payload) => {
        const updated = rowToEntry(payload.new)
        setWeeks(prev => prev.map(week => ({
          ...week,
          entries: week.entries.map(e => e?.id === updated.id ? updated : e),
        })))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return { weeks, loading }
}

// ── useSwipeDown — mirrors PlayerPanel exactly ────────────────────────────────
// Tracks vertical touch drag on the panel. Swipe down > 80px → close.

function useSwipeDown(panelRef, onClose) {
  const startY   = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

  const onTouchStart = useCallback((e) => {
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
    el.style.transition = ''
    if (dy > 80) {
      el.style.transform = 'translateY(100%)'
      setTimeout(onClose, 200)
    } else {
      el.style.transform = ''
    }
  }, [panelRef, onClose])

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    if (window.matchMedia('(min-width: 768px)').matches) return
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: true })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const { weeks, loading }          = useLiveEntries()
  const [votes, setVotes]           = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const detailRef       = useRef(null)
  const hasAutoSelected = useRef(false)   // prevents re-select after user clears
  const handleClear     = useCallback(() => setSelectedId(null), [])

  // Auto-select first entry on initial load only — not after user clears
  useEffect(() => {
    if (!hasAutoSelected.current && weeks.length > 0) {
      const first = weeks[0]?.entries.find(Boolean)
      if (first) {
        setSelectedId(first.id)
        hasAutoSelected.current = true
      }
    }
  }, [weeks])

  // Flatten all entries for lookup + live count
  const entryMap = useMemo(() => buildEntryMap(weeks), [weeks])

  const selectedEntry = useMemo(() => {
    const base = entryMap.get(selectedId)
    if (!base) return null
    const savedVotes = votes[selectedId]
    if (!savedVotes || !base.wallWatchVotes) return base
    return { ...base, wallWatchVotes: { ...base.wallWatchVotes, ...savedVotes } }
  }, [selectedId, votes, entryMap])

  // All tracked entries = "in play" — not just those with live game status
  const liveCount = useMemo(() => entryMap.size, [entryMap])

  useSwipeDown(detailRef, handleClear)

  function handleVote(entryId, dir) {
    setVotes(prev => {
      const base     = entryMap.get(entryId)
      if (!base?.wallWatchVotes) return prev
      const current  = prev[entryId] ?? { netScore: base.wallWatchVotes.netScore, myVote: null }
      const prevVote = current.myVote
      const newVote  = prevVote === dir ? null : dir
      const delta    = (newVote ?? 0) - (prevVote ?? 0)
      return {
        ...prev,
        [entryId]: { netScore: current.netScore + delta, myVote: newVote },
      }
    })
  }

  return (
    <AppShell>
      <AppHeader liveCount={liveCount} />

      {/* ── Page placemat ────────────────────────────────────────────────── */}
      <div className="live-placemat">
        <h1 className="live-placemat__title">This week on the wall</h1>
        <div className="live-placemat__meta">
          <span className="live-placemat__live-dot" aria-hidden="true" />
          <span className="live-placemat__count">
            {liveCount} number{liveCount !== 1 ? 's' : ''} in play
          </span>
          <span className="live-placemat__sep">·</span>
          <span className="live-placemat__date">{todayLabel()}</span>
        </div>
      </div>

      {/* ── Split ────────────────────────────────────────────────────────── */}
      <div className="live-split">

        {/* Left: stacked weekly grids */}
        <aside className="live-split__col" aria-label="Numbers by week">
          <div className="live-weeks">
            {loading && <AppLoading text="TRACKING HISTORY" />}
            {weeks.map(week => (
              <WeekBlock
                key={week.id}
                week={week}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </aside>

        {/* Right: detail — card always in DOM so mobile slide animation works */}
        <main className="live-split__detail" aria-label="Number detail">
          <div
            ref={detailRef}
            className={`ls-detail-card${!selectedEntry ? ' ls-detail-card--idle' : ''}`}
          >
            <div className="ls-detail-card__handle" aria-hidden="true" />
            {selectedEntry
              ? <DetailPanel entry={selectedEntry} onVote={handleVote} onClear={handleClear} />
              : <EmptyState />
            }
          </div>
        </main>

      </div>

      {/* Mobile backdrop — dims grid when sheet is open */}
      {selectedEntry && (
        <div
          className="tnw-backdrop live-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}

      {/* Mobile idle state — flows in content between grid and screen bottom */}
      {!selectedEntry && (
        <div className="ls-mobile-idle">
          <div className="ls-empty__heat-bar" aria-hidden="true" />
          <p className="ls-empty__hook">History is live.</p>
        </div>
      )}
    </AppShell>
  )
}
