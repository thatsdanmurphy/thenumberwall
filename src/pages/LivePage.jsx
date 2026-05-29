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

import { useState, useMemo } from 'react'
import AppShell              from '../components/AppShell.jsx'
import AppHeader             from '../components/AppHeader.jsx'
import VoteButtons           from '../components/VoteButtons.jsx'
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
      {
        id: 'ovi',
        number: 8,
        player: 'Alex Ovechkin',
        sport: 'nhl',
        team: 'WSH',
        isOnWall: true,
        stat: '1G, 0A tonight',
        headline: 'Ovechkin 16 goals away from the all-time record.',
        game: {
          homeTeam: 'NYR', awayTeam: 'WSH',
          homeScore: 2,    awayScore: 1,
          period: '2nd',  clock: '8:42', status: 'live',
        },
        chaser: {
          lens: 'CAREER',
          stat: 'Goals',
          current: 878,
          target: 894,
          targetLabel: 'Gretzky All-Time',
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'At his 2025–26 pace of 0.8 goals per game',
        gamesAhead: [
          { id: 'g1', date: 'May 23', matchup: 'vs PIT', remaining: 14, projected: false, note: null },
          { id: 'g2', date: 'May 25', matchup: '@TOR',   remaining: 12, projected: false, note: null },
          { id: 'g3', date: 'May 28', matchup: 'vs MTL', remaining: 10, projected: false, note: null },
          { id: 'g4', date: 'Jun 4',  matchup: 'vs DET', remaining:  4, projected: false, note: null },
          { id: 'g5', date: 'Jun 7',  matchup: 'vs NYR', remaining:  2, projected: true,  note: 'Record night?' },
          { id: 'g6', date: 'Jun 10', matchup: '@PHI',   remaining:  0, projected: true,  note: 'Record falls here' },
        ],
      },
      {
        id: 'lebron',
        number: 23,
        player: 'LeBron James',
        sport: 'nba',
        team: 'LAL',
        isOnWall: true,
        stat: '22 PTS tonight',
        headline: 'LeBron uncharted — 40,842 points and no ceiling in sight.',
        game: {
          homeTeam: 'LAL', awayTeam: 'GSW',
          homeScore: 67,   awayScore: 71,
          period: '3rd',  clock: '4:11', status: 'live',
        },
        chaser: {
          lens: 'CAREER',
          stat: 'Points',
          current: 40842,
          target: null,
          targetLabel: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'At 27 points per game this season',
        gamesAhead: [
          { id: 'g1', date: 'May 23', matchup: 'vs CLE', remaining: null, projected: false, note: '~158 pts from 41,000' },
          { id: 'g2', date: 'May 25', matchup: '@MEM',   remaining: null, projected: false, note: '~131 pts from 41,000' },
          { id: 'g3', date: 'Jun 1',  matchup: 'vs DEN', remaining: null, projected: true,  note: '41,000 career points — milestone night' },
        ],
      },
      {
        id: 'curry',
        number: 30,
        player: 'Steph Curry',
        sport: 'nba',
        team: 'GSW',
        isOnWall: true,
        stat: '18 PTS, 6 3PM tonight',
        headline: 'Curry rewrote the three-point record — every game adds to an unreachable lead.',
        game: {
          homeTeam: 'LAL', awayTeam: 'GSW',
          homeScore: 67,   awayScore: 71,
          period: '3rd',  clock: '4:11', status: 'live',
        },
        chaser: {
          lens: 'CAREER',
          stat: '3-Pointers',
          current: 3747,
          target: null,
          targetLabel: null,
          lowerIsBetter: false,
        },
        wallWatchVotes: null,
        gamesAheadContext: 'Extending his own unbreakable record',
        gamesAhead: [
          { id: 'g1', date: 'May 23', matchup: 'vs LAL', remaining: null, projected: false, note: 'Every make is history' },
          { id: 'g2', date: 'May 25', matchup: '@LAL',   remaining: null, projected: true,  note: '3,800 threes — in reach this month' },
        ],
      },
      {
        id: 'degrom',
        number: 48,
        player: 'Jacob deGrom',
        sport: 'mlb',
        team: 'TEX',
        isOnWall: false,
        stat: '6 IP, 0 ER, 9 K tonight',
        headline: "deGrom ERA watch — 0.56 this season, chasing Dutch Leonard's 1.01 all-time record.",
        game: {
          homeTeam: 'TEX', awayTeam: 'HOU',
          homeScore: 2,    awayScore: 3,
          period: 'Bot 6', clock: null, status: 'live',
        },
        chaser: {
          lens: 'SEASON',
          stat: 'ERA',
          current: 0.56,
          target: 1.01,
          targetLabel: 'Single-Season Record',
          lowerIsBetter: true,
        },
        wallWatchVotes: { netScore: 47, myVote: null },
        gamesAheadContext: 'Next scheduled starts — ERA must hold',
        gamesAhead: [
          { id: 'g1', date: 'May 24', matchup: '@HOU',   remaining: null, projected: false, note: '6 IP, 0 ER → ERA drops to 0.47' },
          { id: 'g2', date: 'Jun 1',  matchup: 'vs LAD', remaining: null, projected: false, note: 'Toughest test — Dodger lineup' },
          { id: 'g3', date: 'Jun 8',  matchup: 'vs COL', remaining: null, projected: true,  note: 'Best shot at locking the record' },
        ],
      },
      // 8 empty slots — week has room to grow
      null, null, null, null,
      null, null, null, null,
    ],
  },
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

