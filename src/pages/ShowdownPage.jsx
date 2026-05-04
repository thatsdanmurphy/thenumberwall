import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell         from '../components/AppShell.jsx'
import AppHeader        from '../components/AppHeader.jsx'
import AppFooter        from '../components/AppFooter.jsx'
import ShowdownScrubber from '../components/ShowdownScrubber.jsx'
import FieldView        from '../components/FieldView.jsx'
import alcs2004         from '../data/showdowns/alcs2004.json'
import './ShowdownPage.css'

const SHOWDOWNS = { 'alcs-2004': alcs2004 }

const TEAM_ACCENT = { BOS: 'rgba(245,95,105,0.92)', NYY: 'rgba(160,200,255,0.92)' }

// ── Play intensity ────────────────────────────────────────────────────────────
function playIntensity(play) {
  if (!play) return 'normal'
  if (play.isSeriesEnd) return 'win'
  if (play.note && (play.note.includes('WALKOFF') || play.note.includes('GRAND SLAM'))) return 'big'
  if (play.result === 'HR') return 'hr'
  if (play.result === 'K')  return 'k'
  if (['S','D','T'].includes(play.result)) return 'hit'
  return 'normal'
}

// ── Stat sets ─────────────────────────────────────────────────────────────────
const HIT_RESULTS = new Set(['S','D','T','HR'])
const AB_RESULTS  = new Set(['S','D','T','HR','OUT','DP','SF','SH','K','FC','E'])
const OUT_RESULTS = new Set(['OUT','SF','SH','K','FC'])

const fmtIP = outs => `${Math.floor(outs / 3)}.${outs % 3}`

// ── Series stats (across all games) ──────────────────────────────────────────
function computeSeriesStats(plays, upToIdx) {
  const bat = {}
  const pit = {}

  for (let i = 0; i <= upToIdx; i++) {
    const p = plays[i]; if (!p) break

    const bid = p.batter?.pid
    if (bid) {
      if (!bat[bid]) bat[bid] = { ab:0, h:0, hr:0, k:0, bb:0, hp:0, d:0, t:0 }
      const s = bat[bid]
      if (AB_RESULTS.has(p.result))              s.ab++
      if (HIT_RESULTS.has(p.result))             s.h++
      if (p.result === 'HR')                     s.hr++
      if (p.result === 'K')                      s.k++
      if (p.result === 'W' || p.result === 'IW') s.bb++
      if (p.result === 'HP')                     s.hp++
      if (p.result === 'D')                      s.d++
      if (p.result === 'T')                      s.t++
    }

    const ppid = p.pitcher?.pid
    if (ppid && !['SB','CS','BK','WP','PB','DI','NP'].includes(p.result)) {
      if (!pit[ppid]) pit[ppid] = { outs:0, kp:0, hp_a:0, bb_a:0, hr_a:0 }
      const s = pit[ppid]
      if (OUT_RESULTS.has(p.result))             { s.outs++; if (p.result === 'DP') s.outs++ }
      if (p.result === 'K')                      s.kp++
      if (HIT_RESULTS.has(p.result))             s.hp_a++
      if (p.result === 'W' || p.result === 'IW') s.bb_a++
      if (p.result === 'HR')                     s.hr_a++
    }
  }
  return { bat, pit }
}

function getSeriesStatLine(pid, role, seriesStats) {
  if (!pid || !seriesStats) return null
  if (role === 'pitcher') {
    const s = seriesStats.pit[pid]
    if (!s) return null
    const parts = [`${fmtIP(s.outs)} IP`, `${s.kp} K`]
    if (s.hr_a)      parts.push(`${s.hr_a} HR`)
    else if (s.hp_a) parts.push(`${s.hp_a} H`)
    return parts.join(' · ')
  }
  const s = seriesStats.bat[pid]
  if (!s || s.ab === 0) return null
  const avg = (s.h / s.ab).toFixed(3).replace('0.', '.')
  const parts = [`${avg}  ${s.h}-${s.ab}`]
  if (s.hr) parts.push(`${s.hr} HR`)
  if (s.d)  parts.push(`${s.d} 2B`)
  if (s.t)  parts.push(`${s.t} 3B`)
  return parts.join(' · ')
}

