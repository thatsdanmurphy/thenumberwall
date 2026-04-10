/**
 * TeamWallPage — displays a single crowdsourced team wall.
 * Route: /walls/:schoolSlug/:sport/:year
 *
 * Grid shows numbers 0–99. Heat from entry density in team colors.
 * Panel matches main wall PlayerPanel styling.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, ExternalLink, Check, X } from 'lucide-react'
import AppShell   from '../components/AppShell.jsx'
import AppHeader  from '../components/AppHeader.jsx'
import AppFooter  from '../components/AppFooter.jsx'
import AddEntry   from '../components/AddEntry.jsx'
import { loadTeamWallByRoute } from '../lib/teamWallStore.js'
import { getTeamHeatStyle, getTeamTileTextColor, TEAM_PALETTES } from '../data/teamColors.js'
import './TeamWallPage.css'

const TILE_NUMBERS = ['0', ...Array.from({ length: 99 }, (_, i) => String(i + 1))]

export default function TeamWallPage() {
  const { schoolSlug, sport, year } = useParams()
  const navigate = useNavigate()

  const [wall, setWall]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [addNumber, setAddNumber] = useState(null)
  const [copied, setCopied]     = useState(false)

  const fetchWall = useCallback(async () => {
    try {
      const data = await loadTeamWallByRoute(schoolSlug, sport, Number(year))
      if (!data) setError('Wall not found.')
      else setWall(data)
    } catch (err) {
      setError('Could not load this wall.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [schoolSlug, sport, year])

  useEffect(() => { fetchWall() }, [fetchWall])

  useEffect(() => {
    if (wall) document.title = `${wall.school} ${sport} ${year} | The Number Wall`
  }, [wall, sport, year])

  // Build entry index: number → [entries]
  const entryIndex = useMemo(() => {
    if (!wall?.entries) return new Map()
    const idx = new Map()
    for (const entry of wall.entries) {
      const key = String(entry.number)
      if (!idx.has(key)) idx.set(key, [])
      idx.get(key).push(entry)
    }
    return idx
  }, [wall?.entries])

  const colorKey       = wall?.color_primary || 'orange'
  const selectedEntries = selected ? (entryIndex.get(selected) || []) : []
  const sportLabel     = sport?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  function handleTileClick(num) {
    setSelected(prev => prev === num ? null : num)
  }

  function handleAddClick(num) {
    setAddNumber(num || selected)
    setShowAdd(true)
  }

  async function handleEntryAdded() {
    setShowAdd(false)
    setAddNumber(null)
    await fetchWall()
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: `${wall.school} ${sportLabel} ${year}`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (loading) {
    return (
      <AppShell>
        <AppHeader title="TEAM WALL" back={{ label: 'Team Walls', onClick: () => navigate('/walls') }} />
        <main className="tw-page"><p className="tw-loading">Loading…</p></main>
        <AppFooter />
      </AppShell>
    )
  }

  if (error || !wall) {
    return (
      <AppShell>
        <AppHeader title="TEAM WALL" back={{ label: 'Team Walls', onClick: () => navigate('/walls') }} />
        <main className="tw-page"><p className="tw-loading">{error || 'Wall not found.'}</p></main>
        <AppFooter />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AppHeader
        title={wall.school.toUpperCase()}
        back={{ label: 'Team Walls', onClick: () => navigate('/walls') }}
      />

      <main className="tw-page">

        {/* ── Summary card — school, sport, year, location, coach ── */}
        <div className="tw-summary">
          <div className="tw-summary__top">
            <span className="tw-summary__school">{wall.school}</span>
            <span className="tw-summary__meta">
              {sportLabel} · {wall.year} · {wall.city}, {wall.state}
            </span>
          </div>
          {wall.coach_name && (
            <div className="tw-summary__coach">
              Coach {wall.coach_name}
              {wall.coach_fun_fact && <span className="tw-summary__coach-fact"> — {wall.coach_fun_fact}</span>}
            </div>
          )}
        </div>

        {/* ── Grid + panel ─────────────────────────────────── */}
        <div className="tw-body">

          <div className="tw-grid-col">
            <div className="tw-grid">
              {TILE_NUMBERS.map(num => {
                const entries   = entryIndex.get(num) || []
                const count     = entries.length
                const heat      = getTeamHeatStyle(colorKey, count)
                const textColor = getTeamTileTextColor(colorKey, count)
                const isActive  = selected === num

                const selectedGlow = heat.glow !== 'none'
                  ? `0 0 0 2px rgba(255,255,255,0.45), ${heat.glow}`
                  : '0 0 0 2px rgba(255,255,255,0.45)'

                const tileStyle = isActive
                  ? { background: heat.bg, border: '1px solid rgba(255,255,255,0.82)', borderRadius: '4px', boxShadow: selectedGlow }
                  : { background: heat.bg, border: `1px solid ${heat.border}`, borderRadius: '4px', boxShadow: heat.glow }

                return (
                  <button
                    key={num}
                    className={`wall-tile${isActive ? ' wall-tile--active' : ''}${count === 0 ? ' wall-tile--unwritten' : ''}`}
                    style={tileStyle}
                    onClick={() => handleTileClick(num)}
                    aria-label={`Number ${num}${count ? ` — ${count} ${count === 1 ? 'player' : 'players'}` : ' — empty'}`}
                  >
                    <span className="wall-tile__number" style={{ color: isActive ? '#fff' : textColor }}>
                      {num}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Detail panel — matches PlayerPanel baseline ── */}
          <aside className={`player-panel${!selected ? ' player-panel--idle' : ''}`}>
            <div className="player-panel__handle" aria-hidden="true" />
            <div className="player-panel__inner">

              {!selected && (
                <div className="player-panel__idle">
                  <div className="player-panel__idle-wall">PICK A NUMBER.</div>
                  <div className="player-panel__idle-prompt">See who wore it — or add yourself.</div>
                </div>
              )}

              {selected && (
                <>
                  <div className="player-panel__header">
                    <div className="player-panel__header-left">
                      <div
                        className="player-panel__number"
                        style={{
                          color: TEAM_PALETTES[colorKey]?.[4]?.text || 'var(--color-heat)',
                          textShadow: `0 0 28px ${TEAM_PALETTES[colorKey]?.[4]?.border || 'var(--color-heat)'}`,
                        }}
                      >
                        #{selected}
                      </div>
                      <div className="player-panel__subtitle">
                        {selectedEntries.length === 0
                          ? 'NO ONE YET'
                          : `${selectedEntries.length} ${selectedEntries.length === 1 ? 'PLAYER' : 'PLAYERS'}`
                        }
                      </div>
                    </div>
                    <div className="player-panel__header-actions">
                      <button
                        className={`player-panel__share${copied ? ' player-panel__share--copied' : ''}`}
                        onClick={handleShare}
                        aria-label="Share this wall"
                      >
                        {copied ? <><Check size={11} /> COPIED</> : <><ExternalLink size={11} /> SHARE</>}
                      </button>
                      <button className="player-panel__close" onClick={() => setSelected(null)} aria-label="Close panel">
                        <X size={11} /> CLOSE
                      </button>
                    </div>
                  </div>

                  {/* Entries */}
                  {selectedEntries.length === 0 ? (
                    <div className="player-panel__unwritten">
                      <div className="player-panel__unwritten-line">Nobody has claimed #{selected} yet.</div>
                      <div className="player-panel__unwritten-sub">Were you this number?</div>
                      <button className="player-panel__unwritten-cta" onClick={() => handleAddClick(selected)}>
                        Add a player →
                      </button>
                    </div>
                  ) : (
                    <div className="player-panel__cards">
                      {selectedEntries.map((entry, i) => (
                        <div key={entry.id} className={`player-card${i === 0 ? ' player-card--top' : ''}`}>
                          <div className="player-card__row">
                            <div className="player-card__info">
                              <div className="player-card__name-row">
                                <span className="player-card__name">{entry.name}</span>
                              </div>
                              <div className="player-card__badges">
                                {entry.position && (
                                  <span className="player-card__badge">{entry.position}</span>
                                )}
                                <span className="player-card__badge player-card__badge--dim">
                                  '{String(entry.grad_year).slice(-2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {entry.fun_fact && (
                            <div className="player-card__fact">{entry.fun_fact}</div>
                          )}
                        </div>
                      ))}
                      <button
                        className="player-panel__add-legend"
                        onClick={() => handleAddClick(selected)}
                      >
                        + Add a player
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>
          </aside>
        </div>
      </main>

      <AppFooter />

      {selected && (
        <div className="tw-backdrop" onClick={() => setSelected(null)} aria-hidden="true" />
      )}

      <AddEntry
        open={showAdd}
        onClose={() => { setShowAdd(false); setAddNumber(null) }}
        onAdded={handleEntryAdded}
        wallId={wall.id}
        wallYear={wall.year}
        prefillNumber={addNumber}
      />
    </AppShell>
  )
}
