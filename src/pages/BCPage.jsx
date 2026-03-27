import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import { bcLegends, bcIndex, BC_TILE_NUMBERS, buildFilteredIndex } from '../data/index.js'
import './BCPage.css'

// Sport filter options for the BC wall.
// Values match the `sport` field in bcLegends entries.
const BC_SPORTS = [
  { id: 'football',        label: 'Football' },
  { id: 'mens_hockey',     label: "Men's Hockey" },
  { id: 'womens_hockey',   label: "Women's Hockey" },
  { id: 'mens_basketball', label: "Men's Basketball" },
]

export default function BCPage() {
  const navigate = useNavigate()

  useEffect(() => { document.title = 'The Boston College Wall | The Number Wall' }, [])

  const [selected,    setSelected]    = useState(null)
  const [sportFilter, setSportFilter] = useState(null) // null = All

  // Filter BC entries by selected sport
  const filteredIndex = useMemo(() => {
    if (!sportFilter) return bcIndex
    return buildFilteredIndex(bcLegends, new Set([sportFilter]))
  }, [sportFilter])

  // Visible tile numbers after filter — maintain numerical sort
  const visibleNumbers = useMemo(() => {
    if (!sportFilter) return BC_TILE_NUMBERS
    return BC_TILE_NUMBERS.filter(n => filteredIndex.has(n))
  }, [filteredIndex, sportFilter])

  function handleSportFilter(sportId) {
    const next = sportFilter === sportId ? null : sportId
    track('bc_sport_filter', { sport: next ?? 'all' })
    setSportFilter(next)
    setSelected(null)
  }

  function handleClear() { setSelected(null) }

  // Close panel on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppShell>
      <AppHeader
        title="BOSTON COLLEGE"
        back={{ label: 'Main Wall', onClick: () => navigate('/') }}
      />

      <main className="bc-page">

        {/* ── Sport filter bar ───────────────────────────── */}
        <div className="bc-page__filter" role="group" aria-label="Filter by sport">
          <button
            className={`bc-page__pill${!sportFilter ? ' bc-page__pill--active' : ''}`}
            onClick={() => { setSportFilter(null); setSelected(null) }}
          >
            ALL
          </button>
          {BC_SPORTS.map(s => (
            <button
              key={s.id}
              className={`bc-page__pill${sportFilter === s.id ? ' bc-page__pill--active' : ''}`}
              onClick={() => handleSportFilter(s.id)}
            >
              {s.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── Grid + panel ──────────────────────────────── */}
        <div className="bc-page__body">

          <div className="bc-page__grid-col">
            <WallGrid
              index={filteredIndex}
              numbers={visibleNumbers}
              activeNumber={selected?.number ?? null}
              onSelect={setSelected}
              wallId="none"
            />
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            mode="default"
            sportFilter={sportFilter ? new Set([sportFilter]) : null}
            wallId="none"
            wall="bc"
          />

        </div>

      </main>

      <AppFooter />

      {selected && (
        <div
          className="bc-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