// ── Live running score ────────────────────────────────────────────────────────
function computeRunningScore(plays, upToIdx) {
  const scores = {}
  let bases     = { '1B': null, '2B': null, '3B': null }
  let outs      = 0
  let lastHalf  = null

  for (let i = 0; i <= upToIdx; i++) {
    const p = plays[i]
    if (!p?.batter) continue
    const g    = p.game
    const team = p.batter.team
    if (!scores[g]) scores[g] = { BOS: 0, NYY: 0 }

    const hk = `${g}-${p.inning}-${p.half}`
    if (hk !== lastHalf) { bases = { '1B': null, '2B': null, '3B': null }; outs = 0; lastHalf = hk }

    const b = { pid: p.batter.pid, number: p.batter.number, team }
    let runs = 0

    switch (p.result) {
      case 'HR': {
        runs = [bases['1B'], bases['2B'], bases['3B']].filter(Boolean).length + 1
        bases = { '1B': null, '2B': null, '3B': null }; break
      }
      case 'T': {
        runs = [bases['1B'], bases['2B'], bases['3B']].filter(Boolean).length
        bases = { '1B': null, '2B': null, '3B': b }; break
      }
      case 'D': {
        if (bases['3B']) runs++
        if (bases['2B']) runs++
        bases = { '1B': null, '2B': b, '3B': bases['1B'] ?? null }; break
      }
      case 'S': {
        if (bases['3B']) runs++
        bases = { '1B': b, '2B': bases['1B'], '3B': null }; break
      }
      case 'W': case 'HP': case 'IW': {
        if (bases['1B'] && bases['2B'] && bases['3B']) runs++
        if (bases['1B'] && bases['2B']) bases['3B'] = bases['2B']
        if (bases['1B']) bases['2B'] = bases['1B']
        bases['1B'] = b; break
      }
      case 'SF': {
        if (bases['3B']) runs++
        outs++
        bases = { '1B': bases['2B'], '2B': null, '3B': null }; break
      }
      case 'SH':   { outs++; bases = { '1B': bases['2B'] ?? bases['1B'] ?? null, '2B': null, '3B': null }; break }
      case 'K': case 'OUT': { outs++; break }
      case 'DP': {
        outs += 2
        if (bases['3B'] && outs < 3) runs++
        bases = { '1B': null, '2B': null, '3B': null }; break
      }
      case 'FC': case 'E': {
        bases = { '1B': b, '2B': bases['1B'], '3B': bases['2B'] }
        if (p.result === 'FC') outs++; break
      }
      case 'SB': {
        if (bases['2B']) { bases['3B'] = bases['2B']; bases['2B'] = null }
        else if (bases['1B']) { bases['2B'] = bases['1B']; bases['1B'] = null }
        break
      }
      case 'CS': {
        if (bases['2B']) bases['2B'] = null
        else if (bases['1B']) bases['1B'] = null
        outs++; break
      }
      default: break
    }

    if (runs > 0) scores[g][team] += runs
    if (outs >= 3) { bases = { '1B': null, '2B': null, '3B': null }; outs = 0 }
  }
  return scores
}

// ── Outs in current half-inning ───────────────────────────────────────────────
function computeCurrentOuts(plays, upToIdx) {
  if (!plays[upToIdx]) return 0
  const p  = plays[upToIdx]
  const hk = `${p.game}-${p.inning}-${p.half}`
  let start = upToIdx
  while (start > 0 && `${plays[start-1].game}-${plays[start-1].inning}-${plays[start-1].half}` === hk) {
    start--
  }
  let outs = 0
  for (let i = start; i < upToIdx; i++) {
    const pp = plays[i]; if (!pp) break
    if (['K','OUT','SF','SH','FC'].includes(pp.result)) outs++
    else if (pp.result === 'DP') outs += 2
    else if (pp.result === 'CS') outs++
  }
  return Math.min(outs, 3)
}

