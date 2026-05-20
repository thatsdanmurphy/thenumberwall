/**
 * LivePage — /live
 *
 * ESPN tells you the score and forgets tomorrow.
 * The wall tells you what tonight means and carries it forward.
 *
 * Sections:
 *   1. Page header — "TONIGHT ON THE WALL"
 *   2. Chaser strip — horizontal scroll of ChaserCards (records in reach tonight)
 *   3. Game cards — historically significant games only, sorted by wall weight
 */

import { useState } from 'react'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import ChaserCard  from '../components/ChaserCard.jsx'
import LiveGameCard from '../components/LiveGameCard.jsx'
import './LivePage.css'

// ── Static mock data — replace with live API hook in Task #6 ─────────────────

const MOCK_CHASERS = [
  {
    id: 'ovi-goals',
    player: 'Alex Ovechkin',
    number: 8,
    sport: 'nhl',
    team: 'WSH',
    stat: 'Goals',
    variant: 'record-approach',
    lens: 'CAREER',
    current: 878,
    target: 894,
    targetLabel: 'Gretzky All-Time',
    singleGameOutput: 2,           // realistic max goals in one game
    isPlaying: true,
  },
  {
    id: 'lebron-points',
    player: 'LeBron James',
    number: 23,
    sport: 'nba',
    team: 'LAL',
    stat: 'Points',
    variant: 'uncharted',
    lens: 'CAREER',
    current: 40842,
    contextLine: 'No ceiling. No map. Just distance.',
    singleGameOutput: 40,
    isPlaying: false,
  },
  {
    id: 'degrom-era',
    player: 'Jacob deGrom',
    number: 48,
    sport: 'mlb',
    team: 'TEX',
    stat: 'ERA',
    variant: 'record-approach',
    lens: 'SEASON',
    current: 0.56,
    target: 1.12,
    targetLabel: 'Single-Season Record',
    singleGameOutput: 0.20,
    isPlaying: true,
    statDir: 'lower-is-better',
  },
]

const MOCK_GAMES = [
  {
    id: 'wsh-nyr-g5',
    sport: 'nhl',
    homeTeam: 'NYR',
    awayTeam: 'WSH',
    homeScore: 2,
    awayScore: 1,
    period: '2nd',
    clock: '8:42',
    status: 'live',
    wallWeight: 98,
    headline: 'Ovechkin 16 goals away from Gretzky',
    players: [
      {
        id: 'ovi',
        name: 'Alex Ovechkin',
        number: 8,
        team: 'WSH',
        isOnWall: true,
        stat: '1G, 0A tonight',
        chaser: { stat: 'Goals', current: 878, target: 894, targetLabel: "Gretzky All-Time" },
      },
    ],
  },
  {
    id: 'lal-gsw',
    sport: 'nba',
    homeTeam: 'LAL',
    awayTeam: 'GSW',
    homeScore: 67,
    awayScore: 71,
    period: '3rd',
    clock: '4:11',
    status: 'live',
    wallWeight: 90,
    headline: 'LeBron uncharted — 40K and counting',
    players: [
      {
        id: 'lebron',
        name: 'LeBron James',
        number: 23,
        team: 'LAL',
        isOnWall: true,
        stat: '22 PTS tonight',
        chaser: null,
      },
      {
        id: 'curry',
        name: 'Steph Curry',
        number: 30,
        team: 'GSW',
        isOnWall: true,
        stat: '18 PTS, 6 3PM tonight',
        chaser: null,
      },
    ],
  },
  {
    id: 'tex-hou',
    sport: 'mlb',
    homeTeam: 'TEX',
    awayTeam: 'HOU',
    homeScore: 2,
    awayScore: 3,
    period: 'Bot 6',
    clock: null,
    status: 'live',
    wallWeight: 72,
    headline: 'deGrom ERA watch — 0.56 through 6',
    players: [
      {
        id: 'degrom',
        name: 'Jacob deGrom',
        number: 48,
        team: 'TEX',
        isOnWall: false,
        stat: '6 IP, 0 ER, 9 K tonight',
        wallWatchVotes: { netScore: 47, myVote: null },
        chaser: { stat: 'ERA', current: 0.56, target: 1.12, targetLabel: 'Season Record' },
      },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function LivePage() {
  const [chasers, setChasers]   = useState(MOCK_CHASERS)
  const [games, setGames]       = useState(MOCK_GAMES)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // TODO Task #6: replace mock data with ESPN + league API polling
  // useEffect(() => { ... poll every 30s ... }, [])

  const liveCount = games.filter(g => g.status === 'live').length

  return (
    <AppShell>
      {/* AppHeader hidden on /live itself — the page IS the live experience */}
      <AppHeader />

      <div className="live-page">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <header className="live-page__header">
          <div className="live-page__header-inner">
            <div className="live-page__eyebrow">
              <span className="live-page__live-dot" aria-hidden="true" />
              <span className="live-page__live-label">LIVE</span>
              <span className="live-page__game-count">
                {liveCount} game{liveCount !== 1 ? 's' : ''} on the wall tonight
              </span>
            </div>
            <h1 className="live-page__title">TONIGHT ON THE WALL</h1>
            <p className="live-page__lede">
              ESPN tells you the score. We tell you what it means.
            </p>
          </div>
        </header>

        {/* ── Chaser strip ───────────────────────────────────────────────── */}
        {chasers.length > 0 && (
          <section className="live-page__section live-page__section--chasers" aria-label="Records in reach tonight">
            <div className="live-page__section-label">
              <span className="tnw-eyebrow">RECORDS IN REACH</span>
            </div>
            <div className="live-page__chaser-strip">
              {chasers.map(chaser => (
                <ChaserCard key={chaser.id} {...chaser} />
              ))}
            </div>
          </section>
        )}

        {/* ── Game cards ─────────────────────────────────────────────────── */}
        <section className="live-page__section live-page__section--games" aria-label="Games on the wall tonight">
          <div className="live-page__section-label">
            <span className="tnw-eyebrow">GAMES ON THE WALL</span>
            <span className="live-page__refresh-time">
              Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {games.length === 0 ? (
            <div className="live-page__empty">
              <p className="live-page__empty-text">
                No wall-weight games tonight. Check back when legends are playing.
              </p>
            </div>
          ) : (
            <div className="live-page__game-list">
              {games
                .sort((a, b) => b.wallWeight - a.wallWeight)
                .map(game => (
                  <LiveGameCard key={game.id} {...game} />
                ))}
            </div>
          )}
        </section>

      </div>
    </AppShell>
  )
}
