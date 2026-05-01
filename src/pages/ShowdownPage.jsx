import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { track } from '@vercel/analytics'
import AppShell         from '../components/AppShell.jsx'
import AppHeader        from '../components/AppHeader.jsx'
import AppFooter        from '../components/AppFooter.jsx'
import WallGrid         from '../components/WallGrid.jsx'
import ShowdownScrubber from '../components/ShowdownScrubber.jsx'
import FieldView        from '../components/FieldView.jsx'
import alcs2004         from '../data/showdowns/alcs2004.json'
import './ShowdownPage.css'

const SHOWDOWNS = { 'alcs-2004': alcs2004 }

// ── Team colors ───────────────────────────────────────────────────────────────
const SOX_COLORS = {
  dim:    { bg:'rgba(189,48,57,0.20)', border:'rgba(200,55,65,0.40)', glow:'0 0 10px rgba(230,60,70,0.28)', text:'rgba(255,145,150,0.70)' },
  full:   { bg:'rgba(189,48,57,0.52)', border:'rgba(225,70,80,0.88)', glow:'0 0 12px rgba(240,65,75,0.80), 0 0 28px rgba(200,40,50,0.45)', text:'rgba(255,200,200,1.0)' },
  hot:    { bg:'rgba(215,50,60,0.84)', border:'rgba(245,85,95,1.0)',  glow:'0 0 14px rgba(255,70,80,1.0),  0 0 36px rgba(210,45,55,0.70)', text:'rgba(255,225,225,1.0)' },
  sacred: { bg:'rgba(240,55,65,1.0)',  border:'rgba(255,120,130,1.0)', glow:'0 0 20px rgba(255,80,90,1.0), 0 0 50px rgba(220,40,50,0.90), 0 0 80px rgba(200,30,40,0.50)', text:'rgba(255,240,240,1.0)' },
}
const NYY_COLORS = {
  dim:    { bg:'rgba(12,35,64,0.28)',  border:'rgba(50,80,130,0.40)', glow:'0 0 10px rgba(60,95,155,0.26)', text:'rgba(155,185,230,0.70)' },
  full:   { bg:'rgba(12,35,64,0.58)',  border:'rgba(65,100,170,0.88)', glow:'0 0 12px rgba(75,115,185,0.80), 0 0 28px rgba(40,70,130,0.45)', text:'rgba(205,222,255,1.0)' },
  hot:    { bg:'rgba(15,45,88,0.88)',  border:'rgba(85,120,190,1.0)', glow:'0 0 14px rgba(90,130,200,1.0),  0 0 36px rgba(55,88,155,0.70)', text:'rgba(220,235,255,1.0)' },
  sacred: { bg:'rgba(20,60,120,1.0)',  border:'rgba(120,165,240,1.0)', glow:'0 0 20px rgba(100,150,255,1.0), 0 0 50px rgba(60,100,200,0.90), 0 0 80px rgba(30,70,160,0.50)', text:'rgba(235,245,255,1.0)' },
}
const DARK_TILE = {
  bg:'rgba(255,255,255,0.018)', border:'rgba(255,255,255,0.055)', glow:'none', text:'rgba(255,255,255,0.12)',
}
const TEAM_ACCENT = { BOS: 'rgba(245,95,105,0.92)', NYY: 'rgba(160,200,255,0.92)' }

// ── Classify play intensity ───────────────────────────────────────────────────
// Returns 'normal' | 'k' | 'hit' | 'hr' | 'big' | 'win'
function playIntensity(play) {
  if (!play) return 'normal'
  if (play.isSeriesEnd) return 'win'
  if (play.note && (play.note.includes('WALKOFF') || play.note.includes('GRAND SLAM'))) return 'big'
  if (play.result === 'HR') return 'hr'
  if (play.result === 'K')  return 'k'
  if (['S','D','T'].includes(play.result)) return 'hit'
  return 'normal'
}

