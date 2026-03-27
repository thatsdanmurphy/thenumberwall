import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import SportsFilter from '../components/SportsFilter.jsx'
import { bcLegends, bcIndex, TILE_NUMBERS, buildFilteredIndex } from '../data/index.js'
import './BCPage.css'

// BC wall sports — unified (no men's/women's split), matches global wall icon style.
// The data layer uses gendered IDs (mens_hockey, womens_hockey) but the UI treats
// them as one sport. BC_SPORT_MAP expands each UI sport ID to its data counterparts.
const BC_SPORTS = [
  { id: 'football',   label: 'Football',   icon: '🏈' },
  { id: 'hockey',     label: 'Hockey',     icon: '🏒' },
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
]

const BC_SPORT_MAP = {
  football:   new Set(['football']),
  hockey:     new Set(['mens_hockey', 'womens_hockey']),
  basketball: new Set(['mens_basketball', 'womens_basketball']),
}

export default function BCPage() {
  const navigate = useNavigate()

  useEffect(() => { document.title = 'The Boston College Wall | The Number Wall' }, [])

  const [selected,    setSelected]    = useState(null)
  const [sportFilter, setSportFilter] = useState(null) // null = All

  // Expand UI sport ID to the Set of data sport IDs that buildFilteredIndex expects.
  const dataSportFilter = useMemo(() => {
    if (!sportFilter || sportFilter.size === 0) return null
    const sportId = [...sportFilter][0]
    return BC_SPORT_MAP[sportId] ?? sportFilter
  }, [sportFilter])

  // Filter BC entries by expanded sport set — tile heat + panel entries follow the filter.
  const filteredIndex = useMemo(
    () => buildFilteredIndex(bcLegends, dataSportFilter),
    [dataSportFilter]
  )

  function handleFilterChange(next) {
    // next is a Set<sportId> from SportsFilter (UI sport IDs), or null for All
    setSportFilter(next)
    setSelected(null)
    if (next) {
      const sportId = [...next][0]
      track('bc_sport_filter', { sport: sportId })
    }
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

        {/* ── Sport filter bar — reuses global SportsFilter with BC sports ── */}
        <SportsFilter
          active={sportFilter}
          onChange={handleFilterChange}
          sports={BC_SPORTS}
          trackEvent="bc_sport_filter"
        />

        {/* ── Grid + panel ──────────────────────────────── */}
        <div className="bc-page__body">

          <div className="bc-page__grid-col">
            <WallGrid
              index={filteredIndex}
              numbers={TILE_NUMBERS}
              activeNumber={selected?.number ?? null}
              onSelect={setSelected}
              wallId="none"
              theme="bc"
            />
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            mode="default"
            sportFilter={dataSportFilter}
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
