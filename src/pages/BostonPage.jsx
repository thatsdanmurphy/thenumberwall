import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell     from '../components/AppShell.jsx'
import AppHeader    from '../components/AppHeader.jsx'
import AppFooter    from '../components/AppFooter.jsx'
import WallGrid     from '../components/WallGrid.jsx'
import PlayerPanel  from '../components/PlayerPanel.jsx'
import SportsFilter from '../components/SportsFilter.jsx'
import { bostonLegends, bostonCurrent, buildFilteredIndex } from '../data/index.js'
import './BostonPage.css'

// Dynamic season label: "25/26" — flips in July each year
function currentSeasonLabel() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1           // 1-based
  const start = month >= 7 ? year : year - 1
  return `${String(start).slice(-2)}/${String(start + 1).slice(-2)}`
}

const SEASON = currentSeasonLabel()

// Boston board has two modes — legends wall and current roster
const TABS = [
  { id: 'legends', label: 'LEGENDS' },
  { id: 'current', label: `${SEASON} ROSTER` },
]

export default function BostonPage() {
  const navigate = useNavigate()
  const [tab,          setTab]          = useState('legends')

  useEffect(() => { document.title = 'The Boston Wall | The Number Wall' }, [])
  const [selected,     setSelected]     = useState(null)
  const [sportFilter,  setSportFilter]  = useState(null)

  // Pick the right dataset for the active tab
  const baseData = tab === 'legends' ? bostonLegends : bostonCurrent

  const filteredIndex = useMemo(
    () => buildFilteredIndex(baseData, sportFilter),
    [baseData, sportFilter]
  )

  function handleTabChange(nextTab) {
    track('tab_change', { tab: nextTab })
    setTab(nextTab)
    setSelected(null)
    setSportFilter(null)
  }

  function handleFilterChange(next) {
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
      <AppHeader title="THE BOSTON WALL" back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="boston-page">

        {/* ── Tab bar ──────────────────────────────────────── */}
        <div className="boston-page__tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`boston-page__tab${tab === t.id ? ' boston-page__tab--active' : ''}`}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Sports filter — spans full width, above grid+panel row ─────── */}
        <SportsFilter active={sportFilter} onChange={handleFilterChange} />

        {/* ── Grid + panel ─────────────────────────────────── */}
        <div className="boston-page__body">

          <div className="boston-page__grid-col">
            <WallGrid
              index={filteredIndex}
              activeNumber={selected?.number ?? null}
              onSelect={setSelected}
              wallId={tab === 'current' ? 'none' : 'boston'}
            />
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            mode={tab === 'current' ? 'current' : 'default'}
            sportFilter={sportFilter}
            wallId={tab === 'current' ? 'none' : 'boston'}
          />

        </div>

      </main>

      <AppFooter />

      {selected && (
        <div
          className="boston-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
