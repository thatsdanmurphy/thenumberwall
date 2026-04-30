import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { track } from '@vercel/analytics'
import AppShell          from '../components/AppShell.jsx'
import AppHeader         from '../components/AppHeader.jsx'
import AppFooter         from '../components/AppFooter.jsx'
import WallGrid          from '../components/WallGrid.jsx'
import PlayerPanel       from '../components/PlayerPanel.jsx'
import ShowdownScrubber  from '../components/ShowdownScrubber.jsx'
import alcs2004          from '../data/showdowns/alcs2004.json'
import './ShowdownPage.css'

// ── Showdown registry — add future matchups here ──────────────────────────────
const SHOWDOWNS = {
  'alcs-2004': alcs2004,
}

// ── Build a wall index from a team's roster ───────────────────────────────────
function buildTeamIndex(roster) {
  const index = new Map()
  for (const player of roster) {
    const key = String(player.number)
    if (!index.has(key)) index.set(key, [])
    index.get(key).push({
      name:       player.name,
      number:     player.number,
      sport:      'Baseball',
      tier:       player.tier === 'COACH' ? 'KNOWN' : player.tier,
      team:       player.pos,
      role:       player.pos,
      funFact:    player.funFact ?? null,
      stat:       player.stat ?? null,
      statLabel:  player.statLabel ?? null,
      statWeight: player.tier === 'LEGEND' ? 2 : 1,
    })
  }
  return index
}

// ── Tile heat factory ─────────────────────────────────────────────────────────
// Returns a tileHeatFn for one team's wall.
// lit = players who've appeared so far in the series
// hot = players active in the current half-inning
function makeShowdownHeat(roster, colors, litNames, hotNames) {
  const nameByNumber = new Map()
  for (const p of roster) nameByNumber.set(String(p.number), p.name)

  return function(num, entries) {
    if (entries.length === 0) return {}
    const name  = nameByNumber.get(String(num))
    if (!name) return {}
    const isHot = hotNames.has(name)
    const isLit = litNames.has(name)
    if (isHot) return { heatStyle: colors.hot, textColor: colors.hot.text }
    if (isLit) return { heatStyle: colors.full, textColor: colors.full.text }
    // Pre-lit: very faint so unlit tiles are readable but dark
    return {
      heatStyle: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', glow: 'none', text: 'rgba(255,255,255,0.18)' },
      textColor: 'rgba(255,255,255,0.18)',
    }
  }
}

// ── Numbers list — only numbers worn in the series ────────────────────────────
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

// ── ShowdownPage ──────────────────────────────────────────────────────────────
export default function ShowdownPage() {
  const navigate       = useNavigate()
  const { showdownId } = useParams()

  const data = SHOWDOWNS[showdownId] ?? SHOWDOWNS['alcs-2004']
  const { timeline, gameStarts, teams } = data

  const [position,  setPosition]  = useState(0)
  const [playing,   setPlaying]   = useState(false)
  const [speed,     setSpeed]     = useState(1)
  const [selected,  setSelected]  = useState(null)  // { team, number, entries }
  const [dimTeam,   setDimTeam]   = useState(null)   // 'BOS' | 'NYY' | null

  useEffect(() => {
    document.title = `${data.title} — Showdowns | The Number Wall`
    track('showdown_view', { id: data.id })
  }, [data])

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

  // Indexes (built once — all roster players)
  const bosIndex = useMemo(() => buildTeamIndex(teams.BOS.roster), [teams])
  const nyyIndex = useMemo(() => buildTeamIndex(teams.NYY.roster), [teams])

  // Number lists
  const bosNumbers = useMemo(() => rosterNumbers(teams.BOS.roster), [teams])
  const nyyNumbers = useMemo(() => rosterNumbers(teams.NYY.roster), [teams])

  // Heat functions — recomputed as scrubber moves
  const bosHeat = useMemo(
    () => makeShowdownHeat(teams.BOS.roster, teams.BOS.colors, litNames.BOS, hotNames.BOS),
    [teams, litNames, hotNames]
  )
  const nyyHeat = useMemo(
    () => makeShowdownHeat(teams.NYY.roster, teams.NYY.colors, litNames.NYY, hotNames.NYY),
    [teams, litNames, hotNames]
  )

  // Seek handler — onSeek can receive a function (from scrubber auto-play)
  const handleSeek = useCallback((idxOrFn) => {
    setPosition(prev => {
      const next = typeof idxOrFn === 'function' ? idxOrFn(prev) : idxOrFn
      return Math.max(0, Math.min(timeline.length - 1, next))
    })
  }, [timeline.length])

  // Tile selection
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

  const accentColor = selected?.team === 'BOS'
    ? teams.BOS.colors.full.text
    : teams.NYY.colors.full.text

  return (
    <AppShell>
      <AppHeader />

      <main className="showdown-page">

        {/* ── Page heading ─────────────────────────────────── */}
        <div className="showdown-page__heading">
          <button className="page-back" onClick={() => navigate('/')}>← Main Wall</button>
          <div className="showdown-page__title-row">
            <div className="showdown-page__eyebrow">SHOWDOWNS</div>
            <h1 className="showdown-page__title">{data.title}</h1>
            <p className="showdown-page__sub">{data.sub}</p>
          </div>
          <p className="showdown-page__series-note">{data.series_note}</p>
        </div>

        {/* ── Team headers (desktop only, above the walls) ── */}
        <div className="showdown-page__team-headers">
          <div className="showdown-page__team-label showdown-page__team-label--sox">
            {teams.BOS.city} {teams.BOS.name}
          </div>
          <div className="showdown-page__center-label" />
          <div className="showdown-page__team-label showdown-page__team-label--nyy">
            {teams.NYY.city} {teams.NYY.name}
          </div>
        </div>

        {/* ── Three-column body ────────────────────────────── */}
        <div className="showdown-page__body">

          {/* Left wall — Red Sox */}
          <div className={`showdown-wall showdown-wall--sox${dimTeam === 'BOS' ? ' showdown-wall--dim' : ''}`}>
            <WallGrid
              index={bosIndex}
              numbers={bosNumbers}
              activeNumber={selected?.team === 'BOS' ? selected.number : null}
              onSelect={handleBosSelect}
              wallId="none"
              tileHeatFn={bosHeat}
            />
          </div>

          {/* Center column — scrubber + panel */}
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
            <PlayerPanel
              selected={selected ? { number: selected.number, entries: selected.entries } : null}
              onClear={handleClear}
              wallId="none"
              accentColor={selected ? accentColor : null}
            />
          </div>

          {/* Right wall — Yankees */}
          <div className={`showdown-wall showdown-wall--nyy${dimTeam === 'NYY' ? ' showdown-wall--dim' : ''}`}>
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
