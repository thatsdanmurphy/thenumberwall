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

// ── Game stats (for player panels) ───────────────────────────────────────────
const HIT_RESULTS = new Set(['S','D','T','HR'])
const AB_RESULTS  = new Set(['S','D','T','HR','OUT','DP','SF','SH','K','FC','E'])
const OUT_RESULTS = new Set(['OUT','SF','SH','K','FC'])

function computeGameStats(plays, upToIdx) {
  const stats = {}
  for (let i = 0; i <= upToIdx; i++) {
    const p = plays[i]
    if (!p) break
    const bk = `${p.batter.pid}:${p.game}`
    if (!stats[bk]) stats[bk] = { ab:0, h:0, hr:0, k:0, bb:0, hp:0, outs:0, kp:0, hp_a:0, bb_a:0 }
    const bs = stats[bk]
    if (AB_RESULTS.has(p.result))            bs.ab++
    if (HIT_RESULTS.has(p.result))           bs.h++
    if (p.result === 'HR')                   bs.hr++
    if (p.result === 'K')                    bs.k++
    if (p.result === 'W' || p.result === 'IW') bs.bb++
    if (p.result === 'HP')                   bs.hp++

    if (p.pitcher?.pid && !['SB','CS','BK','WP','PB','DI','NP'].includes(p.result)) {
      const pk = `${p.pitcher.pid}:${p.game}`
      if (!stats[pk]) stats[pk] = { ab:0, h:0, hr:0, k:0, bb:0, hp:0, outs:0, kp:0, hp_a:0, bb_a:0 }
      const ps = stats[pk]
      if (OUT_RESULTS.has(p.result)) { ps.outs++; if (p.result === 'DP') ps.outs++ }
      if (p.result === 'K')            ps.kp++
      if (HIT_RESULTS.has(p.result))   ps.hp_a++
      if (p.result === 'W' || p.result === 'IW') ps.bb_a++
    }
  }
  return stats
}

function fmtIP(outs) { return `${Math.floor(outs / 3)}.${outs % 3}` }