// ── Build wall index ──────────────────────────────────────────────────────────
function buildTeamIndex(roster, teamLabel) {
  const index = new Map()
  for (const player of roster) {
    const key = String(player.number)
    if (!index.has(key)) index.set(key, [])
    index.get(key).push({
      name: player.name, number: player.number, sport: 'Baseball',
      tier: 'KNOWN', team: teamLabel, role: player.pos,
      funFact: null, stat: null, statLabel: null, statWeight: 1,
    })
  }
  return index
}

function rosterNumbers(roster) {
  return [...new Set(roster.map(p => String(p.number)))].sort((a, b) => {
    const na = a === '00' ? -1 : a === '0' ? -0.5 : Number(a)
    const nb = b === '00' ? -1 : b === '0' ? -0.5 : Number(b)
    return na - nb
  })
}

// ── Number → pid lookup (first player with that number on that roster) ─────────
function buildNumberToPid(roster) {
  const map = {}
  for (const p of roster) {
    const n = String(p.number)
    if (!map[n]) map[n] = p.retroId
  }
  return map
}

// ── Tile heat ─────────────────────────────────────────────────────────────────
function makePlayHeat(colors, activeSet, appearedSet, isSeriesEnd, isWinner, intensity, selectedNum) {
  return function(num, entries) {
    if (entries.length === 0) return {}
    const n = String(num)

    // Series end celebration
    if (isSeriesEnd) {
      if (isWinner && appearedSet.has(n)) return { heatStyle: colors.sacred, textColor: colors.sacred.text }
      return { heatStyle: DARK_TILE, textColor: DARK_TILE.text }
    }

    // Selected player always stays hot
    if (selectedNum && selectedNum === n) {
      return { heatStyle: colors.hot, textColor: colors.hot.text }
    }

    const isActive = activeSet.has(n)
    if (isActive) {
      const style = (intensity === 'big' || intensity === 'hr' || intensity === 'win')
        ? colors.sacred : colors.hot
      return { heatStyle: style, textColor: style.text }
    }
    if (appearedSet.has(n)) return { heatStyle: colors.dim, textColor: colors.dim.text }
    return { heatStyle: DARK_TILE, textColor: DARK_TILE.text }
  }
}

// ── Combined heat for mobile ──────────────────────────────────────────────────
function makeCombinedHeat(bosNums, nyyNums, bosHeatFn, nyyHeatFn) {
  return function(num, entries) {
    const inBos = bosNums.has(String(num))
    const inNyy = nyyNums.has(String(num))
    if (!inBos && !inNyy) return {}

    const b = bosHeatFn(num, entries)
    const y = nyyHeatFn(num, entries)

    if (inBos && inNyy) {
      // Both teams share this number — diagonal split gradient
      const bosBg = b.heatStyle?.bg ?? DARK_TILE.bg
      const nyyBg = y.heatStyle?.bg ?? DARK_TILE.bg
      // Skip the gradient if both are dark (looks messy)
      const bosDark = bosBg === DARK_TILE.bg
      const nyyDark = nyyBg === DARK_TILE.bg
      if (bosDark && nyyDark) return { heatStyle: DARK_TILE, textColor: DARK_TILE.text }
      // Soft top-to-bottom blend — BOS on top, NYY on bottom, blend zone in the middle
      const topColor = bosDark ? nyyBg : bosBg
      const botColor = nyyDark ? bosBg : nyyBg
      return {
        heatStyle: {
          bg:     `linear-gradient(to bottom, ${topColor} 20%, ${botColor} 80%)`,
          border: 'rgba(255,255,255,0.26)',
          glow:   'none',
          text:   'rgba(255,255,255,0.88)',
        },
        textColor: 'rgba(255,255,255,0.88)',
      }
    }
    if (inBos) return b
    return y
  }
}