// ── FieldScoreboard ───────────────────────────────────────────────────────────
function FieldScoreboard({ play, plays, position, games, gameScores }) {
  const outs    = computeCurrentOuts(plays, position)
  const gameNum = play.game ?? 1
  const game    = games[gameNum - 1]
  const inning  = play.inning ?? 1
  const isTop   = play.half === 'top'
  const bosWins = games.filter((g, i) => i < gameNum - 1 && g.winner === 'BOS').length
  const nyyWins = games.filter((g, i) => i < gameNum - 1 && g.winner === 'NYY').length
  const liveScore = gameScores?.[gameNum] ?? { BOS: 0, NYY: 0 }

  return (
    <div className="field-scoreboard">
      <div className="field-scoreboard__game">G{gameNum}</div>

      <div className="field-scoreboard__inning">
        <span className="field-scoreboard__half">{isTop ? '▲' : '▼'}</span>
        <span>{inning}</span>
      </div>

      <div className="field-scoreboard__outs-wrap">
        {[0,1,2].map(i => (
          <div key={i} className={`field-scoreboard__out${i < outs ? ' field-scoreboard__out--on' : ''}`} />
        ))}
      </div>

      <div className="field-scoreboard__divider" />

      <div className="field-scoreboard__live">
        <span className="field-scoreboard__team field-scoreboard__team--nyy">NYY</span>
        <span className="field-scoreboard__score">{liveScore.NYY}</span>
        <span className="field-scoreboard__dash">–</span>
        <span className="field-scoreboard__score">{liveScore.BOS}</span>
        <span className="field-scoreboard__team field-scoreboard__team--bos">BOS</span>
      </div>

      <div className="field-scoreboard__divider" />

      <div className="field-scoreboard__series">
        <span className="field-scoreboard__series-label">SERIES</span>
        <span className="field-scoreboard__team field-scoreboard__team--nyy">{nyyWins}</span>
        <span className="field-scoreboard__dash">—</span>
        <span className="field-scoreboard__team field-scoreboard__team--bos">{bosWins}</span>
      </div>

      {game?.venue && (
        <div className="field-scoreboard__venue">{game.venue.toUpperCase()}</div>
      )}
    </div>
  )
}

// ── FieldPlayerPanel — desktop side card ─────────────────────────────────────
function FieldPlayerPanel({ role, player, seriesLine, accentColor, intensity }) {
  if (!player?.name) {
    return <div className="field-player-panel field-player-panel--empty" />
  }

  const isPitcher = role === 'pitcher'

  const glowClass =
    intensity === 'win'                               ? ' field-player-panel--win'
    : (intensity === 'big' || intensity === 'hr') && !isPitcher ? ' field-player-panel--big'
    : intensity === 'k' && isPitcher                  ? ' field-player-panel--k'
    : ''

  return (
    <div
      className={`field-player-panel${glowClass}`}
      style={{ '--card-accent': accentColor }}
    >
      <div className="field-player-panel__role">
        {isPitcher ? 'PITCHING' : 'AT BAT'}
      </div>
      <div className="field-player-panel__num" style={{ color: accentColor }}>
        #{player.number}
      </div>
      <div className="field-player-panel__name">{player.name}</div>
      <div className="field-player-panel__pos">{player.pos}</div>
      {seriesLine && (
        <div className="field-player-panel__stats">{seriesLine}</div>
      )}
    </div>
  )
}

// ── MatchupCard — compact strip for mobile ────────────────────────────────────
function MatchupCard({ role, player, seriesLine, accentColor, intensity }) {
  if (!player?.name) {
    return <div className="field-matchup-card field-matchup-card--empty" />
  }

  const isPitcher = role === 'pitcher'

  const glowClass =
    intensity === 'win'                               ? ' field-matchup-card--win'
    : (intensity === 'big' || intensity === 'hr') && !isPitcher ? ' field-matchup-card--big'
    : intensity === 'k' && isPitcher                  ? ' field-matchup-card--k'
    : ''

  return (
    <div
      className={`field-matchup-card${glowClass}`}
      style={{ '--card-accent': accentColor }}
    >
      <div className="field-matchup-card__num" style={{ color: accentColor }}>
        #{player.number}
      </div>
      <div className="field-matchup-card__body">
        <div className="field-matchup-card__role">
          {isPitcher ? 'PITCHING' : 'AT BAT'}
        </div>
        <div className="field-matchup-card__name">{player.name}</div>
        {seriesLine && (
          <div className="field-matchup-card__stats">{seriesLine}</div>
        )}
      </div>
    </div>
  )
}