function tileVariant(entry) {
  if (entry.isOnWall) return 'legend'
  if (entry.chaser)   return 'chaser'
  return 'watch'
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

function TileBtn({ entry, active, isPast, onClick }) {
  const variant = tileVariant(entry)
  const isLive  = entry.game?.status === 'live'

  return (
    <button
      className={[
        'ls-tile-btn',
        `ls-tile-btn--${variant}`,
        active  ? 'ls-tile-btn--active' : '',
        isPast  ? 'ls-tile-btn--past'   : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${entry.player}, number ${entry.number}`}
    >
      {entry.number}
      {isLive && <span className="ls-tile-btn__dot" aria-hidden="true" />}
    </button>
  )
}

// ── TileEmpty — dashed placeholder ───────────────────────────────────────────

function TileEmpty() {
  return <div className="ls-tile-empty" aria-hidden="true" />
}

// ── WeekBlock — labeled 4×3 grid ─────────────────────────────────────────────

function WeekBlock({ week, selectedId, onSelect }) {
  const isPastWeek = !week.isCurrentWeek

  return (
    <div className={`live-week${isPastWeek ? ' live-week--past' : ''}`}>
      <div className="live-week__label">
        {week.isCurrentWeek ? 'This week' : `Week of ${week.weekOf}`}
      </div>
      <div className="live-week__grid" role="list">
        {week.entries.map((entry, i) =>
          entry ? (
            <div key={entry.id} role="listitem">
              <TileBtn
                entry={entry}
                active={entry.id === selectedId}
                isPast={isPastWeek}
                onClick={() => onSelect(entry.id)}
              />
            </div>
          ) : (
            <div key={`empty-${week.id}-${i}`} role="listitem">
              <TileEmpty />
            </div>
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

function GameLine({ game, sport }) {
  if (!game) return null
  const { homeTeam, awayTeam, homeScore, awayScore, period, clock, status } = game
  const isLive = status === 'live'
  return (
    <div className="ls-game-line">
      {isLive && <span className="ls-game-line__dot" aria-hidden="true" />}
      <span className="ls-game-line__sport">{SPORT_LABEL[sport] ?? sport.toUpperCase()}</span>
      <span className="ls-game-line__sep">·</span>
      <span className="ls-game-line__score">{awayTeam} {awayScore}–{homeScore} {homeTeam}</span>
      <span className="ls-game-line__sep">·</span>
      <span className="ls-game-line__period">{period}</span>
      {clock && (
        <>
          <span className="ls-game-line__sep">·</span>
          <span className="ls-game-line__clock">{clock}</span>
        </>
      )}
    </div>
  )
}

// ── ChaserBar — progress track ────────────────────────────────────────────────

function ChaserBar({ chaser }) {
  const pct         = chasePct(chaser)
  const dist        = chaseDistance(chaser)
  const isUncharted = !chaser.target

  return (
    <div className="ls-chaser">
      <div className={`ls-chaser__track${isUncharted ? ' ls-chaser__track--uncharted' : ''}`}>
        {isUncharted ? (
          <>
            <div className="ls-chaser__fade-fill" />
            <div className="ls-chaser__fade-dot" />
            <span className="ls-chaser__horizon">∞</span>
          </>
        ) : (
          <>
            <div className="ls-chaser__fill" style={{ width: `${pct}%` }} />
            <div className="ls-chaser__dot"  style={{ left:  `${pct}%` }} />
          </>
        )}
      </div>

      <div className="ls-chaser__footer">
        <span className="ls-chaser__current">{fmt(chaser.current)} {chaser.stat}</span>
        {dist != null && chaser.targetLabel && (
          <span className="ls-chaser__to-go">
            {fmt(dist)} {chaser.lowerIsBetter ? 'below' : 'away from'} {chaser.targetLabel}
          </span>
        )}
        {isUncharted && (
          <span className="ls-chaser__to-go">Uncharted — no ceiling</span>
        )}
      </div>
    </div>
  )
}

// ── GamesAheadRow ─────────────────────────────────────────────────────────────

function GamesAheadRow({ game }) {
  return (
    <div className={`lga-row${game.projected ? ' lga-row--projected' : ''}`}>
      <span className="lga-row__date">{game.date}</span>
      <span className="lga-row__matchup">{game.matchup}</span>
      <div className="lga-row__right">
        {game.remaining != null && game.remaining > 0 && (
          <span className="lga-row__remaining">{game.remaining} to go</span>
        )}
        {game.note && (
          <span className="lga-row__note">{game.note}</span>
        )}
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="ls-empty">
      <p className="ls-empty__text">Select a number to see what's at stake tonight.</p>
    </div>
  )
}

// ── DetailPanel — right panel ─────────────────────────────────────────────────

function DetailPanel({ entry, onVote }) {
  if (!entry) return <EmptyState />

  const {
    number, player, sport, team, isOnWall,
    stat, headline, game, chaser, wallWatchVotes,
    gamesAhead, gamesAheadContext,
  } = entry

  const variant = tileVariant(entry)

  return (
    <div className={`ls-detail ls-detail--${variant}`}>

      {/* ── 1. Player mat: number + identity + game + tonight ────────────── */}
      <div className="ls-player-mat">
        <span className={`ls-player-mat__num ls-player-mat__num--${variant}`}>
          {number}
        </span>
        <div className="ls-player-mat__info">
          <h2 className="ls-player-mat__name">{player}</h2>
          <span className="ls-player-mat__squad">
            {SPORT_LABEL[sport] ?? sport.toUpperCase()} · {team}
          </span>
          <GameLine game={game} sport={sport} />
        </div>
        <div className="ls-player-mat__tonight-col">
          <span className="ls-player-mat__tonight">{stat}</span>
        </div>
      </div>

      {/* ── 2. Chase section: lens + headline + bar ──────────────────────── */}
      {chaser ? (
        <section className="ls-chase-section" aria-label="Record chase">
          <div className="ls-chase-section__header">
            <LensTag lens={chaser.lens} />
            <span className="ls-chase-section__stat-name">{chaser.stat}</span>
          </div>
          <p className="ls-detail__headline">{headline}</p>
          <ChaserBar chaser={chaser} />
        </section>
      ) : (
        <p className="ls-detail__headline">{headline}</p>
      )}

      {/* ── 3. Games ahead ───────────────────────────────────────────────── */}
      {gamesAhead?.length > 0 && (
        <section className="ls-games-ahead" aria-label="Games ahead">
          <div className="ls-games-ahead__header">
            <span className="ls-games-ahead__title">GAMES AHEAD</span>
            {gamesAheadContext && (
              <span className="ls-games-ahead__context">{gamesAheadContext}</span>
            )}
          </div>
          <div className="ls-games-ahead__list">
            {gamesAhead.map(g => <GamesAheadRow key={g.id} game={g} />)}
          </div>
        </section>
      )}

      {/* ── 4. Wall Watch ────────────────────────────────────────────────── */}
      {!isOnWall && wallWatchVotes && (
        <div className="ls-detail__wall-watch">
          <span className="ls-detail__wall-watch-tag">WALL WATCH</span>
          <div className="ls-detail__wall-watch-body">
            <span className="ls-detail__wall-watch-tally">
              {wallWatchVotes.netScore > 0 ? '+' : ''}{wallWatchVotes.netScore} say they belong
            </span>
            <VoteButtons
              netScore={wallWatchVotes.netScore}
              myVote={wallWatchVotes.myVote}
              onVote={(dir) => onVote(entry.id, dir)}
              playerName={player}
              number={number}
              compact
            />
          </div>
        </div>
      )}

    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LivePage() {
  // Votes are the only mutable part — keep a separate map so WEEKS stays pure
  const [votes, setVotes]         = useState({})
  const [selectedId, setSelectedId] = useState(
    WEEKS[0]?.entries.find(Boolean)?.id ?? null
  )

  // Flatten all entries for lookup + live count
  const entryMap = useMemo(() => buildEntryMap(WEEKS), [])

  // Merge stored votes into entry for the detail panel
  const selectedEntry = useMemo(() => {
    const base = entryMap.get(selectedId)
    if (!base) return null
    const savedVotes = votes[selectedId]
    if (!savedVotes || !base.wallWatchVotes) return base
    return { ...base, wallWatchVotes: { ...base.wallWatchVotes, ...savedVotes } }
  }, [selectedId, votes, entryMap])

  const liveCount = useMemo(() =>
    [...entryMap.values()].filter(e => e.game?.status === 'live').length,
  [entryMap])

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
        <h1 className="live-placemat__title">Tonight on the wall</h1>
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
            {WEEKS.map(week => (
              <WeekBlock
                key={week.id}
                week={week}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </aside>

        {/* Right: detail */}
        <main className="live-split__detail" aria-label="Number detail">
          <DetailPanel entry={selectedEntry} onVote={handleVote} />
        </main>

      </div>
    </AppShell>
  )
}