// ── Running game stats ─────────────────────────────────────────────────────────
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
    if (AB_RESULTS.has(p.result))     bs.ab++
    if (HIT_RESULTS.has(p.result))    bs.h++
    if (p.result === 'HR')            bs.hr++
    if (p.result === 'K')             bs.k++
    if (p.result === 'W' || p.result === 'IW') bs.bb++
    if (p.result === 'HP')            bs.hp++

    if (p.pitcher.pid && !['SB','CS','BK','WP','PB','DI','NP'].includes(p.result)) {
      const pk = `${p.pitcher.pid}:${p.game}`
      if (!stats[pk]) stats[pk] = { ab:0, h:0, hr:0, k:0, bb:0, hp:0, outs:0, kp:0, hp_a:0, bb_a:0 }
      const ps = stats[pk]
      if (OUT_RESULTS.has(p.result)) { ps.outs++; if (p.result === 'DP') ps.outs++ }
      if (p.result === 'K')   ps.kp++
      if (HIT_RESULTS.has(p.result)) ps.hp_a++
      if (p.result === 'W' || p.result === 'IW') ps.bb_a++
    }
  }
  return stats
}

// Full-series stats (for selected player view)
function computeSeriesStats(plays, pid) {
  let ab = 0, h = 0, hr = 0, k = 0, bb = 0, hp = 0
  let outs = 0, kp = 0, hp_a = 0, bb_a = 0
  for (const p of plays) {
    if (p.batter.pid === pid) {
      if (AB_RESULTS.has(p.result))     ab++
      if (HIT_RESULTS.has(p.result))    h++
      if (p.result === 'HR')            hr++
      if (p.result === 'K')             k++
      if (p.result === 'W' || p.result === 'IW') bb++
      if (p.result === 'HP')            hp++
    }
    if (p.pitcher.pid === pid && !['SB','CS','BK','WP','PB','DI','NP'].includes(p.result)) {
      if (OUT_RESULTS.has(p.result)) { outs++; if (p.result === 'DP') outs++ }
      if (p.result === 'K')   kp++
      if (HIT_RESULTS.has(p.result)) hp_a++
      if (p.result === 'W' || p.result === 'IW') bb_a++
    }
  }
  return { ab, h, hr, k, bb, hp, outs, kp, hp_a, bb_a }
}

function fmtIP(outs) { return `${Math.floor(outs / 3)}.${outs % 3}` }

