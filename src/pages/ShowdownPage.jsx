import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell          from '../components/AppShell.jsx'
import AppHeader         from '../components/AppHeader.jsx'
import AppFooter         from '../components/AppFooter.jsx'
import WallGrid          from '../components/WallGrid.jsx'
import PlayerPanel       from '../components/PlayerPanel.jsx'
import ShowdownScrubber  from '../components/ShowdownScrubber.jsx'
import alcs2004          from '../data/showdowns/alcs2004.json'
import './ShowdownPage.css'

// ── Showdown registry ─────────────────────────────────────────────────────────
const SHOWDOWNS = { 'alcs-2004': alcs2004 }

// ── Team colors — defined here not from JSON so we can tune them ──────────────
// Red uses dual glow layers to match perceived brightness of blue.
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

// ── Build wall index ──────────────────────────────────────────────────────────
// teamLabel = display name ("Red Sox" / "Yankees") — separates role from team badge
function buildTeamIndex(roster, teamLabel) {
  const index = new Map()
  for (const player of roster) {
    const key = String(player.number)
    if (!index.has(key)) index.set(key, [])
    index.get(key).push({
      name:       player.name,
      number:     player.number,
      sport:      'Baseball',
      tier:       player.tier === 'COACH' ? 'KNOWN' : player.tier,
      team:       teamLabel,          // "Red Sox" or "Yankees"
      role:       player.pos,        // position (SS, P, C …) — not duplicated now
      funFact:    player.funFact ?? null,
      stat:       player.stat ?? null,
      statLabel:  player.statLabel ?? null,
      statWeight: player.tier === 'LEGEND' ? 2 : 1,
    })
  }
  return index
}

// ── Color scaling helper ──────────────────────────────────────────────────────
// Multiplies the alpha of all rgba() occurrences in a string
function scaleRgba(str, factor) {
  return str.replace(/rgba\(([^)]+)\)/g, (_, vals) => {
    const p = vals.split(',').map(s => s.trim())
    p[3] = String(Math.min(1, parseFloat(p[3]) * factor).toFixed(3))
    return `rgba(${p.join(', ')})`
  })
}

// ── Tile heat factory ─────────────────────────────────────────────────────────
// progress (0.0–1.0): how far through the series we are.
// Lit tiles scale from 35% → 100% brightness as the series builds.
function makeShowdownHeat(roster, colors, litNames, hotNames, progress) {
  const nameByNumber = new Map()
  for (const p of roster) nameByNumber.set(String(p.number), p.name)

  const litFactor = 0.35 + progress * 0.65

  const litStyle = {
    bg:     scaleRgba(colors.full.bg,     litFactor),
    border: scaleRgba(colors.full.border, litFactor),
    glow:   scaleRgba(colors.full.glow,   litFactor),
    text:   scaleRgba(colors.full.text,   Math.max(0.55, litFactor)),
  }

  return function(num, entries) {
    if (entries.length === 0) return {}
    const name = nameByNumber.get(String(num))
    if (!name) return {}
    const isHot = hotNames.has(name)
    const isLit = litNames.has(name)
    if (isHot) return { heatStyle: colors.hot, textColor: colors.hot.text }
    if (isLit) return { heatStyle: litStyle,    textColor: litStyle.text }
    // Unlit — very faint presence
    return {
      heatStyle: { bg:'rgba(255,255,255,0.025)', border:'rgba(255,255,255,0.07)', glow:'none', text:'rgba(255,255,255,0.16)' },
      textColor:  'rgba(255,255,255,0.16)',
    }
  }
}

// ── Sorted unique numbers from a roster ──────────────────────────────────────
function rosterNumbers(roster) {
  return [...new Set(roster.map(p => String(p.number)))].sort((a, b) => {
    const na = a === '00' ? -1 : a === '0' ? -0.5 : Number(a)
    const nb = b === '00' ? -1 : b === '0' ? -0.5 : Number(b)
    return na - nb
  })
}

