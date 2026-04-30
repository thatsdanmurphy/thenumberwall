import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import { reelData, RIVAL_TILE, SACRED_TILE } from '../data/index.js'
import './ReelWallPage.css'

// ─── Film configs ─────────────────────────────────────────────────────────────
const FILMS = [
  {
    id:      'Space Jam',
    slug:    'space-jam',
    heading: 'Tune Squad',
    sub:     'Space Jam · 1996',
    coach:   'Michael Jordan',
    tileDim:  { bg: 'rgba(15,50,160,0.40)',  border: 'rgba(40,85,225,0.58)',  glow: '0 0 10px rgba(40,85,225,0.38)',                                        text: 'rgba(255,168,55,0.80)' },
    tileFull: { bg: 'rgba(18,62,198,0.58)',   border: 'rgba(58,105,255,0.76)', glow: '0 0 20px rgba(58,105,255,0.62), 0 0 36px rgba(255,138,28,0.20)',        text: 'rgba(255,190,70,1)'    },
  },
  {
    id:      'Mighty Ducks',
    slug:    'mighty-ducks',
    heading: 'District 5 Ducks',
    sub:     'The Mighty Ducks · 1992–1996',
    coach:   'Gordon Bombay',
    tileDim:  { bg: 'rgba(0,88,80,0.38)',   border: 'rgba(0,140,128,0.55)', glow: '0 0 10px rgba(0,140,128,0.35)', text: 'rgba(70,202,185,0.80)' },
    tileFull: { bg: 'rgba(0,108,98,0.58)',  border: 'rgba(0,165,150,0.74)', glow: '0 0 18px rgba(0,165,150,0.54)', text: 'rgba(92,228,210,1)'    },
  },
  {
    id:      'Little Giants',
    slug:    'little-giants',
    heading: 'Urbania Little Giants',
    sub:     'Little Giants · 1994',
    coach:   "Danny O'Shea",
    tileDim:  { bg: 'rgba(158,18,18,0.38)', border: 'rgba(208,40,40,0.55)', glow: '0 0 10px rgba(208,40,40,0.38)', text: 'rgba(245,120,100,0.80)' },
    tileFull: { bg: 'rgba(188,22,22,0.58)', border: 'rgba(232,48,48,0.74)', glow: '0 0 18px rgba(232,48,48,0.54)', text: 'rgba(255,142,118,1)'    },
  },
]

const SLUG_TO_ID = {
  'space-jam':     'Space Jam',
  'mighty-ducks':  'Mighty Ducks',
  'little-giants': 'Little Giants',
}

function filmGroup(filmStr) {
  if (!filmStr) return null
  if (filmStr === 'Space Jam') return 'Space Jam'
  if (filmStr.includes('Mighty Ducks') || filmStr.startsWith('D2') || filmStr.startsWith('D3')) return 'Mighty Ducks'
  if (filmStr.includes('Little Giants')) return 'Little Giants'
  return null
}

function makeTeamHeat(film) {
  return function(num, entries) {
    const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
    if (legends.length === 0) return {}
    if (legends.some(e => e.tier === 'SACRED'))          return { heatStyle: SACRED_TILE, textColor: SACRED_TILE.text }
    if (legends.every(e => e.tier === 'RIVAL'))          return { heatStyle: RIVAL_TILE,  textColor: RIVAL_TILE.text  }
    const maxWeight = Math.max(...legends.map(e => e.statWeight || 1))
    const tile = maxWeight >= 2 ? film.tileFull : film.tileDim
    return { heatStyle: tile, textColor: tile.text }
  }
}

export default function ReelWallPage() {
  const navigate     = useNavigate()
  const { filmSlug } = useParams()
  const [selected, setSelected] = useState(null)

  // Resolve film from URL slug — default to Space Jam if slug unknown
  const filmId = SLUG_TO_ID[filmSlug] ?? 'Space Jam'
  const film   = FILMS.find(f => f.id === filmId) ?? FILMS[0]

  useEffect(() => {
    document.title = `${film.heading} — Reel Legends | The Number Wall`
    track('reel_view', { film: film.id })
  }, [film])

  const filteredData = useMemo(
    () => reelData.filter(e => filmGroup(e.film) === film.id),
    [film]
  )

  const filteredIndex = useMemo(() => {
    const index = new Map()
    for (const entry of filteredData) {
      const key = String(entry.number)
      if (!index.has(key)) index.set(key, [])
      index.get(key).push(entry)
    }
    return index
  }, [filteredData])

  const tileHeatFn = useMemo(() => makeTeamHeat(film), [film])

  function handleClear() { setSelected(null) }

  function handleSelect(selection) {
    if (!selection || selection.entries.filter(e => e.tier !== 'UNWRITTEN').length === 0) return
    const style = tileHeatFn(selection.number, selection.entries)
    setSelected({ ...selection, tileStyle: style })
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppShell>
      <AppHeader
        title="REEL LEGENDS"
        back={{ label: 'Main Wall', onClick: () => navigate('/') }}
      />

      <main className="reel-page">

        <div className="reel-page__heading">
          <h1 className="reel-page__team">{film.heading}</h1>
          <div className="reel-page__meta">
            <span className="reel-page__sub">{film.sub}</span>
            {film.coach && (
              <span className="reel-page__coach">Coach: {film.coach}</span>
            )}
          </div>
        </div>

        <div className="reel-page__body">
          <div className="reel-page__grid-col">
            <WallGrid
              index={filteredIndex}
              activeNumber={selected?.number ?? null}
              onSelect={handleSelect}
              wallId="none"
              tileHeatFn={tileHeatFn}
            />
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            wallId="none"
            accentColor={selected?.tileStyle?.textColor ?? null}
          />
        </div>

      </main>

      <AppFooter />

      {selected && (
        <div
          className="tnw-backdrop reel-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
