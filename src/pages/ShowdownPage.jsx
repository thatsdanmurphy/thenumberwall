import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell         from '../components/AppShell.jsx'
import AppHeader        from '../components/AppHeader.jsx'
import AppFooter        from '../components/AppFooter.jsx'
import WallGrid         from '../components/WallGrid.jsx'
import ShowdownScrubber from '../components/ShowdownScrubber.jsx'
import alcs2004         from '../data/showdowns/alcs2004.json'
import './ShowdownPage.css'

// ── Showdown registry ─────────────────────────────────────────────────────────
const SHOWDOWNS = { 'alcs-2004': alcs2004 }

// ── Team accent colors ────────────────────────────────────────────────────────
const SOX_COLORS = {
  dim:  { bg:'rgba(189,48,57,0.20)', border:'rgba(200,55,65,0.40)', glow:'0 0 10px rgba(230,60,70,0.28)', text:'rgba(255,145,150,0.70)' },
  full: { bg:'rgba(189,48,57,0.52)', border:'rgba(225,70,80,0.88)', glow:'0 0 12px rgba(240,65,75,0.80), 0 0 28px rgba(200,40,50,0.45)', text:'rgba(255,200,200,1.0)' },
  hot:  { bg:'rgba(215,50,60,0.84)', border:'rgba(245,85,95,1.0)',  glow:'0 0 14px rgba(255,70,80,1.0),  0 0 36px rgba(210,45,55,0.70)', text:'rgba(255,225,225,1.0)' },
}
const NYY_COLORS = {
  dim:  { bg:'rgba(12,35,64,0.28)',  border:'rgba(50,80,130,0.40)', glow:'0 0 10px rgba(60,95,155,0.26)', text:'rgba(155,185,230,0.70)' },
  full: { bg:'rgba(12,35,64,0.58)',  border:'rgba(65,100,170,0.88)', glow:'0 0 12px rgba(75,115,185,0.80), 0 0 28px rgba(40,70,130,0.45)', text:'rgba(205,222,255,1.0)' },
  hot:  { bg:'rgba(15,45,88,0.88)',  border:'rgba(85,120,190,1.0)', glow:'0 0 14px rgba(90,130,200,1.0),  0 0 36px rgba(55,88,155,0.70)', text:'rgba(220,235,255,1.0)' },
}
const DARK_TILE = {
  bg:'rgba(255,255,255,0.018)', border:'rgba(255,255,255,0.055)', glow:'none', text:'rgba(255,255,255,0.12)',
}
const TEAM_ACCENT = { BOS: 'rgba(245,95,105,0.92)', NYY: 'rgba(160,200,255,0.92)' }

// ── Build wall index ──────────────────────────────────────────────────────────
function buildTeamIndex(roster, teamLabel) {
  const index = new Map()
  for (const player of roster) {
    const key = String(player.number)
    if (!index.has(key)) index.set(key, [])
    index.get(key).push({
      name:       player.name,
      number:     player.number,
      sport:      'Baseball',
      tier:       'KNOWN',
      team:       teamLabel,
      role:       player.pos,
      funFact:    null,
      stat:       null,
      statLabel:  null,
      statWeight: 1,
    })
  }
  return index
}

// ── Sorted unique numbers from roster ─────────────────────────────────────────
function rosterNumbers(roster) {
  return [...new Set(roster.map(p => String(p.number)))].sort((a, b) => {
    const na = a === '00' ? -1 : a === '0' ? -0.5 : Number(a)
    const nb = b === '00' ? -1 : b === '0' ? -0.5 : Number(b)
    return na - nb
  })
}

// ── Tile heat factory (number-based, per-play) ────────────────────────────────
// activeSet   = Set<string number> — currently spotlit (hot)
// appearedSet = Set<string number> — have appeared so far (dim)
// isSeriesEnd = boolean — only winner lights up
// winner      = 'BOS'|'NYY' — winner at series end

function makePlayHeat(colors, activeSet, appearedSet, isSeriesEnd, isWinner) {
  return function(num, entries) {
    if (entries.length === 0) return {}
    const n = String(num)
    if (isSeriesEnd) {
      if (isWinner && appearedSet.has(n)) return { heatStyle: colors.hot,  textColor: colors.hot.text }
      return { heatStyle: DARK_TILE, textColor: DARK_TILE.text }
    }
    if (activeSet.has(n))   return { heatStyle: colors.hot,  textColor: colors.hot.text }
    if (appearedSet.has(n)) return { heatStyle: colors.dim,  textColor: colors.dim.text }
    return { heatStyle: DARK_TILE, textColor: DARK_TILE.text }
  }
}