// ── Live running score (approximate from play results) ────────────────────
function computeRunningScore(plays, upToIdx) {
  const scores = {} // { game: { BOS: n, NYY: n } }
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

// ── Outs in current half-inning ────────────────────────────────────────────
function computeCurrentOuts(plays, upToIdx) {
  if (!plays[upToIdx]) return 0
  const p  = plays[upToIdx]
  const hk = `${p.game}-${p.inning}-${p.half}`
  // Walk back to start of half-inning
  let start = upToIdx
  while (start > 0 && `${plays[start-1].game}-${plays[start-1].inning}-${plays[start-1].half}` === hk) {
    start--
  }
  // Count outs BEFORE current play (state going INTO this at-bat)
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
  // Series record: games completed before this one
  const bosWins = games.filter((g, i) => i < gameNum - 1 && g.winner === 'BOS').length
  const nyyWins = games.filter((g, i) => i < gameNum - 1 && g.winner === 'NYY').length
  // Live game score
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

      {/* Live game score */}
      <div className="field-scoreboard__live">
        <span className="field-scoreboard__team field-scoreboard__team--nyy">NYY</span>
        <span className="field-scoreboard__score">{liveScore.NYY}</span>
        <span className="field-scoreboard__dash">–</span>
        <span className="field-scoreboard__score">{liveScore.BOS}</span>
        <span className="field-scoreboard__team field-scoreboard__team--bos">BOS</span>
      </div>

      <div className="field-scoreboard__divider" />

      {/* Series record */}
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

// ── FieldPlayerPanel ──────────────────────────────────────────────────────────
function FieldPlayerPanel({ role, player, stats, accentColor, intensity }) {
  if (!player?.name) {
    return <div className="field-player-panel field-player-panel--empty" />
  }

  const isBatter  = role === 'batter'
  const isPitcher = role === 'pitcher'

  let statLine = null
  if (stats) {
    if (isBatter) {
      const parts = [`${stats.h}-${stats.ab}`]
      if (stats.hr) parts.push(`${stats.hr} HR`)
      if (stats.k)  parts.push(`${stats.k} K`)
      if (stats.bb + stats.hp > 0) parts.push(`${stats.bb + stats.hp} BB`)
      statLine = parts.join(' · ')
    } else {
      const parts = [`${fmtIP(stats.outs)} IP`, `${stats.kp} K`]
      if (stats.hp_a) parts.push(`${stats.hp_a} H`)
      if (stats.bb_a) parts.push(`${stats.bb_a} BB`)
      statLine = parts.join(' · ')
    }
  }

  const glowClass =
    intensity === 'win'                          ? ' field-player-panel--win'
    : (intensity === 'big' || intensity === 'hr') && isBatter ? ' field-player-panel--big'
    : intensity === 'k' && isPitcher             ? ' field-player-panel--k'
    : ''

  return (
    <div className={`field-player-panel${glowClass}`}>
      <div className="field-player-panel__role">
        {isBatter ? 'AT BAT' : 'PITCHING'}
      </div>
      <div className="field-player-panel__num" style={{ color: accentColor }}>
        #{player.number}
      </div>
      <div className="field-player-panel__name">{player.name}</div>
      <div className="field-player-panel__pos">{player.pos}</div>
      {statLine && (
        <div className="field-player-panel__stats">{statLine}</div>
      )}
    </div>
  )
}

// ── ShowdownPage ──────────────────────────────────────────────────────────────
export default function ShowdownPage() {
  const navigate       = useNavigate()
  const { showdownId } = useParams()

  const data = SHOWDOWNS[showdownId] ?? SHOWDOWNS['alcs-2004']
  const { plays, gameStarts, games, teams } = data

  const [position, setPosition] = useState(0)
  const [playing,  setPlaying]  = useState(false)
  const [speed,    setSpeed]    = useState(1)

  useEffect(() => {
    document.title = `${data.title} — Showdowns | The Number Wall`
    track('showdown_view', { id: data.id })
  }, [data])

  const currentPlay = plays[position] ?? {}
  const intensity   = playIntensity(currentPlay)

  // ── Game stats for player panels ─────────────────────────────────────────
  const gameStats   = useMemo(() => computeGameStats(plays, position),    [plays, position])
  const gameScores  = useMemo(() => computeRunningScore(plays, position),  [plays, position])
  function getStats(pid, gameNum) { return gameStats[`${pid}:${gameNum}`] ?? null }

  // ── Extra-inning zones for scrubber ──────────────────────────────────────
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

  // ── Scrubber highlight moments ────────────────────────────────────────────
  const highlights = useMemo(() => plays.reduce((acc, p, idx) => {
    if      (p.isSeriesEnd)                          acc.push({ idx, intensity: 'win', label: 'Series clincher' })
    else if (p.note?.includes('WALKOFF'))            acc.push({ idx, intensity: 'big', label: p.note })
    else if (p.note?.includes('GRAND SLAM'))         acc.push({ idx, intensity: 'big', label: p.note })
    else if (p.result === 'HR')                      acc.push({ idx, intensity: 'hr',  label: `${p.batter?.name} HR` })
    return acc
  }, []), [plays])

  // ── Seek + keyboard ───────────────────────────────────────────────────────
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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSeek])

  // ── Active players ────────────────────────────────────────────────────────
  const batter  = currentPlay.batter  ?? null
  const pitcher = currentPlay.pitcher ?? null

  const batterStats  = batter  ? getStats(batter.pid,  currentPlay.game) : null
  const pitcherStats = pitcher ? getStats(pitcher.pid, currentPlay.game) : null

  // Persist note for 4 plays so the panel height doesn't bounce
  const visibleNote = useMemo(() => {
    if (currentPlay.note) return currentPlay.note
    for (let i = position - 1; i >= Math.max(0, position - 4); i--) {
      if (plays[i]?.game !== currentPlay.game) break
      if (plays[i]?.note) return plays[i].note
    }
    return null
  }, [plays, position, currentPlay])

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
          playing={playing}
          onPlayPause={setPlaying}
          speed={speed}
          onSpeedChange={setSpeed}
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

        {/* ── Main layout — pitcher | field | batter ─────────────────── */}
        <div className="showdown-page__field-layout">

          {/* Pitcher — left on desktop, hidden on mobile */}
          <div className="showdown-page__side-col showdown-page__side-col--pitcher">
            <FieldPlayerPanel
              role="pitcher"
              player={pitcher}
              stats={pitcherStats}
              accentColor={pitcher?.team ? TEAM_ACCENT[pitcher.team] : TEAM_ACCENT.NYY}
              intensity={intensity === 'win' ? 'win' : intensity === 'k' ? 'k' : 'normal'}
            />
          </div>

          {/* Field — always visible */}
          <div className="showdown-page__field-col">
            <FieldView
              play={currentPlay}
              plays={plays}
              position={position}
            />
            {/* Mobile player note */}
            {visibleNote && (
              <div className="showdown-page__mobile-note">
                G{currentPlay.game} · {visibleNote}
              </div>
            )}
          </div>

          {/* Batter — right on desktop, hidden on mobile */}
          <div className="showdown-page__side-col showdown-page__side-col--batter">
            <FieldPlayerPanel
              role="batter"
              player={batter}
              stats={batterStats}
              accentColor={batter?.team ? TEAM_ACCENT[batter.team] : TEAM_ACCENT.BOS}
              intensity={
                intensity === 'win' ? 'win'
                : ['hr','big'].includes(intensity) ? intensity
                : 'normal'
              }
            />
          </div>

        </div>

        <div className="showdown-page__attribution">
          Play-by-play data: <a href="https://www.retrosheet.org" target="_blank" rel="noopener noreferrer">Retrosheet</a>
        </div>

      </main>

      <AppFooter />
    </AppShell>
  )
}
