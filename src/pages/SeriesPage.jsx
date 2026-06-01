/**
 * SeriesPage — /series
 *
 * Heading:  Team A vs Team B — follow Boston/Reel wall pattern.
 * Tabs:     tnw-tab / tnw-tab--active — global, same as all walls.
 * Grid:     WallGrid + tileHeatFn — team color overrides, no custom grid.
 * Panel:    SeriesPanel — lightweight player detail (legend data shape mismatch
 *           with PlayerPanel; series data is simpler).
 *
 * Overlap tiles (same number worn by both teams) get a smooth left→right
 * gradient blend — both players shown side-by-side in the panel.
 *
 * Data: seriesTeams.js mock — replace with API hook in Task #6.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate }   from 'react-router-dom'
import AppShell          from '../components/AppShell.jsx'
import AppHeader         from '../components/AppHeader.jsx'
import AppFooter         from '../components/AppFooter.jsx'
import WallGrid          from '../components/WallGrid.jsx'
import {
  SERIES_MATCHUPS,
  SERIES_ORDER,
  getTeamStyle,
  overlapHeat,
}                        from '../data/seriesTeams.js'
import './SeriesPage.css'

// ── Build WallGrid index from two rosters ─────────────────────────────────────
// Each tile slot holds entry objects shaped for the panel.
// tier:'ACTIVE' prevents WallTile unwritten treatment.

function buildSeriesIndex(rostA, rostB, teamA, teamB) {
  const index = new Map()

  for (const p of rostA) {
    index.set(String(p.number), [{
      tier: 'ACTIVE', name: p.name, pos: p.pos,
      series: p.series, isOnWall: p.isOnWall,
      teamCode: teamA.code, teamCity: teamA.city, side: 'a',
    }])
  }

  for (const p of rostB) {
    const key      = String(p.number)
    const existing = index.get(key) || []
    index.set(key, [...existing, {
      tier: 'ACTIVE', name: p.name, pos: p.pos,
      series: p.series, isOnWall: p.isOnWall,
      teamCode: teamB.code, teamCity: teamB.city, side: 'b',
    }])
  }

  return index
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function EmptyPanel() {
  return (
    <div className="series-panel series-panel--empty">
      <p className="series-panel__empty-text">
        Select a number to see who's wearing it in this series.
      </p>
    </div>
  )
}

function PlayerCard({ entry, style }) {
  return (
    <div className="series-panel__player">
      <div className="series-panel__num" style={{ color: style.text }}>
        {entry.number ?? ''}
      </div>
      <div className="series-panel__info">
        <div className="series-panel__name">{entry.name}</div>
        <div className="series-panel__meta">
          <span className="series-panel__team" style={{ color: style.text }}>
            {entry.teamCode}
          </span>
          <span className="series-panel__sep">·</span>
          <span className="series-panel__pos">{entry.pos}</span>
        </div>
        <div className="series-panel__series">{entry.series}</div>
        {entry.isOnWall && (
          <span className="series-panel__wall-badge">★ On the wall</span>
        )}
      </div>
    </div>
  )
}

function SeriesPanel({ selected, styleA, styleB, onClear }) {
  if (!selected) return <EmptyPanel />

  const { number, entries } = selected
  const entryA = entries.find(e => e.side === 'a')
  const entryB = entries.find(e => e.side === 'b')
  const isOverlap = entryA && entryB

  const withNum = e => ({ ...e, number })

  return (
    <div className={`series-panel${isOverlap ? ' series-panel--overlap' : ''}`}>
      {isOverlap ? (
        <>
          <div className="series-panel__overlap-num">{number}</div>
          <p className="series-panel__overlap-context">
            Two players, one number — both writing their story in this series.
          </p>
          <div className="series-panel__overlap-cards">
            <PlayerCard entry={withNum(entryA)} style={styleA} />
            <div className="series-panel__overlap-divider" />
            <PlayerCard entry={withNum(entryB)} style={styleB} />
          </div>
        </>
      ) : (
        <PlayerCard
          entry={withNum(entryA ?? entryB)}
          style={entryA ? styleA : styleB}
        />
      )}
    </div>
  )
}

// ── Coming soon ───────────────────────────────────────────────────────────────

function ComingSoon({ series }) {
  return (
    <div className="series-page__coming">
      <p className="series-page__coming-date">{series.statusLabel}</p>
      <p className="series-page__coming-label">{series.label}</p>
      <p className="series-page__coming-body">{series.seriesState}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SeriesPage() {
  const navigate = useNavigate()
  const [activeId,  setActiveId]  = useState('stanley-cup')
  const [selected,  setSelected]  = useState(null)

  const series = SERIES_MATCHUPS[activeId]
  const isLive = series.status === 'live'

  useEffect(() => { document.title = 'The Finals Wall | The Number Wall' }, [])

  const styleA = useMemo(() =>
    series.teamA ? getTeamStyle(series.teamA.code) : null,
  [activeId])

  const styleB = useMemo(() =>
    series.teamB ? getTeamStyle(series.teamB.code) : null,
  [activeId])

  // Pre-compute number sets for tileHeatFn
  const numberSetA = useMemo(() =>
    new Set(series.rostA.map(p => String(p.number))),
  [activeId])

  const numberSetB = useMemo(() =>
    new Set(series.rostB.map(p => String(p.number))),
  [activeId])

  const overlapStyle = useMemo(() =>
    (styleA && styleB) ? overlapHeat(styleA.rgb, styleB.rgb) : null,
  [activeId])

  // WallGrid tileHeatFn — returns team-colored heatStyle per number
  const tileHeatFn = useCallback((num) => {
    const inA = numberSetA.has(String(num))
    const inB = numberSetB.has(String(num))
    if (inA && inB) return { heatStyle: overlapStyle, textColor: overlapStyle.text }
    if (inA)        return { heatStyle: styleA.heat,  textColor: styleA.text }
    if (inB)        return { heatStyle: styleB.heat,  textColor: styleB.text }
    return {}
  }, [activeId, numberSetA, numberSetB, styleA, styleB, overlapStyle])

  // Build WallGrid-compatible index
  const seriesIndex = useMemo(() => {
    if (!isLive || !series.teamA) return new Map()
    return buildSeriesIndex(series.rostA, series.rostB, series.teamA, series.teamB)
  }, [activeId])

  function handleSeriesChange(id) {
    setActiveId(id)
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
      <AppHeader back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="series-page">

        {/* ── Heading — follow Boston/Reel pattern ─────────────────────── */}
        <div className="series-page__heading">
          {isLive && series.teamA && series.teamB ? (
            <h1 className="series-page__title">
              <span style={{ color: styleA?.text }}>{series.teamA.city}</span>
              {' vs '}
              <span style={{ color: styleB?.text }}>{series.teamB.city}</span>
            </h1>
          ) : (
            <h1 className="series-page__title">The Finals Wall</h1>
          )}
          <p className="series-page__sublabel">{series.seriesState}</p>
        </div>

        {/* ── Tabs — global tnw-tab, same as Boston/NY ─────────────────── */}
        <div className="series-page__tabs" role="tablist">
          {SERIES_ORDER.map(id => {
            const s      = SERIES_MATCHUPS[id]
            const locked = s.status === 'upcoming'
            return (
              <button
                key={id}
                className={`tnw-tab${activeId === id ? ' tnw-tab--active' : ''}${locked ? ' tnw-tab--locked' : ''}`}
                role="tab"
                aria-selected={activeId === id}
                disabled={locked}
                onClick={() => !locked && handleSeriesChange(id)}
              >
                {s.label}
                {locked && s.statusLabel && (
                  <span className="series-page__tab-badge">{s.statusLabel}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {!isLive ? (
          <ComingSoon series={series} />
        ) : (
          <div className="series-page__body">

            <div className="series-page__grid-col">
              <WallGrid
                index={seriesIndex}
                activeNumber={selected?.number ?? null}
                onSelect={setSelected}
                tileHeatFn={tileHeatFn}
                wallId="none"
              />
            </div>

            <SeriesPanel
              selected={selected}
              styleA={styleA}
              styleB={styleB}
              onClear={handleClear}
            />

          </div>
        )}

      </main>

      <AppFooter />

      {selected && (
        <div
          className="tnw-backdrop series-page__backdrop"
          onClick={handleClear}
          aria-hidden="true"
        />
      )}
    </AppShell>
  )
}