// ── Combined heat for mobile merged wall ──────────────────────────────────────
function makeCombinedHeat(bosNums, nyyNums, bosHeatFn, nyyHeatFn) {
  return function(num, entries) {
    const inBos = bosNums.has(String(num))
    const inNyy = nyyNums.has(String(num))
    if (inBos && inNyy) {
      const b = bosHeatFn(num, entries)
      const y = nyyHeatFn(num, entries)
      const bosBg = b.heatStyle?.bg ?? DARK_TILE.bg
      const nyyBg = y.heatStyle?.bg ?? DARK_TILE.bg
      return {
        heatStyle: {
          bg:     `linear-gradient(to right, ${bosBg} 50%, ${nyyBg} 50%)`,
          border: 'rgba(255,255,255,0.20)',
          glow:   'none',
          text:   'rgba(255,255,255,0.70)',
        },
        textColor: 'rgba(255,255,255,0.70)',
      }
    }
    if (inBos) return bosHeatFn(num, entries)
    if (inNyy) return nyyHeatFn(num, entries)
    return {}
  }
}

// ── Running stats for current game (scans plays up to position) ───────────────
const HIT_RESULTS = new Set(['S','D','T','HR'])
const AB_RESULTS  = new Set(['S','D','T','HR','OUT','DP','SF','SH','K','FC','E'])
const OUT_RESULTS = new Set(['OUT','SF','SH','K','FC'])
const SKIP_PITCH  = new Set(['SB','CS','BK','WP','PB','DI','NP'])

function computeGameStats(plays, upToIdx) {
  // Returns { [pid:game]: { ab, h, hr, k, bb, hp, outs, kp, hp_allowed, bb_allowed } }
  const stats = {}
  for (let i = 0; i <= upToIdx; i++) {
    const p = plays[i]
    if (!p) break

    // Batter
    const bk = `${p.batter.pid}:${p.game}`
    if (!stats[bk]) stats[bk] = { ab:0, h:0, hr:0, k:0, bb:0, hp:0, outs:0, kp:0, hp_a:0, bb_a:0 }
    const bs = stats[bk]
    if (AB_RESULTS.has(p.result))     bs.ab++
    if (HIT_RESULTS.has(p.result))    bs.h++
    if (p.result === 'HR')            bs.hr++
    if (p.result === 'K')             bs.k++
    if (p.result === 'W' || p.result === 'IW') bs.bb++
    if (p.result === 'HP')            bs.hp++

    // Pitcher
    if (p.pitcher.pid && !SKIP_PITCH.has(p.result)) {
      const pk = `${p.pitcher.pid}:${p.game}`
      if (!stats[pk]) stats[pk] = { ab:0, h:0, hr:0, k:0, bb:0, hp:0, outs:0, kp:0, hp_a:0, bb_a:0 }
      const ps = stats[pk]
      if (OUT_RESULTS.has(p.result))  { ps.outs++; if (p.result === 'DP') ps.outs++ }
      if (p.result === 'K')           ps.kp++
      if (HIT_RESULTS.has(p.result))  ps.hp_a++
      if (p.result === 'W' || p.result === 'IW') ps.bb_a++
    }
  }
  return stats
}

function fmtIP(outs) {
  return `${Math.floor(outs / 3)}.${outs % 3}`
}

// ── Compact PlayCard ──────────────────────────────────────────────────────────
function PlayCard({ player, role, result, resultText, stats, note, accentColor, isMobile }) {
  if (!player || !player.name) {
    return <div className={`showdown-play-card showdown-play-card--empty${isMobile ? ' showdown-play-card--mobile' : ''}`} />
  }

  const isBatter  = role === 'batter'
  const isPitcher = role === 'pitcher'

  let statLine = null
  if (stats) {
    if (isBatter) {
      const parts = [`${stats.h}-for-${stats.ab}`]
      if (stats.hr)   parts.push(`${stats.hr} HR`)
      if (stats.k)    parts.push(`${stats.k} K`)
      if (stats.bb + stats.hp > 0) parts.push(`${stats.bb + stats.hp} BB`)
      statLine = parts.join(' · ')
    } else if (isPitcher) {
      const parts = [`${fmtIP(stats.outs)} IP`, `${stats.kp} K`]
      if (stats.hp_a)  parts.push(`${stats.hp_a} H`)
      if (stats.bb_a)  parts.push(`${stats.bb_a} BB`)
      statLine = parts.join(' · ')
    }
  }

  // Result badge only on batter card
  const showResult = isBatter && result && !['SB','CS','DI','BK','WP','PB','NP','?'].includes(result)

  return (
    <div className={`showdown-play-card${isMobile ? ' showdown-play-card--mobile' : ''}`}>
      <div className="showdown-play-card__num" style={{ color: accentColor }}>
        #{player.number}
      </div>
      <div className="showdown-play-card__info">
        <div className="showdown-play-card__name">{player.name}</div>
        <div className="showdown-play-card__role">{player.pos ?? role}</div>
        {statLine && (
          <div className="showdown-play-card__stats">{statLine}</div>
        )}
        {showResult && (
          <div className="showdown-play-card__result">{resultText}</div>
        )}
        {note && (
          <div className="showdown-play-card__note">{note}</div>
        )}
      </div>
    </div>
  )
}

