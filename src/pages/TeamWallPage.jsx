/**
 * TeamWallPage — displays a single crowdsourced team wall.
 * Route: /walls/:schoolSlug/:sport
 *
 * Grid shows numbers 0–99. Heat from entry density in team colors.
 * One wall per school per sport — accumulates across all years.
 * Add-player form is always visible in the panel.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, X, Pencil, Plus } from 'lucide-react'
import { getSportIcon, TEAM_SPORTS } from '../data/sports.js'
import AppShell   from '../components/AppShell.jsx'
import AppHeader  from '../components/AppHeader.jsx'
import AppFooter  from '../components/AppFooter.jsx'
import WallGrid   from '../components/WallGrid.jsx'
import { loadTeamWallByRoute, addTeamEntry, updateTeamEntry, getSchoolSports, createTeamWall } from '../lib/teamWallStore.js'
import { getTeamHeatStyle, getTeamTileTextColor, TEAM_PALETTES } from '../data/teamColors.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import './WallPage.css'        // shared layout: wall-page__body, wall-page__grid-col
import './TeamWallPage.css'    // team-wall-specific: coach tile, sport picker, add form

// Sport constants imported from data/sports.js (single source of truth)

// Team walls: 0-99 (no 00 — that's legend wall only)
const TEAM_TILE_NUMBERS = ['0', ...Array.from({ length: 99 }, (_, i) => String(i + 1))]

export default function TeamWallPage() {
  const { schoolSlug, sport } = useParams()
  const navigate = useNavigate()

  const [wall, setWall]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)

  // Inline add form state
  const [addName, setAddName]         = useState('')
  const [addPosition, setAddPosition] = useState('')
  const [addGradYear, setAddGradYear] = useState('')
  const [addFunFact, setAddFunFact]   = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError]       = useState(null)
  const [addSuccess, setAddSuccess]   = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Year filter for panel entries
  const [yearFilter, setYearFilter]   = useState(null) // null = all years

  // Sports nav — other sports for this school
  const [schoolSports, setSchoolSports] = useState([])
  const [showSportPicker, setShowSportPicker] = useState(false)
  const [addingSport, setAddingSport]         = useState(false)

  // Edit state — which entry is being edited
  const [editingId, setEditingId]     = useState(null)
  const [editName, setEditName]       = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editGradYear, setEditGradYear] = useState('')
  const [editFunFact, setEditFunFact] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const fetchWall = useCallback(async () => {
    try {
      const data = await loadTeamWallByRoute(schoolSlug, sport)
      if (!data) setError('Wall not found.')
      else setWall(data)
    } catch (err) {
      setError('Could not load this wall.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [schoolSlug, sport])

  const sportLabel = sport?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  useEffect(() => { fetchWall() }, [fetchWall])

  // Fetch all sports for this school (for sports nav)
  useEffect(() => {
    if (schoolSlug) {
      getSchoolSports(schoolSlug).then(setSchoolSports).catch(console.error)
    }
  }, [schoolSlug])

  useEffect(() => {
    if (wall) document.title = `${wall.school} ${sportLabel} | The Number Wall`
  }, [wall, sportLabel])

  // Reset forms when selecting a different number
  useEffect(() => {
    setAddName(''); setAddPosition(''); setAddGradYear(''); setAddFunFact('')
    setAddError(null); setAddSuccess(false); setShowAddForm(false)
    setEditingId(null); setYearFilter(null)
  }, [selected])

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

  // Unique years across entries for this number (for filter chips)
  const uniqueYears = useMemo(() => {
    const years = selectedEntries
      .map(e => e.grad_year)
      .filter(Boolean)
    return [...new Set(years)].sort((a, b) => a - b)
  }, [selectedEntries])

  // Apply year filter
  const filteredEntries = useMemo(() => {
    if (!yearFilter) return selectedEntries
    return selectedEntries.filter(e => e.grad_year === yearFilter)
  }, [selectedEntries, yearFilter])

  function handleTileClick(num) {
    setSelected(prev => prev === num ? null : num)
  }

  // WallGrid onSelect adapter — WallGrid passes { number, entries } or null
  function handleGridSelect(sel) {
    setSelected(sel ? sel.number : null)
  }

  // Team-color heat function — passed to WallGrid → WallTile
  const tileHeatFn = useCallback((num, _entries) => {
    const count     = (entryIndex.get(num) || []).length
    const heatStyle = getTeamHeatStyle(colorKey, count)
    const textColor = getTeamTileTextColor(colorKey, count)
    return { heatStyle, textColor }
  }, [entryIndex, colorKey])

  async function handleAdd(e) {
    e.preventDefault()
    if (!addName.trim() || addSubmitting) return

    const nameCheck = checkProfanity(addName)
    if (!nameCheck.clean) { setAddError(nameCheck.reason); return }
    if (addFunFact) {
      const factCheck = checkProfanity(addFunFact)
      if (!factCheck.clean) { setAddError(factCheck.reason); return }
    }

    setAddSubmitting(true)
    setAddError(null)

    try {
      await addTeamEntry(wall.id, {
        number: selected,
        name: addName.trim(),
        gradYear: addGradYear ? Number(addGradYear) : null,
        position: addPosition.trim() || null,
        funFact: addFunFact.trim() || null,
      })
      setAddName(''); setAddPosition(''); setAddGradYear(''); setAddFunFact('')
      setAddSuccess(true)
      setShowAddForm(false)  // close form, back to card view
      await fetchWall()
      setTimeout(() => setAddSuccess(false), 2000)
    } catch (err) {
      setAddError('Something went wrong. Try again.')
      console.error(err)
    } finally {
      setAddSubmitting(false)
    }
  }

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: `${wall.school} ${sportLabel}`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  function startEditing(entry) {
    setEditingId(entry.id)
    setEditName(entry.name || '')
    setEditPosition(entry.position || '')
    setEditGradYear(entry.grad_year ? String(entry.grad_year) : '')
    setEditFunFact(entry.fun_fact || '')
  }

  async function handleEditSave(e) {
    e.preventDefault()
    if (!editName.trim() || editSubmitting) return
    const nameCheck = checkProfanity(editName)
    if (!nameCheck.clean) { setAddError(nameCheck.reason); return }
    setEditSubmitting(true)
    try {
      await updateTeamEntry(editingId, {
        name: editName.trim(),
        position: editPosition.trim() || null,
        gradYear: editGradYear ? Number(editGradYear) : null,
        funFact: editFunFact.trim() || null,
      })
      setEditingId(null)
      await fetchWall()
    } catch (err) {
      console.error(err)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Inline add sport — creates wall with same school info, navigates
  async function handleAddSport(sportId) {
    if (addingSport) return
    setAddingSport(true)
    try {
      await createTeamWall({
        school: wall.school,
        city: wall.city,
        state: wall.state,
        sport: sportId,
        colorPrimary: wall.color_primary,
      })
      setShowSportPicker(false)
      // Refresh sports list then navigate
      getSchoolSports(schoolSlug).then(setSchoolSports).catch(console.error)
      navigate(`/walls/${schoolSlug}/${sportId}`)
    } catch (err) {
      if (err?.code === '23505') {
        setShowSportPicker(false)
        navigate(`/walls/${schoolSlug}/${sportId}`)
      } else {
        console.error('Add sport error:', err)
      }
    } finally {
      setAddingSport(false)
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

        {/* ── Sports nav — reuses SportsFilter pill styles ── */}
        <div className="sports-filter" role="group" aria-label="Sports at this school">
          {schoolSports.map(s => {
            const isActive = s.sport === sport
            const label = s.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            const Icon = getSportIcon(s.sport)
            return (
              <button
                key={s.id}
                className={`sports-filter__pill${isActive ? ' sports-filter__pill--active' : ''}`}
                onClick={() => !isActive && navigate(`/walls/${schoolSlug}/${s.sport}`)}
                aria-pressed={isActive}
              >
                {Icon && <Icon size={13} className="sports-filter__icon" />}
                {label}
              </button>
            )
          })}
          {/* Add sport — expands inline picker */}
          <button
            className="tw-sports-nav__add"
            onClick={() => setShowSportPicker(p => !p)}
          >
            <Plus size={12} /> Add sport
          </button>

          {/* Inline sport picker — slides out when open */}
          {showSportPicker && (
            <div className="tw-sport-picker">
              {TEAM_SPORTS
                .filter(s => !schoolSports.some(ss => ss.sport === s.id))
                .map(s => {
                  const Icon = getSportIcon(s.id)
                  return (
                    <button
                      key={s.id}
                      className="sports-filter__pill tw-sport-picker__pill"
                      onClick={() => handleAddSport(s.id)}
                      disabled={addingSport}
                    >
                      {Icon && <Icon size={13} className="sports-filter__icon" />}
                      {s.label}
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        {/* ── Grid + panel ─────────────────────────────────── */}
        {/* Reuses wall-page__body layout — golden ratio grid + panel */}
        <div className="wall-page__body">

          <div className="wall-page__grid-col">
            {/* Shared WallGrid — reuses grid layout, tile rendering, keyboard nav */}
            <WallGrid
              index={entryIndex}
              activeNumber={selected}
              onSelect={handleGridSelect}
              numbers={TEAM_TILE_NUMBERS}
              tileHeatFn={tileHeatFn}
              prefixContent={
                <button
                  className="tw-coach-tile"
                  style={{
                    background: TEAM_PALETTES[colorKey]?.[1]?.bg || 'rgba(255,255,255,0.03)',
                    border: `1px solid ${TEAM_PALETTES[colorKey]?.[1]?.border || 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <span className="tw-coach-tile__label">HC</span>
                  <span className="tw-coach-tile__name">
                    {wall.coach_name || <span className="tw-coach-tile__empty">Add</span>}
                  </span>
                </button>
              }
            />
          </div>

          {/* ── Panel ─────────────────────────────────────────── */}
          <aside className={`player-panel${!selected ? ' player-panel--idle' : ''}`}>
            <div className="player-panel__handle" aria-hidden="true" />
            <div className="player-panel__inner">

              {!selected && (
                <div className="player-panel__idle">
                  <div className="player-panel__idle-wall">PICK A NUMBER.</div>
                  <div className="player-panel__idle-prompt">See who wore it — or add a name.</div>
                </div>
              )}

              {selected && (
                <>
                  {/* Number + close */}
                  <div className="tw-panel-header">
                    <div
                      className="player-panel__number"
                      style={{
                        color: TEAM_PALETTES[colorKey]?.[4]?.text || 'var(--color-heat)',
                        textShadow: `0 0 28px ${TEAM_PALETTES[colorKey]?.[4]?.border || 'var(--color-heat)'}`,
                      }}
                    >
                      #{selected}
                    </div>
                    <button className="player-panel__close" onClick={() => setSelected(null)} aria-label="Close panel">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Year filter chips — show when entries span 2+ years */}
                  {uniqueYears.length >= 2 && (
                    <div className="tw-year-filter">
                      <button
                        className={`tw-year-chip${!yearFilter ? ' tw-year-chip--active' : ''}`}
                        onClick={() => setYearFilter(null)}
                      >
                        ALL
                      </button>
                      {uniqueYears.map(yr => (
                        <button
                          key={yr}
                          className={`tw-year-chip${yearFilter === yr ? ' tw-year-chip--active' : ''}`}
                          onClick={() => setYearFilter(yr === yearFilter ? null : yr)}
                        >
                          '{String(yr).slice(-2)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Player cards — reuses player-card styles from main wall */}
                  {filteredEntries.length > 0 ? (
                    <div className="player-panel__cards">
                      {filteredEntries.map((entry, i) => (
                        editingId === entry.id ? (
                          /* Inline edit form */
                          <form key={entry.id} className="tw-add" onSubmit={handleEditSave}>
                            <span className="tw-add__label">EDIT</span>
                            <input type="text" className="tnw-input tw-add__input" placeholder="Name"
                              value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                            <div className="tw-add__row">
                              <input type="text" className="tnw-input tw-add__input tw-add__input--half" placeholder="Position"
                                value={editPosition} onChange={e => setEditPosition(e.target.value)} maxLength={20} />
                              <input type="text" className="tnw-input tw-add__input tw-add__input--half" placeholder="Grad year"
                                value={editGradYear} onChange={e => setEditGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                inputMode="numeric" maxLength={4} />
                            </div>
                            <input type="text" className="tnw-input tw-add__input" placeholder="Fun fact (optional)"
                              value={editFunFact} onChange={e => setEditFunFact(e.target.value.slice(0, 140))} maxLength={140} />
                            <div className="tw-add__row">
                              <button type="submit" className="tnw-btn tnw-btn--secondary tw-add__submit" disabled={!editName.trim() || editSubmitting}>
                                {editSubmitting ? <Loader size={12} className="tw-add__spinner" /> : 'Save'}
                              </button>
                              <button type="button" className="tnw-btn tnw-btn--secondary tw-add__submit" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div key={entry.id} className="player-card" style={i === 0 ? {
                            background: TEAM_PALETTES[colorKey]?.[2]?.bg || 'rgba(232,124,42,0.07)',
                            borderColor: TEAM_PALETTES[colorKey]?.[2]?.border || 'rgba(232,124,42,0.30)',
                          } : undefined}>
                            <div className="player-card__row">
                              <div className="player-card__info">
                                <div className="player-card__name-row">
                                  <span className="player-card__name">{entry.name}</span>
                                  <button className="tw-entry__edit" onClick={() => startEditing(entry)} aria-label="Edit">
                                    <Pencil size={11} />
                                  </button>
                                </div>
                                <div className="player-card__badges">
                                  {entry.position && <span className="player-card__badge player-card__badge--dim">{entry.position}</span>}
                                  {entry.grad_year && <span className="player-card__badge player-card__badge--dim">'{String(entry.grad_year).slice(-2)}</span>}
                                </div>
                              </div>
                            </div>
                            {entry.fun_fact && <div className="player-card__fact">{entry.fun_fact}</div>}
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="tw-empty-number">
                      <span className="tw-empty-number__text">
                        {yearFilter
                          ? `No one from '${String(yearFilter).slice(-2)} wore #${selected} yet.`
                          : `Remember who wore #${selected}?`
                        }
                      </span>
                    </div>
                  )}

                  {/* Add a player — button toggles form */}
                  {!showAddForm ? (
                    <button className="player-panel__add-legend" onClick={() => setShowAddForm(true)}>
                      + Add a Player
                    </button>
                  ) : (
                    <form className="tw-add" onSubmit={handleAdd}>
                      <span className="tw-add__label">ADD A PLAYER</span>
                      {addError && <span className="tw-add__error">{addError}</span>}
                      <input type="text" className="tnw-input tw-add__input" placeholder="Name"
                        value={addName} onChange={e => setAddName(e.target.value)} autoFocus />
                      <div className="tw-add__row">
                        <input type="text" className="tnw-input tw-add__input tw-add__input--half" placeholder="Position"
                          value={addPosition} onChange={e => setAddPosition(e.target.value)} maxLength={20} />
                        <input type="text" className="tnw-input tw-add__input tw-add__input--half" placeholder="Grad year"
                          value={addGradYear} onChange={e => setAddGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                          inputMode="numeric" maxLength={4} />
                      </div>
                      <input type="text" className="tnw-input tw-add__input" placeholder="Fun fact (optional)"
                        value={addFunFact} onChange={e => setAddFunFact(e.target.value.slice(0, 140))} maxLength={140} />
                      <div className="tw-add__row">
                        <button type="submit" className="tnw-btn tnw-btn--secondary tw-add__submit" disabled={!addName.trim() || addSubmitting}>
                          {addSubmitting ? <Loader size={12} className="tw-add__spinner" /> : addSuccess ? 'Added' : 'Add'}
                        </button>
                        <button type="button" className="tnw-btn tnw-btn--secondary tw-add__submit" onClick={() => setShowAddForm(false)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      <AppFooter />

      {selected && (
        <div className="tnw-backdrop tw-backdrop" onClick={() => setSelected(null)} aria-hidden="true" />
      )}

      {/* Create modal — launched from sports nav "Add sport" */}
    </AppShell>
  )
}
