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
      {/* liveCount — hardcoded for MVP; replace with useLiveCount() hook in Task #6 */}
      <AppHeader liveCount={3} />
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
              <p className="wall-page__cities-sublabel">The wall for your city. Numbers that belong to a place.</p>
              <Link to="/boston" className="wall-page__city-card" onClick={() => track('city_board_open', { city: 'boston' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">Boston</span>
                  <span className="wall-page__city-teams">Red Sox · Patriots · Celtics · Bruins</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/newyork" className="wall-page__city-card" onClick={() => track('city_board_open', { city: 'newyork' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">New York</span>
                  <span className="wall-page__city-teams">Yankees · Mets · Giants · Jets · Knicks · Rangers</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <div className="wall-page__city-card wall-page__city-card--soon" aria-hidden="true">
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">Chicago</span>
                </div>
                <span className="wall-page__city-soon">COMING SOON</span>
              </div>
            </div>

            {/* Showdowns */}
            <div className="wall-page__cities">
              <p className="wall-page__cities-label">
                SHOWDOWNS
                <span className="wall-page__section-beta">BETA</span>
              </p>
              <p className="wall-page__cities-sublabel">The series that defined eras. Numbers from both sides — live, half-inning by half-inning.</p>
              <Link to="/showdown/alcs-2004" className="wall-page__city-card" onClick={() => track('showdown_open', { id: 'alcs-2004' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">2004 ALCS</span>
                  <span className="wall-page__city-teams">Boston Red Sox · New York Yankees · Down 3–0</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
            </div>

            {/* Screen Legends — six film walls */}
            <div className="wall-page__cities">
              <p className="wall-page__cities-label">
                REEL LEGENDS
                <span className="wall-page__section-beta">BETA</span>
              </p>
              <p className="wall-page__cities-sublabel">The teams that never were. Six walls, one for each crew that made the cut.</p>
              <Link to="/reel/major-league" className="wall-page__city-card" onClick={() => track('reel_open', { film: 'major-league' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">Major League</span>
                  <span className="wall-page__city-teams">Cleveland Indians · Baseball · 1989</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/reel/mighty-ducks" className="wall-page__city-card" onClick={() => track('reel_open', { film: 'mighty-ducks' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">The Mighty Ducks</span>
                  <span className="wall-page__city-teams">District 5 Ducks · Hockey · D1 · D2 · D3</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/reel/little-giants" className="wall-page__city-card" onClick={() => track('reel_open', { film: 'little-giants' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">Little Giants</span>
                  <span className="wall-page__city-teams">Urbania Little Giants · Football · 1994</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/reel/space-jam" className="wall-page__city-card" onClick={() => track('reel_open', { film: 'space-jam' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">Space Jam</span>
                  <span className="wall-page__city-teams">Tune Squad · Basketball · 1996</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/reel/the-replacements" className="wall-page__city-card" onClick={() => track('reel_open', { film: 'the-replacements' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">The Replacements</span>
                  <span className="wall-page__city-teams">Washington Sentinels · Football · 2000</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
              <Link to="/reel/hardball" className="wall-page__city-card" onClick={() => track('reel_open', { film: 'hardball' })}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-name">Hardball</span>
                  <span className="wall-page__city-teams">Kekambas · Baseball · 2001</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
            </div>

            {/* Team Walls — single entry point to the full team wall directory */}
            <div className="wall-page__cities">
              <p className="wall-page__cities-label">TEAM WALLS</p>
              <p className="wall-page__cities-sublabel">The pipeline to the pros. High school, college, any era.</p>
              <Link to="/walls" className="wall-page__city-card" onClick={() => track('team_walls_open')}>
                <div className="wall-page__city-card-content">
                  <span className="wall-page__city-teams">Find your team · Add your legends · See who made it</span>
                </div>
                <ChevronRight size={16} className="wall-page__city-arrow" aria-hidden="true" />
              </Link>
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
          className="tnw-backdrop wall-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
      <FirstVisitModal />
    </AppShell>
  )
}