// ── Accumulated player sets ───────────────────────────────────────────────────
function accumulatePlayers(timeline, upToIdx) {
  const lit = { BOS: new Set(), NYY: new Set() }
  for (let i = 0; i <= upToIdx; i++) {
    const slot = timeline[i]
    if (!slot) break
    for (const team of ['BOS', 'NYY']) {
      for (const name of (slot.players[team] ?? [])) lit[team].add(name)
    }
  }
  return lit
}

// ── Moment type from current slot note ───────────────────────────────────────
function getMomentEffect(note) {
  if (!note) return null
  const n = note.toLowerCase()
  if (n.includes('pennant') || n.includes('win the'))                    return 'win'
  if (n.includes('walkoff') || n.includes('grand slam') || n.includes('home run') || n.includes(' hr ') || n.includes('homer')) return 'flash'
  if (n.includes('schilling') || n.includes('bloody') || n.includes('steals') || n.includes('alive') || n.includes('extras'))  return 'pulse'
  return null
}

// ── ShowdownPage ──────────────────────────────────────────────────────────────
export default function ShowdownPage() {
  const navigate       = useNavigate()
  const { showdownId } = useParams()

  const data = SHOWDOWNS[showdownId] ?? SHOWDOWNS['alcs-2004']
  const { timeline, gameStarts, teams } = data

  const [position,  setPosition]  = useState(0)
  const [playing,   setPlaying]   = useState(false)
  const [speed,     setSpeed]     = useState(1)
  const [selected,  setSelected]  = useState(null)   // { team, number, entries }
  const [dimTeam,   setDimTeam]   = useState(null)   // 'BOS' | 'NYY' | null

  useEffect(() => {
    document.title = `${data.title} — Showdowns | The Number Wall`
    track('showdown_view', { id: data.id })
  }, [data])

  // Series progress for gradation (0.0 at start → 1.0 at end)
  const progress = timeline.length > 1 ? position / (timeline.length - 1) : 0

  // Current slot info
  const currentSlot   = timeline[position] ?? {}
  const currentNote   = currentSlot.note ?? null
  const momentEffect  = getMomentEffect(currentNote)

  // Accumulated + current-slot player sets
  const litNames = useMemo(() => accumulatePlayers(timeline, position), [timeline, position])
  const hotNames = useMemo(() => {
    const slot = timeline[position]
    if (!slot) return { BOS: new Set(), NYY: new Set() }
    return {
      BOS: new Set(slot.players.BOS ?? []),
      NYY: new Set(slot.players.NYY ?? []),
    }
  }, [timeline, position])

  // Indexes (built once — roster fixed)
  const bosIndex = useMemo(() => buildTeamIndex(teams.BOS.roster, 'Red Sox'),  [teams])
  const nyyIndex = useMemo(() => buildTeamIndex(teams.NYY.roster, 'Yankees'),  [teams])

  // Number lists
  const bosNumbers = useMemo(() => rosterNumbers(teams.BOS.roster), [teams])
  const nyyNumbers = useMemo(() => rosterNumbers(teams.NYY.roster), [teams])

  // Heat functions — recomputed every position change (progress + litNames + hotNames)
  const bosHeat = useMemo(
    () => makeShowdownHeat(teams.BOS.roster, SOX_COLORS, litNames.BOS, hotNames.BOS, progress),
    [teams, litNames, hotNames, progress]
  )
  const nyyHeat = useMemo(
    () => makeShowdownHeat(teams.NYY.roster, NYY_COLORS, litNames.NYY, hotNames.NYY, progress),
    [teams, litNames, hotNames, progress]
  )

  // Seek
  const handleSeek = useCallback((idxOrFn) => {
    setPosition(prev => {
      const next = typeof idxOrFn === 'function' ? idxOrFn(prev) : idxOrFn
      return Math.max(0, Math.min(timeline.length - 1, next))
    })
  }, [timeline.length])

  // Tile selection — dim wall is visually faded but still clickable (#8)
  function handleBosSelect(sel) {
    if (!sel || sel.entries.filter(e => e.tier !== 'UNWRITTEN').length === 0) return
    setSelected({ team: 'BOS', ...sel })
    setDimTeam('NYY')
    track('showdown_tile', { team: 'BOS', number: sel.number })
  }
  function handleNyySelect(sel) {
    if (!sel || sel.entries.filter(e => e.tier !== 'UNWRITTEN').length === 0) return
    setSelected({ team: 'NYY', ...sel })
    setDimTeam('BOS')
    track('showdown_tile', { team: 'NYY', number: sel.number })
  }
  function handleClear() { setSelected(null); setDimTeam(null) }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppShell>
      <AppHeader />

      <main className="showdown-page">

        {/* ── Page heading ──────────────────────────────────── */}
        <div className="showdown-page__heading">
          <button className="page-back" onClick={() => navigate('/')}>← Main Wall</button>
          <div className="showdown-page__title-row">
            <div className="showdown-page__eyebrow">SHOWDOWNS</div>
            <h1 className="showdown-page__title">{data.title}</h1>
            <p className="showdown-page__sub">{data.sub}</p>
          </div>
          <p className="showdown-page__series-note">{data.series_note}</p>
        </div>

        {/* ── Team headers (desktop) ────────────────────────── */}
        <div className="showdown-page__team-headers">
          <div className="showdown-page__team-label showdown-page__team-label--sox">
            {teams.BOS.city} {teams.BOS.name}
          </div>
          <div className="showdown-page__center-label" />
          <div className="showdown-page__team-label showdown-page__team-label--nyy">
            {teams.NYY.city} {teams.NYY.name}
          </div>
        </div>

        {/* ── Three-column body ─────────────────────────────── */}
        <div className="showdown-page__body">

          {/* Left wall — Red Sox */}
          <div className={`showdown-wall showdown-wall--sox${dimTeam === 'BOS' ? ' showdown-wall--dim' : ''}${momentEffect ? ` showdown-wall--${momentEffect}` : ''}`}>
            <WallGrid
              index={bosIndex}
              numbers={bosNumbers}
              activeNumber={selected?.team === 'BOS' ? selected.number : null}
              onSelect={handleBosSelect}
              wallId="none"
              tileHeatFn={bosHeat}
            />
          </div>

          {/* Center column — scrubber + moment card + panel */}
          <div className="showdown-page__center">
            <ShowdownScrubber
              timeline={timeline}
              gameStarts={gameStarts}
              position={position}
              onSeek={handleSeek}
              playing={playing}
              onPlayPause={setPlaying}
              speed={speed}
              onSpeedChange={setSpeed}
            />

            {/* Moment card — note floats here, fades in on change (#4/#11) */}
            <div className="showdown-page__moment-wrap">
              {currentNote && (
                <div key={currentNote} className={`showdown-moment${momentEffect ? ` showdown-moment--${momentEffect}` : ''}`}>
                  <div className="showdown-moment__text">{currentNote}</div>
                </div>
              )}
            </div>

            <PlayerPanel
              selected={selected ? { number: selected.number, entries: selected.entries } : null}
              onClear={handleClear}
              wallId="none"
              accentColor={null}
            />
          </div>

          {/* Right wall — Yankees */}
          <div className={`showdown-wall showdown-wall--nyy${dimTeam === 'NYY' ? ' showdown-wall--dim' : ''}${momentEffect ? ` showdown-wall--${momentEffect}` : ''}`}>
            <WallGrid
              index={nyyIndex}
              numbers={nyyNumbers}
              activeNumber={selected?.team === 'NYY' ? selected.number : null}
              onSelect={handleNyySelect}
              wallId="none"
              tileHeatFn={nyyHeat}
            />
          </div>

        </div>

      </main>

      <AppFooter />

      {selected && (
        <div
          className="tnw-backdrop showdown-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