// ── SelectedTileContent — shared inner content for selected fielder ────────────
function SelectedTileContent({ tile, seriesStats }) {
  const accentColor = TEAM_ACCENT[tile.team] ?? TEAM_ACCENT.NYY
  const statLine    = getSeriesStatLine(tile.pid, 'batter', seriesStats)
    ?? getSeriesStatLine(tile.pid, 'pitcher', seriesStats)

  return (
    <>
      <div className="field-selected__num" style={{ color: accentColor }}>
        #{tile.number}
      </div>
      <div className="field-selected__body">
        <div className="field-selected__name">{tile.name}</div>
        <div className="field-selected__pos">{tile.pos}</div>
        {statLine && (
          <div className="field-selected__stats">{statLine}</div>
        )}
      </div>
    </>
  )
}

// ── ShowdownPage ──────────────────────────────────────────────────────────────
export default function ShowdownPage() {
  const navigate       = useNavigate()
  const { showdownId } = useParams()

  const data = SHOWDOWNS[showdownId] ?? SHOWDOWNS['alcs-2004']
  const { plays, gameStarts, games } = data

  const [position,     setPosition]     = useState(0)
  const [selectedTile, setSelectedTile] = useState(null)

  // Clear selected tile when play advances
  useEffect(() => { setSelectedTile(null) }, [position])

  useEffect(() => {
    document.title = `${data.title} — Showdowns | The Number Wall`
    track('showdown_view', { id: data.id })
  }, [data])

  const currentPlay = plays[position] ?? {}
  const intensity   = playIntensity(currentPlay)

  const seriesStats = useMemo(() => computeSeriesStats(plays, position), [plays, position])
  const gameScores  = useMemo(() => computeRunningScore(plays, position), [plays, position])

  const extraZones = useMemo(() => {
    const zones = []
    let zoneStart = null
    for (let i = 0; i < plays.length; i++) {
      const inExtra = plays[i].inning > 9
      if (inExtra && zoneStart === null) zoneStart = i
      if (!inExtra && zoneStart !== null) { zones.push({ start: zoneStart, end: i - 1 }); zoneStart = null }
    }
    if (zoneStart !== null) zones.push({ start: zoneStart, end: plays.length - 1 })
    return zones
  }, [plays])

  const highlights = useMemo(() => plays.reduce((acc, p, idx) => {
    if      (p.isSeriesEnd)                   acc.push({ idx, intensity: 'win', label: 'Series clincher' })
    else if (p.note?.includes('WALKOFF'))     acc.push({ idx, intensity: 'big', label: p.note })
    else if (p.note?.includes('GRAND SLAM'))  acc.push({ idx, intensity: 'big', label: p.note })
    else if (p.result === 'HR')               acc.push({ idx, intensity: 'hr',  label: `${p.batter?.name} HR` })
    return acc
  }, []), [plays])

  const handleSeek = useCallback((idxOrFn) => {
    setPosition(prev => {
      const next = typeof idxOrFn === 'function' ? idxOrFn(prev) : idxOrFn
      return Math.max(0, Math.min(plays.length - 1, next))
    })
  }, [plays.length])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); handleSeek(p => p + 1) }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleSeek(p => p - 1) }
      if (e.key === 'Escape')     setSelectedTile(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSeek])

  const batter  = currentPlay.batter  ?? null
  const pitcher = currentPlay.pitcher ?? null

  const pitcherStatLine = pitcher ? getSeriesStatLine(pitcher.pid, 'pitcher', seriesStats) : null
  const batterStatLine  = batter  ? getSeriesStatLine(batter.pid,  'batter',  seriesStats) : null

  const pitcherAccent = pitcher?.team ? TEAM_ACCENT[pitcher.team] : TEAM_ACCENT.NYY
  const batterAccent  = batter?.team  ? TEAM_ACCENT[batter.team]  : TEAM_ACCENT.BOS

  const pitcherIntensity = intensity === 'win' ? 'win' : intensity === 'k' ? 'k' : 'normal'
  const batterIntensity  = intensity === 'win' ? 'win' : ['hr','big'].includes(intensity) ? intensity : 'normal'

  // Which side does the selected tile go on? Fielding team → pitcher col (left)
  const fieldingTeam = pitcher?.team ?? 'NYY'
  const selectedSide = selectedTile?.team === fieldingTeam ? 'pitcher' : 'batter'

  return (
    <AppShell>
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="showdown-page">

        <div className="showdown-page__heading">
          <h1 className="showdown-page__title">{data.title}</h1>
          <p className="showdown-page__series-note">{data.series_note}</p>
        </div>

        <ShowdownScrubber
          plays={plays}
          games={games}
          gameStarts={gameStarts}
          position={position}
          onSeek={handleSeek}
          extraZones={extraZones}
          highlights={highlights}
        />

        <FieldScoreboard
          play={currentPlay}
          plays={plays}
          position={position}
          games={games}
          gameScores={gameScores}
        />

        {/* ── Mobile matchup strip — hidden on desktop ───────────────── */}
        <div className="showdown-page__matchup">
          <MatchupCard
            role="pitcher"
            player={pitcher}
            seriesLine={pitcherStatLine}
            accentColor={pitcherAccent}
            intensity={pitcherIntensity}
          />
          <MatchupCard
            role="batter"
            player={batter}
            seriesLine={batterStatLine}
            accentColor={batterAccent}
            intensity={batterIntensity}
          />
        </div>

        {/* ── Main layout: pitcher | field | batter ─────────────────── */}
        <div className="showdown-page__field-layout">

          {/* Pitcher panel — left, desktop only */}
          <div className="showdown-page__side-col">
            <FieldPlayerPanel
              role="pitcher"
              player={pitcher}
              seriesLine={pitcherStatLine}
              accentColor={pitcherAccent}
              intensity={pitcherIntensity}
            />
            {/* Selected fielder card — desktop, pitcher side */}
            {selectedTile && selectedSide === 'pitcher' && (
              <div
                className="field-selected-panel"
                style={{ '--card-accent': TEAM_ACCENT[selectedTile.team] ?? TEAM_ACCENT.NYY }}
              >
                <button
                  className="field-selected-panel__close"
                  onClick={() => setSelectedTile(null)}
                  aria-label="Close"
                >✕</button>
                <SelectedTileContent tile={selectedTile} seriesStats={seriesStats} />
              </div>
            )}
          </div>

          {/* Field */}
          <div className="showdown-page__field-col">
            <FieldView
              play={currentPlay}
              plays={plays}
              position={position}
              selectedTile={selectedTile}
              onTileSelect={setSelectedTile}
            />
          </div>

          {/* Batter panel — right, desktop only */}
          <div className="showdown-page__side-col">
            <FieldPlayerPanel
              role="batter"
              player={batter}
              seriesLine={batterStatLine}
              accentColor={batterAccent}
              intensity={batterIntensity}
            />
            {/* Selected fielder card — desktop, batter side */}
            {selectedTile && selectedSide === 'batter' && (
              <div
                className="field-selected-panel"
                style={{ '--card-accent': TEAM_ACCENT[selectedTile.team] ?? TEAM_ACCENT.BOS }}
              >
                <button
                  className="field-selected-panel__close"
                  onClick={() => setSelectedTile(null)}
                  aria-label="Close"
                >✕</button>
                <SelectedTileContent tile={selectedTile} seriesStats={seriesStats} />
              </div>
            )}
          </div>

        </div>

        <div className="showdown-page__attribution">
          Play-by-play data: <a href="https://www.retrosheet.org" target="_blank" rel="noopener noreferrer">Retrosheet</a>
        </div>

      </main>

      <AppFooter />

      {/* ── Mobile: bottom sheet for selected tile ─────────────────────── */}
      {selectedTile && (
        <div
          className="showdown-page__tile-sheet"
          style={{ '--card-accent': TEAM_ACCENT[selectedTile.team] ?? TEAM_ACCENT.NYY }}
        >
          <div className="showdown-page__tile-sheet-inner">
            <button
              className="showdown-page__tile-sheet-close"
              onClick={() => setSelectedTile(null)}
              aria-label="Close"
            >✕</button>
            <SelectedTileContent tile={selectedTile} seriesStats={seriesStats} />
          </div>
        </div>
      )}

    </AppShell>
  )
}
