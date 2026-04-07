import { useState, useMemo, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { track } from '@vercel/analytics'
import AppShell    from '../components/AppShell.jsx'
import AppHeader   from '../components/AppHeader.jsx'
import AppFooter   from '../components/AppFooter.jsx'
import WallGrid    from '../components/WallGrid.jsx'
import PlayerPanel from '../components/PlayerPanel.jsx'
import SportsFilter from '../components/SportsFilter.jsx'
import FirstVisitModal  from '../components/FirstVisitModal.jsx'
import { wallData, buildFilteredIndex, globalIndex } from '../data/index.js'
import './WallPage.css'

export default function WallPage() {
  const { num } = useParams()  // from /number/:num route
  const [selected,     setSelected]     = useState(null)  // { number, entries } | null
  const [sportFilter,  setSportFilter]  = useState(null)  // Set of sport IDs | null = all

  useEffect(() => { document.title = 'The Number Wall' }, [])

  // Deep link: /number/23 → pre-select that tile on mount
  useEffect(() => {
    if (num) {
      const entries = globalIndex.get(String(num))
      if (entries) {
        setSelected({ number: String(num), entries })
      }
    }
  }, [num])

  // Rebuild the index when the sport filter changes.
  // Memoised — only recalculates when sportFilter changes.
  const filteredIndex = useMemo(
    () => buildFilteredIndex(wallData, sportFilter),
    [sportFilter]
  )

  function handleClear() { setSelected(null) }

  function handleFilterChange(next) {
    setSportFilter(next)
    // Clear selection when filter changes — selected number may not be visible
    setSelected(null)
  }


  // Close panel on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppShell>
      <AppHeader />
      <main className="wall-page">

        <SportsFilter active={sportFilter} onChange={handleFilterChange} />

        <div className="wall-page__body">
          <div className="wall-page__grid-col">
            <WallGrid
              index={filteredIndex}
              activeNumber={selected?.number ?? null}
              onSelect={setSelected}
              sportFilter={sportFilter}
            />
            {/* City boards — discoverable below the global grid */}
            <div className="wall-page__cities">
              <p className="wall-page__cities-label">DISCOVER THE LOCALS</p>
              <Link to="/boston" className="wall-page__city-card" onClick={() => track('city_board_open', { city: 'boston' })}>
                <span className="wall-page__city-name">Boston</span>
                <span className="wall-page__city-teams">Red Sox · Patriots · Celtics · Bruins</span>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/newyork" className="wall-page__city-card" onClick={() => track('city_board_open', { city: 'newyork' })}>
                <span className="wall-page__city-name">New York</span>
                <span className="wall-page__city-teams">Yankees · Mets · Knicks · Nets · Giants · Jets · Rangers · Islanders</span>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <div className="wall-page__city-card wall-page__city-card--soon" aria-hidden="true">
                <span className="wall-page__city-name">Chicago</span>
                <span className="wall-page__city-teams"></span>
                <span className="wall-page__city-soon">COMING SOON</span>
              </div>
            </div>
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            sportFilter={sportFilter}
            wallId="global"
          />
        </div>
      </main>
      <AppFooter />

      {/* Mobile backdrop — tapping it closes the panel */}
      {selected && (
        <div
          className="wall-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
      <FirstVisitModal />
    </AppShell>
  )
}
