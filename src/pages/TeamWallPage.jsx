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
import AppShell   from '../components/AppShell.jsx'
import AppHeader  from '../components/AppHeader.jsx'
import AppFooter  from '../components/AppFooter.jsx'
import { loadTeamWallByRoute, addTeamEntry, updateTeamEntry, getSchoolSports } from '../lib/teamWallStore.js'
import { getTeamHeatStyle, getTeamTileTextColor, TEAM_PALETTES } from '../data/teamColors.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import './TeamWallPage.css'

const TILE_NUMBERS = ['0', ...Array.from({ length: 99 }, (_, i) => String(i + 1))]

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

  // Year filter for panel entries
  const [yearFilter, setYearFilter]   = useState(null) // null = all years

  // Sports nav — other sports for this school
  const [schoolSports, setSchoolSports] = useState([])

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
    setAddError(null); setAddSuccess(false)
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
      setTimeout(() => setAddSuccess(false), 2000)
      await fetchWall()
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

        {/* ── Sports nav — active sports lit, others show + ── */}
        {schoolSports.length > 0 && (
          <div className="tw-sports-nav">
            {schoolSports.map(s => {
              const isActive = s.sport === sport
              const label = s.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              return (
                <button
                  key={s.id}
                  className={`tw-sport-chip${isActive ? ' tw-sport-chip--active' : ''}`}
                  onClick={() => !isActive && navigate(`/walls/${schoolSlug}/${s.sport}`)}
                  style={isActive ? {
                    borderColor: TEAM_PALETTES[s.color_primary]?.[3]?.border || 'rgba(255,255,255,0.3)',
                    color: TEAM_PALETTES[s.color_primary]?.[3]?.text || '#fff',
                  } : undefined}
                >
                  {label}
                </button>
              )
            })}
            <button
              className="tw-sport-chip tw-sport-chip--add"
              onClick={() => navigate('/walls')}
              title="Start another sport wall for this school"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        {/* ── Summary line — one line, no box ──────────────── */}
        <div className="tw-summary">
          <span className="tw-summary__meta">
            {sportLabel} · {wall.city}, {wall.state}
          </span>
          {wall.coach_name && (
            <span className="tw-summary__coach">
              Coach {wall.coach_name}{wall.coach_fun_fact ? ` — ${wall.coach_fun_fact}` : ''}
            </span>
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

                  {/* Entries — always shown if they exist */}
                  {filteredEntries.length > 0 ? (
                    <div className="tw-entries">
                      {filteredEntries.map((entry) => (
                        editingId === entry.id ? (
                          /* Inline edit form */
                          <form key={entry.id} className="tw-add" onSubmit={handleEditSave}>
                            <span className="tw-add__label">EDIT</span>
                            <input
                              type="text"
                              className="tw-add__input"
                              placeholder="Name"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              autoFocus
                            />
                            <div className="tw-add__row">
                              <input
                                type="text"
                                className="tw-add__input tw-add__input--half"
                                placeholder="Position"
                                value={editPosition}
                                onChange={e => setEditPosition(e.target.value)}
                                maxLength={20}
                              />
                              <input
                                type="text"
                                className="tw-add__input tw-add__input--half"
                                placeholder="Grad year"
                                value={editGradYear}
                                onChange={e => setEditGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                inputMode="numeric"
                                maxLength={4}
                              />
                            </div>
                            <input
                              type="text"
                              className="tw-add__input"
                              placeholder="Fun fact (optional)"
                              value={editFunFact}
                              onChange={e => setEditFunFact(e.target.value.slice(0, 140))}
                              maxLength={140}
                            />
                            <div className="tw-add__row">
                              <button type="submit" className="tw-add__submit" disabled={!editName.trim() || editSubmitting}>
                                {editSubmitting ? <Loader size={12} className="tw-add__spinner" /> : 'Save'}
                              </button>
                              <button type="button" className="tw-add__submit" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div key={entry.id} className="tw-entry">
                            <span className="tw-entry__name">{entry.name}</span>
                            {entry.position && <span className="tw-entry__badge">{entry.position}</span>}
                            {entry.grad_year && <span className="tw-entry__badge">'{String(entry.grad_year).slice(-2)}</span>}
                            <button className="tw-entry__edit" onClick={() => startEditing(entry)} aria-label="Edit">
                              <Pencil size={11} />
                            </button>
                            {entry.fun_fact && <p className="tw-entry__fact">{entry.fun_fact}</p>}
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

                  {/* Add form — ALWAYS visible */}
                  <form className="tw-add" onSubmit={handleAdd}>
                    <span className="tw-add__label">ADD A PLAYER</span>
                    {addError && <span className="tw-add__error">{addError}</span>}
                    <input
                      type="text"
                      className="tw-add__input"
                      placeholder="Name"
                      value={addName}
                      onChange={e => setAddName(e.target.value)}
                    />
                    <div className="tw-add__row">
                      <input
                        type="text"
                        className="tw-add__input tw-add__input--half"
                        placeholder="Position"
                        value={addPosition}
                        onChange={e => setAddPosition(e.target.value)}
                        maxLength={20}
                      />
                      <input
                        type="text"
                        className="tw-add__input tw-add__input--half"
                        placeholder="Grad year"
                        value={addGradYear}
                        onChange={e => setAddGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        inputMode="numeric"
                        maxLength={4}
                      />
                    </div>
                    <input
                      type="text"
                      className="tw-add__input"
                      placeholder="Fun fact (optional)"
                      value={addFunFact}
                      onChange={e => setAddFunFact(e.target.value.slice(0, 140))}
                      maxLength={140}
                    />
                    <button
                      type="submit"
                      className="tw-add__submit"
                      disabled={!addName.trim() || addSubmitting}
                    >
                      {addSubmitting ? <Loader size={12} className="tw-add__spinner" /> : addSuccess ? 'Added ✓' : 'Add'}
                    </button>
                  </form>
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
    </AppShell>
  )
}