// ── ShowdownPage ──────────────────────────────────────────────────────────────
export default function ShowdownPage() {
  const navigate       = useNavigate()
  const { showdownId } = useParams()

  const data = SHOWDOWNS[showdownId] ?? SHOWDOWNS['alcs-2004']
  const { plays, gameStarts, teams } = data

  const [position, setPosition] = useState(0)
  const [playing,  setPlaying]  = useState(false)
  const [speed,    setSpeed]    = useState(1)

  useEffect(() => {
    document.title = `${data.title} — Showdowns | The Number Wall`
    track('showdown_view', { id: data.id })
  }, [data])

  // ── Current play ──────────────────────────────────────────────────────────
  const currentPlay = plays[position] ?? {}
  const isSeriesEnd = currentPlay.isSeriesEnd ?? false

  // ── Numbers appeared so far (for dim heat) ────────────────────────────────
  const appearedNumbers = useMemo(() => {
    const bos = new Set()
    const nyy = new Set()
    for (let i = 0; i <= position; i++) {
      const p = plays[i]
      if (!p) break
      for (const n of (p.activeNumbers?.BOS ?? [])) bos.add(n)
      for (const n of (p.activeNumbers?.NYY ?? [])) nyy.add(n)
    }
    return { BOS: bos, NYY: nyy }
  }, [plays, position])

  // ── Active numbers for current play ──────────────────────────────────────
  const activeNums = useMemo(() => ({
    BOS: new Set(currentPlay.activeNumbers?.BOS ?? []),
    NYY: new Set(currentPlay.activeNumbers?.NYY ?? []),
  }), [currentPlay])

  // ── Running game stats ────────────────────────────────────────────────────
  const gameStats = useMemo(() => computeGameStats(plays, position), [plays, position])

  function getStats(pid, gameNum) {
    return gameStats[`${pid}:${gameNum}`] ?? null
  }

  // ── Wall indexes + numbers ────────────────────────────────────────────────
  const bosIndex   = useMemo(() => buildTeamIndex(teams.BOS.roster, 'Red Sox'),  [teams])
  const nyyIndex   = useMemo(() => buildTeamIndex(teams.NYY.roster, 'Yankees'),  [teams])
  const bosNumbers = useMemo(() => rosterNumbers(teams.BOS.roster),  [teams])
  const nyyNumbers = useMemo(() => rosterNumbers(teams.NYY.roster),  [teams])
  const bosNumSet  = useMemo(() => new Set(bosNumbers), [bosNumbers])
  const nyyNumSet  = useMemo(() => new Set(nyyNumbers), [nyyNumbers])

  // ── Tile heat functions ───────────────────────────────────────────────────
  const bosHeat = useMemo(() => makePlayHeat(
    SOX_COLORS,
    activeNums.BOS,
    appearedNumbers.BOS,
    isSeriesEnd,
    true   // BOS is the winner
  ), [activeNums, appearedNumbers, isSeriesEnd])

  const nyyHeat = useMemo(() => makePlayHeat(
    NYY_COLORS,
    activeNums.NYY,
    appearedNumbers.NYY,
    isSeriesEnd,
    false  // NYY is not the winner
  ), [activeNums, appearedNumbers, isSeriesEnd])

  // ── Combined index + numbers for mobile ───────────────────────────────────
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
    return [...all].sort((a, b) => {
      const na = a === '00' ? -1 : a === '0' ? -0.5 : Number(a)
      const nb = b === '00' ? -1 : b === '0' ? -0.5 : Number(b)
      return na - nb
    })
  }, [bosNumbers, nyyNumbers])

  const combinedHeat = useMemo(
    () => makeCombinedHeat(bosNumSet, nyyNumSet, bosHeat, nyyHeat),
    [bosNumSet, nyyNumSet, bosHeat, nyyHeat]
  )

  // ── Seek handler ──────────────────────────────────────────────────────────
  const handleSeek = useCallback((idxOrFn) => {
    setPosition(prev => {
      const next = typeof idxOrFn === 'function' ? idxOrFn(prev) : idxOrFn
      return Math.max(0, Math.min(plays.length - 1, next))
    })
  }, [plays.length])

  // Arrow key navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); handleSeek(p => p + 1) }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handleSeek(p => p - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSeek])

  // ── Derive panel players ──────────────────────────────────────────────────
  // Each team panel shows the player from that team who is "active" this play:
  //  - batting team → their batter
  //  - fielding team → their pitcher
  const batter  = currentPlay.batter  ?? null
  const pitcher = currentPlay.pitcher ?? null

  const bosPlayer = batter?.team === 'BOS' ? batter  : pitcher?.team === 'BOS' ? pitcher : null
  const bosRole   = batter?.team === 'BOS' ? 'batter' : 'pitcher'
  const nyyPlayer = batter?.team === 'NYY' ? batter  : pitcher?.team === 'NYY' ? pitcher : null
  const nyyRole   = batter?.team === 'NYY' ? 'batter' : 'pitcher'

  // Mobile panel: always show the batter
  const mobilePlayer = batter ?? null
  const mobileRole   = 'batter'

  const bosStats = bosPlayer ? getStats(bosPlayer.pid, currentPlay.game) : null
  const nyyStats = nyyPlayer ? getStats(nyyPlayer.pid, currentPlay.game) : null
  const mobileStats = mobilePlayer ? getStats(mobilePlayer.pid, currentPlay.game) : null

  // Note goes to the batting team's panel
  const note = currentPlay.note ?? null
  const bosNote = (bosRole === 'batter' && note) ? note : null
  const nyyNote = (nyyRole === 'batter' && note) ? note : null

  return (
    <AppShell>
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="showdown-page">

        {/* ── Page heading ──────────────────────────────────── */}
        <div className="showdown-page__heading">
          <h1 className="showdown-page__title">{data.title}</h1>
          <p className="showdown-page__series-note">{data.series_note}</p>
        </div>

        {/* ── Scrubber — full width ─────────────────────────── */}
        <ShowdownScrubber
          plays={plays}
          gameStarts={gameStarts}
          position={position}
          onSeek={handleSeek}
          playing={playing}
          onPlayPause={setPlaying}
          speed={speed}
          onSpeedChange={setSpeed}
        />

        {/* ── Desktop team label headers ────────────────────── */}
        <div className="showdown-page__team-headers">
          <div className="showdown-page__team-label showdown-page__team-label--sox">
            {teams.BOS.city} {teams.BOS.name}
          </div>
          <div className="showdown-page__team-label showdown-page__team-label--nyy">
            {teams.NYY.city} {teams.NYY.name}
          </div>
        </div>

        {/* ── Body: two team columns (desktop) + combined (mobile) ── */}
        <div className="showdown-page__body">

          {/* BOS column: panel + wall */}
          <div className="showdown-team-col showdown-team-col--bos">
            <PlayCard
              player={bosPlayer}
              role={bosRole}
              result={currentPlay.result}
              resultText={currentPlay.resultText}
              stats={bosStats}
              note={bosNote}
              accentColor={TEAM_ACCENT.BOS}
            />
            <div className="showdown-wall showdown-wall--sox">
              <WallGrid
                index={bosIndex}
                numbers={bosNumbers}
                activeNumber={null}
                onSelect={() => {}}
                wallId="none"
                tileHeatFn={bosHeat}
              />
            </div>
          </div>

          {/* NYY column: panel + wall */}
          <div className="showdown-team-col showdown-team-col--nyy">
            <PlayCard
              player={nyyPlayer}
              role={nyyRole}
              result={currentPlay.result}
              resultText={currentPlay.resultText}
              stats={nyyStats}
              note={nyyNote}
              accentColor={TEAM_ACCENT.NYY}
            />
            <div className="showdown-wall showdown-wall--nyy">
              <WallGrid
                index={nyyIndex}
                numbers={nyyNumbers}
                activeNumber={null}
                onSelect={() => {}}
                wallId="none"
                tileHeatFn={nyyHeat}
              />
            </div>
          </div>

          {/* Mobile: combined table + single panel */}
          <div className="showdown-page__mobile-col">
            <div className="showdown-page__combined-wall">
              <WallGrid
                index={combinedIndex}
                numbers={combinedNumbers}
                activeNumber={null}
                onSelect={() => {}}
                wallId="none"
                tileHeatFn={combinedHeat}
              />
            </div>
            <PlayCard
              player={mobilePlayer}
              role={mobileRole}
              result={currentPlay.result}
              resultText={currentPlay.resultText}
              stats={mobileStats}
              note={note}
              accentColor={mobilePlayer?.team === 'BOS' ? TEAM_ACCENT.BOS : TEAM_ACCENT.NYY}
              isMobile={true}
            />
          </div>

        </div>

        {/* ── Retrosheet attribution ─────────────────────────── */}
        <div className="showdown-page__attribution">
          Play-by-play data: <a href="https://www.retrosheet.org" target="_blank" rel="noopener noreferrer">Retrosheet</a>
        </div>

      </main>

      <AppFooter />
    </AppShell>
  )
}
