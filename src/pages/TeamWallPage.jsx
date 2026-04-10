/**
 * TeamWallPage — displays a single crowdsourced team wall.
 * Route: /walls/:schoolSlug/:sport/:year
 *
 * Grid shows numbers 0–99. Heat from entry density in team colors.
 * Add-player form is inline in the panel, not a modal.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader, X } from 'lucide-react'
import AppShell   from '../components/AppShell.jsx'
import AppHeader  from '../components/AppHeader.jsx'
import AppFooter  from '../components/AppFooter.jsx'
import { loadTeamWallByRoute, addTeamEntry } from '../lib/teamWallStore.js'
import { getTeamHeatStyle, getTeamTileTextColor, TEAM_PALETTES } from '../data/teamColors.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import './TeamWallPage.css'

const TILE_NUMBERS = ['0', ...Array.from({ length: 99 }, (_, i) => String(i + 1))]

export default function TeamWallPage() {
  const { schoolSlug, sport, year } = useParams()
  const navigate = useNavigate()

  const [wall, setWall]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null)

  // Inline add form state
  const [addName, setAddName]         = useState('')
  const [addPosition, setAddPosition] = useState('')
  const [addFunFact, setAddFunFact]   = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError]       = useState(null)
  const [addSuccess, setAddSuccess]   = useState(false)

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

  // Reset add form when selecting a different number
  useEffect(() => {
    setAddName(''); setAddPosition(''); setAddFunFact('')
    setAddError(null); setAddSuccess(false)
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
  const sportLabel     = sport?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

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
        gradYear: Number(year),
        position: addPosition.trim() || null,
        funFact: addFunFact.trim() || null,
      })
      setAddName(''); setAddPosition(''); setAddFunFact('')
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
      navigator.share({ title: `${wall.school} ${sportLabel} ${year}`, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).catch(() => {})
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

        {/* ── Summary line — one line, no box ──────────────── */}
        <div className="tw-summary">
          <span className="tw-summary__meta">
            {sportLabel} · {wall.year} · {wall.city}, {wall.state}
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
                      <X size={11} /> CLOSE
                    </button>
                  </div>

                  {/* Entries — flat list, no card wrapper */}
                  {selectedEntries.length === 0 ? (
                    <div className="tw-empty-number">
                      <span className="tw-empty-number__text">Remember who wore #{selected}?</span>
                    </div>
                  ) : (
                    <div className="tw-entries">
                      {selectedEntries.map((entry) => (
                        <div key={entry.id} className="tw-entry">
                          <span className="tw-entry__name">{entry.name}</span>
                          {entry.position && <span className="tw-entry__badge">{entry.position}</span>}
                          {entry.fun_fact && <p className="tw-entry__fact">{entry.fun_fact}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline add form */}
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
                        placeholder="Fun fact"
                        value={addFunFact}
                        onChange={e => setAddFunFact(e.target.value.slice(0, 140))}
                        maxLength={140}
                      />
                    </div>
                    <button
                      type="submit"
                      className="tw-add__submit"
                      disabled={!addName.trim() || addSubmitting}
                    >
                      {addSubmitting ? <Loader size={12} className="tw-add__spinner" /> : addSuccess ? 'Added' : 'Add'}
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
