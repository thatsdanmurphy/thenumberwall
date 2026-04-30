import { useState, useMemo, useEffect } from 'react'
import { Film } from 'lucide-react'
import { track } from '@vercel/analytics'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import { reelData, reelIndex, buildFilteredIndex, TILE_NUMBERS, RIVAL_TILE, getHeatLevelByCount, HEAT_TILES, SACRED_TILE } from '../data/index.js'
import './ReelWallPage.css'

// ─── Film groups ─────────────────────────────────────────────────────────────
// Map a single Film field value to one of three browsable groups.

const FILM_GROUPS = [
  { id: 'Space Jam',      label: 'Space Jam',      year: 1996, sport: 'Basketball', emoji: '🏀' },
  { id: 'Mighty Ducks',   label: 'Mighty Ducks',   year: 1992, sport: 'Hockey',     emoji: '🏒' },
  { id: 'Little Giants',  label: 'Little Giants',  year: 1994, sport: 'Football',   emoji: '🏈' },
]

function filmGroup(filmStr) {
  if (!filmStr) return null
  if (filmStr === 'Space Jam') return 'Space Jam'
  if (filmStr.includes('Mighty Ducks') || filmStr.startsWith('D2') || filmStr.startsWith('D3')) return 'Mighty Ducks'
  if (filmStr.includes('Little Giants')) return 'Little Giants'
  return null
}

// ─── Reel heat fn ────────────────────────────────────────────────────────────
// Passed to WallGrid as tileHeatFn so RIVAL tiles go dark without touching
// the global heat system. Same logic as getHeatStyle but reads reel data.

function reelHeatFn(num, entries) {
  const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
  if (legends.length === 0) return {}
  if (legends.some(e => e.tier === 'SACRED')) {
    return { heatStyle: SACRED_TILE }
  }
  if (legends.every(e => e.tier === 'RIVAL')) {
    return { heatStyle: RIVAL_TILE, textColor: RIVAL_TILE.text }
  }
  const level = getHeatLevelByCount(entries)
  return { heatStyle: HEAT_TILES[level] }
}

// ─── Film filter bar ─────────────────────────────────────────────────────────

function FilmFilter({ active, onChange }) {
  const allActive = !active

  return (
    <div className="reel-filter" role="group" aria-label="Filter by film">
      <Film size={13} className="reel-filter__icon" aria-hidden="true" />
      <button
        className={`reel-filter__pill${allActive ? ' reel-filter__pill--active' : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={allActive}
      >
        ALL FILMS
      </button>
      {FILM_GROUPS.map(film => {
        const isOn = active === film.id
        return (
          <button
            key={film.id}
            className={`reel-filter__pill${isOn ? ' reel-filter__pill--active' : ''}`}
            onClick={() => {
              track('reel_filter', { film: film.id })
              onChange(isOn ? null : film.id)
            }}
            aria-pressed={isOn}
          >
            <span aria-hidden="true">{film.emoji}</span>
            {film.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReelWallPage() {
  const [selected,   setSelected]   = useState(null)
  const [filmFilter, setFilmFilter] = useState(null)  // film group id | null = all

  useEffect(() => { document.title = 'Reel Legends — The Number Wall' }, [])

  // Build filtered data — re-derive from reelData based on film group
  const filteredData = useMemo(() => {
    if (!filmFilter) return reelData
    return reelData.filter(e => filmGroup(e.film) === filmFilter)
  }, [filmFilter])

  const filteredIndex = useMemo(() => {
    // Rebuild index from filtered data so unrelated numbers go unwritten
    const index = new Map()
    for (const entry of filteredData) {
      const key = String(entry.number)
      if (!index.has(key)) index.set(key, [])
      index.get(key).push(entry)
    }
    return index
  }, [filteredData])

  function handleClear() { setSelected(null) }

  function handleFilterChange(next) {
    setFilmFilter(next)
    setSelected(null)
  }

  // Close panel on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeFilm = FILM_GROUPS.find(f => f.id === filmFilter)

  return (
    <AppShell>
      <AppHeader />
      <main className="reel-wall-page">

        <div className="reel-wall-page__hero">
          <div className="reel-wall-page__eyebrow">REEL LEGENDS</div>
          <h1 className="reel-wall-page__title">Numbers worn on film.</h1>
          <p className="reel-wall-page__lede">
            The athletes who never were — and always will be.
            {activeFilm && <span className="reel-wall-page__film-active"> Showing {activeFilm.label} ({activeFilm.year}).</span>}
          </p>
        </div>

        <FilmFilter active={filmFilter} onChange={handleFilterChange} />

        <div className="reel-wall-page__body">
          <div className="reel-wall-page__grid-col">
            <WallGrid
              index={filteredIndex}
              activeNumber={selected?.number ?? null}
              onSelect={setSelected}
              wallId="reel"
              tileHeatFn={reelHeatFn}
            />
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            wallId="none"
          />
        </div>

      </main>
      <AppFooter />

      {selected && (
        <div
          className="tnw-backdrop reel-wall-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
