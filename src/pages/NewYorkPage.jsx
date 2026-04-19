import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { track } from '@vercel/analytics'
import AppShell     from '../components/AppShell.jsx'
import AppHeader    from '../components/AppHeader.jsx'
import AppFooter    from '../components/AppFooter.jsx'
import WallGrid     from '../components/WallGrid.jsx'
import PlayerPanel  from '../components/PlayerPanel.jsx'
import SportsFilter from '../components/SportsFilter.jsx'
import { nyLegends, nyCurrent, buildFilteredIndex } from '../data/index.js'
import './NewYorkPage.css'

// Dynamic season label: "25/26" — flips in July each year
function currentSeasonLabel() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  const start = month >= 7 ? year : year - 1
  return `${String(start).slice(-2)}/${String(start + 1).slice(-2)}`
}

const SEASON = currentSeasonLabel()

const TABS = [
  { id: 'legends', label: 'LEGENDS' },
  { id: 'current', label: `${SEASON} ROSTER` },
]

export default function NewYorkPage() {
  const navigate = useNavigate()
  const [tab,          setTab]          = useState('legends')

  useEffect(() => { document.title = 'The New York Wall | The Number Wall' }, [])
  const [selected,     setSelected]     = useState(null)
  const [sportFilter,  setSportFilter]  = useState(null)

  const baseData = tab === 'legends' ? nyLegends : nyCurrent

  const filteredIndex = useMemo(
    () => buildFilteredIndex(baseData, sportFilter),
    [baseData, sportFilter]
  )

  function handleTabChange(nextTab) {
    track('tab_change', { tab: nextTab, city: 'newyork' })
    setTab(nextTab)
    setSelected(null)
    setSportFilter(null)
  }

  function handleFilterChange(next) {
    setSportFilter(next)
    setSelected(null)
  }

  function handleClear() { setSelected(null) }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppShell>
      <AppHeader title="THE NEW YORK WALL" back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="newyork-page">

        {/* ── Tab bar ──────────────────────────────────────── */}
        <div className="newyork-page__tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tnw-tab${tab === t.id ? ' tnw-tab--active' : ''}`}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => handleTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SportsFilter active={sportFilter} onChange={handleFilterChange} />

        {/* ── Grid + panel ─────────────────────────────────── */}
        <div className="newyork-page__body">

          <div className="newyork-page__grid-col">
            <WallGrid
              index={filteredIndex}
              activeNumber={selected?.number ?? null}
              onSelect={setSelected}
              wallId={tab === 'current' ? 'none' : 'newyork'}
            />
          </div>

          <PlayerPanel
            selected={selected}
            onClear={handleClear}
            mode={tab === 'current' ? 'current' : 'default'}
            sportFilter={sportFilter}
            wallId={tab === 'current' ? 'none' : 'newyork'}
          />

        </div>

      </main>

      <AppFooter />

      {selected && (
        <div
          className="tnw-backdrop newyork-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