// ── PlayCard ──────────────────────────────────────────────────────────────────
function PlayCard({ player, role, result, resultText, stats, note, accentColor, intensity, isSelected, onDeselect }) {
  if (!player || !player.name) {
    return <div className="showdown-play-card showdown-play-card--empty" />
  }

  const isBatter  = role === 'batter'
  const isPitcher = role === 'pitcher'
  const showResult = isBatter && result && !['SB','CS','DI','BK','WP','PB','NP','?'].includes(result)

  // Animation class based on intensity + role
  let animClass = ''
  if (intensity === 'win')               animClass = ' showdown-play-card--win'
  else if (intensity === 'big' && isBatter) animClass = ' showdown-play-card--big'
  else if (intensity === 'hr' && isBatter)  animClass = ' showdown-play-card--hr'
  else if (intensity === 'k' && isPitcher)  animClass = ' showdown-play-card--k'

  let statLine = null
  if (stats && !isSelected) {
    if (isBatter) {
      const parts = [`${stats.h}-for-${stats.ab}`]
      if (stats.hr)           parts.push(`${stats.hr} HR`)
      if (stats.k)            parts.push(`${stats.k} K`)
      if (stats.bb + stats.hp > 0) parts.push(`${stats.bb + stats.hp} BB`)
      statLine = parts.join(' · ')
    } else if (isPitcher) {
      const parts = [`${fmtIP(stats.outs)} IP`, `${stats.kp} K`]
      if (stats.hp_a)  parts.push(`${stats.hp_a} H`)
      if (stats.bb_a)  parts.push(`${stats.bb_a} BB`)
      statLine = parts.join(' · ')
    }
  }

  return (
    <div className={`showdown-play-card${animClass}${isSelected ? ' showdown-play-card--selected' : ''}`}>
      <div className="showdown-play-card__num" style={{ color: accentColor }}>
        #{player.number}
      </div>
      <div className="showdown-play-card__info">
        <div className="showdown-play-card__name">{player.name}</div>
        <div className="showdown-play-card__role">{player.pos || role}</div>
        {statLine && <div className="showdown-play-card__stats">{statLine}</div>}
        {showResult && <div className="showdown-play-card__result">{resultText}</div>}
        {note && <div className="showdown-play-card__note">{note}</div>}
      </div>
      {isSelected && onDeselect && (
        <button className="showdown-play-card__close" onClick={onDeselect} aria-label="Deselect player">
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// ── Selected player panel ─────────────────────────────────────────────────────
function SelectedPlayerPanel({ player, plays, accentColor, onDeselect }) {
  if (!player) return null
  const { pid, name, number, pos, team } = player

  const seriesStats = useMemo(() => computeSeriesStats(plays, pid), [plays, pid])
  const moments = useMemo(
    () => plays
      .filter(p => (p.batter.pid === pid || p.pitcher.pid === pid) && p.note)
      .map(p => `G${p.game} · ${p.note}`),
    [plays, pid]
  )
  // Deduplicate notes
  const uniqueMoments = [...new Set(moments)]

  const isPitcher = pos === 'P'
  let statLine
  if (isPitcher) {
    const parts = [`${fmtIP(seriesStats.outs)} IP series`, `${seriesStats.kp} K`]
    if (seriesStats.hp_a) parts.push(`${seriesStats.hp_a} H`)
    statLine = parts.join(' · ')
  } else {
    const parts = [`${seriesStats.h}-for-${seriesStats.ab} series`]
    if (seriesStats.hr) parts.push(`${seriesStats.hr} HR`)
    if (seriesStats.k)  parts.push(`${seriesStats.k} K`)
    statLine = parts.join(' · ')
  }

  return (
    <div className="showdown-play-card showdown-play-card--selected showdown-play-card--expanded">
      <div className="showdown-play-card__num" style={{ color: accentColor }}>#{number}</div>
      <div className="showdown-play-card__info">
        <div className="showdown-play-card__name">{name}</div>
        <div className="showdown-play-card__role">{pos} · {team}</div>
        <div className="showdown-play-card__stats">{statLine}</div>
        {uniqueMoments.length > 0 && (
          <ul className="showdown-play-card__moments">
            {uniqueMoments.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
      </div>
      <button className="showdown-play-card__close" onClick={onDeselect} aria-label="Deselect">
        <X size={12} />
      </button>
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
  // Selected player state: { pid, name, number, pos, team }
  const [selectedBos, setSelectedBos] = useState(null)
  const [selectedNyy, setSelectedNyy] = useState(null)
  const [viewMode,    setViewMode]    = useState('wall') // 'wall' | 'field'

  useEffect(() => {
    document.title = `${data.title} — Showdowns | The Number Wall`
    track('showdown_view', { id: data.id })
  }, [data])

  const currentPlay = plays[position] ?? {}
  const isSeriesEnd = currentPlay.isSeriesEnd ?? false
  const intensity   = playIntensity(currentPlay)

  // ── Number→pid lookup ─────────────────────────────────────────────────────
  const bosNumToPid = useMemo(() => buildNumberToPid(teams.BOS.roster), [teams])
  const nyyNumToPid = useMemo(() => buildNumberToPid(teams.NYY.roster), [teams])

  // ── Accumulated appeared numbers ──────────────────────────────────────────
  const appearedNumbers = useMemo(() => {
    const bos = new Set(), nyy = new Set()
    for (let i = 0; i <= position; i++) {
      const p = plays[i]; if (!p) break
      for (const n of (p.activeNumbers?.BOS ?? [])) bos.add(n)
      for (const n of (p.activeNumbers?.NYY ?? [])) nyy.add(n)
    }
    return { BOS: bos, NYY: nyy }
  }, [plays, position])

  const activeNums = useMemo(() => ({
    BOS: new Set(currentPlay.activeNumbers?.BOS ?? []),
    NYY: new Set(currentPlay.activeNumbers?.NYY ?? []),
  }), [currentPlay])

  // ── Game stats ────────────────────────────────────────────────────────────
  const gameStats = useMemo(() => computeGameStats(plays, position), [plays, position])
  function getStats(pid, gameNum) { return gameStats[`${pid}:${gameNum}`] ?? null }

  // ── Wall indexes + numbers ────────────────────────────────────────────────
  const bosIndex   = useMemo(() => buildTeamIndex(teams.BOS.roster, 'Red Sox'), [teams])
  const nyyIndex   = useMemo(() => buildTeamIndex(teams.NYY.roster, 'Yankees'), [teams])
  const bosNumbers = useMemo(() => rosterNumbers(teams.BOS.roster), [teams])
  const nyyNumbers = useMemo(() => rosterNumbers(teams.NYY.roster), [teams])
  const bosNumSet  = useMemo(() => new Set(bosNumbers), [bosNumbers])
  const nyyNumSet  = useMemo(() => new Set(nyyNumbers), [nyyNumbers])

  // ── Tile heat ─────────────────────────────────────────────────────────────
  const bosHeat = useMemo(() => makePlayHeat(
    SOX_COLORS, activeNums.BOS, appearedNumbers.BOS,
    isSeriesEnd, true, intensity, selectedBos?.number ?? null
  ), [activeNums, appearedNumbers, isSeriesEnd, intensity, selectedBos])

  const nyyHeat = useMemo(() => makePlayHeat(
    NYY_COLORS, activeNums.NYY, appearedNumbers.NYY,
    isSeriesEnd, false, intensity, selectedNyy?.number ?? null
  ), [activeNums, appearedNumbers, isSeriesEnd, intensity, selectedNyy])

  // ── Combined mobile ───────────────────────────────────────────────────────
  const combinedIndex = useMemo(() => {
    const merged = new Map()
    for (const [num, entries] of bosIndex) merged.set(num, [...entries])
    for (const [num, entries] of nyyIndex) {
      if (merged.has(num)) merged.get(num).push(...entries)
      else merged.set(num, [...entries])
    }
    return merged
  }, [bosIndex, nyyIndex])

  const combinedNumbers = useMemo(() => {
    const all = new Set([...bosNumbers, ...nyyNumbers])
    return [...all].sort((a,b) => {
      const na = a === '00' ? -1 : a === '0' ? -0.5 : Number(a)
      const nb = b === '00' ? -1 : b === '0' ? -0.5 : Number(b)
      return na - nb
    })
  }, [bosNumbers, nyyNumbers])

  const combinedHeat = useMemo(
    () => makeCombinedHeat(bosNumSet, nyyNumSet, bosHeat, nyyHeat),
    [bosNumSet, nyyNumSet, bosHeat, nyyHeat]
  )

  // ── Extra-inning zones for scrubber ──────────────────────────────────────
  const extraZones = useMemo(() => {
    const zones = []
    let zoneStart = null
    for (let i = 0; i < plays.length; i++) {
      const inExtra = plays[i].inning > 9
      if (inExtra && zoneStart === null) zoneStart = i
      if (!inExtra && zoneStart !== null) {
        zones.push({ start: zoneStart, end: i - 1 })
        zoneStart = null
      }
    }
    if (zoneStart !== null) zones.push({ start: zoneStart, end: plays.length - 1 })
    return zones
  }, [plays])

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
      if (e.key === 'Escape')     { setSelectedBos(null); setSelectedNyy(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSeek])

  // ── Tile click → select player, pause scrubber ───────────────────────────
  function handleBosSelect(sel) {
    if (!sel || !sel.number) return
    const pid = bosNumToPid[String(sel.number)]
    if (!pid) return
    const player = teams.BOS.roster.find(p => p.retroId === pid)
    if (!player) return
    setPlaying(false)
    setSelectedBos({ pid, name: player.name, number: player.number, pos: player.pos, team: 'BOS' })
    track('showdown_tile', { team: 'BOS', number: sel.number })
  }

  function handleNyySelect(sel) {
    if (!sel || !sel.number) return
    const pid = nyyNumToPid[String(sel.number)]
    if (!pid) return
    const player = teams.NYY.roster.find(p => p.retroId === pid)
    if (!player) return
    setPlaying(false)
    setSelectedNyy({ pid, name: player.name, number: player.number, pos: player.pos, team: 'NYY' })
    track('showdown_tile', { team: 'NYY', number: sel.number })
  }

  function handleCombinedSelect(sel) {
    if (!sel || !sel.number) return
    const inBos = bosNumSet.has(String(sel.number))
    if (inBos) handleBosSelect(sel)
    else handleNyySelect(sel)
  }

  // ── Panel player derivation ───────────────────────────────────────────────
  const batter  = currentPlay.batter  ?? null
  const pitcher = currentPlay.pitcher ?? null

  const bosLive = batter?.team === 'BOS' ? batter : pitcher?.team === 'BOS' ? pitcher : null
  const bosRole = batter?.team === 'BOS' ? 'batter' : 'pitcher'
  const nyyLive = batter?.team === 'NYY' ? batter : pitcher?.team === 'NYY' ? pitcher : null
  const nyyRole = batter?.team === 'NYY' ? 'batter' : 'pitcher'

  const bosStats = bosLive ? getStats(bosLive.pid, currentPlay.game) : null
  const nyyStats = nyyLive ? getStats(nyyLive.pid, currentPlay.game) : null

  // Persist the most recent note for up to 4 plays so it reads long enough
  // and prevents the card from jumping in height when the note disappears
  const visibleNote = useMemo(() => {
    if (currentPlay.note) return currentPlay.note
    for (let i = position - 1; i >= Math.max(0, position - 4); i--) {
      if (plays[i]?.game !== currentPlay.game) break
      if (plays[i]?.note) return plays[i].note
    }
    return null
  }, [plays, position, currentPlay])

  // Prefix with game label so it's clear which game the moment belongs to
  const noteWithGame = visibleNote ? `G${currentPlay.game} · ${visibleNote}` : null

  const bosNote = (bosRole === 'batter' && noteWithGame) ? noteWithGame : null
  const nyyNote = (nyyRole === 'batter' && noteWithGame) ? noteWithGame : null

  // Mobile panel always shows the batter
  const mobilePlayer = batter ?? null
  const mobileStats  = mobilePlayer ? getStats(mobilePlayer.pid, currentPlay.game) : null
  const mobileNote   = noteWithGame

  return (
    <AppShell>
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="showdown-page">

        <div className="showdown-page__heading">
          <div className="showdown-page__title-row">
            <h1 className="showdown-page__title">{data.title}</h1>
            <div className="showdown-page__view-toggle">
              <button
                className={`showdown-page__view-btn${viewMode === 'wall' ? ' showdown-page__view-btn--active' : ''}`}
                onClick={() => setViewMode('wall')}
              >WALL</button>
              <button
                className={`showdown-page__view-btn${viewMode === 'field' ? ' showdown-page__view-btn--active' : ''}`}
                onClick={() => setViewMode('field')}
              >FIELD</button>
            </div>
          </div>
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
        />

        {/* ── Field view ───────────────────────────────────────────────── */}
        {viewMode === 'field' && (
          <FieldView
            play={currentPlay}
            plays={plays}
            position={position}
          />
        )}

        {/* ── Wall view ─────────────────────────────────────────────────── */}
        {viewMode === 'wall' && <>

        {/* ── Desktop team headers ──────────────────────────────────────── */}
        <div className="showdown-page__team-headers">
          <div className="showdown-page__team-label showdown-page__team-label--sox">
            {teams.BOS.city} {teams.BOS.name}
          </div>
          <div className="showdown-page__team-label showdown-page__team-label--nyy">
            {teams.NYY.city} {teams.NYY.name}
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="showdown-page__body">

          {/* BOS column */}
          <div className="showdown-team-col showdown-team-col--bos">
            {selectedBos ? (
              <SelectedPlayerPanel
                player={selectedBos}
                plays={plays}
                accentColor={TEAM_ACCENT.BOS}
                onDeselect={() => setSelectedBos(null)}
              />
            ) : (
              <PlayCard
                player={bosLive}
                role={bosRole}
                result={currentPlay.result}
                resultText={currentPlay.resultText}
                stats={bosStats}
                note={bosNote}
                accentColor={TEAM_ACCENT.BOS}
                intensity={
                  // BOS is the winner — they get the win flash
                  intensity === 'win' ? 'win'
                  : bosRole === 'batter' || intensity === 'k' ? intensity : 'normal'
                }
              />
            )}
            <div className="showdown-wall showdown-wall--sox">
              <WallGrid
                index={bosIndex}
                numbers={bosNumbers}
                activeNumber={selectedBos?.number ?? null}
                onSelect={handleBosSelect}
                wallId="none"
                tileHeatFn={bosHeat}
              />
            </div>
          </div>

          {/* NYY column */}
          <div className="showdown-team-col showdown-team-col--nyy">
            {selectedNyy ? (
              <SelectedPlayerPanel
                player={selectedNyy}
                plays={plays}
                accentColor={TEAM_ACCENT.NYY}
                onDeselect={() => setSelectedNyy(null)}
              />
            ) : (
              <PlayCard
                player={nyyLive}
                role={nyyRole}
                result={currentPlay.result}
                resultText={currentPlay.resultText}
                stats={nyyStats}
                note={nyyNote}
                accentColor={TEAM_ACCENT.NYY}
                intensity={
                  // NYY is the loser — never gets the win flash
                  intensity === 'win' ? 'normal'
                  : nyyRole === 'batter' || intensity === 'k' ? intensity : 'normal'
                }
              />
            )}
            <div className="showdown-wall showdown-wall--nyy">
              <WallGrid
                index={nyyIndex}
                numbers={nyyNumbers}
                activeNumber={selectedNyy?.number ?? null}
                onSelect={handleNyySelect}
                wallId="none"
                tileHeatFn={nyyHeat}
              />
            </div>
          </div>

          {/* Mobile col */}
          <div className="showdown-page__mobile-col">
            <div className="showdown-page__combined-wall">
              <WallGrid
                index={combinedIndex}
                numbers={combinedNumbers}
                activeNumber={null}
                onSelect={handleCombinedSelect}
                wallId="none"
                tileHeatFn={combinedHeat}
              />
            </div>
            <PlayCard
              player={mobilePlayer}
              role="batter"
              result={currentPlay.result}
              resultText={currentPlay.resultText}
              stats={mobileStats}
              note={mobileNote}
              accentColor={mobilePlayer?.team === 'BOS' ? TEAM_ACCENT.BOS : TEAM_ACCENT.NYY}
              intensity={intensity}
              isMobile
            />
          </div>

        </div>

        </> /* end wall view */}

        <div className="showdown-page__attribution">
          Play-by-play data: <a href="https://www.retrosheet.org" target="_blank" rel="noopener noreferrer">Retrosheet</a>
        </div>

      </main>

      <AppFooter />
    </AppShell>
  )
}
