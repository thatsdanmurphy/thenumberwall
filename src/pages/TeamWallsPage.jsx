/**
 * TeamWallsPage — browse and discover team walls.
 * Route: /walls
 *
 * Shows active walls ("BUILDING NOW"), search, and create button.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Flame, Globe } from 'lucide-react'
import AppShell  from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import CreateTeamWall from '../components/CreateTeamWall.jsx'
import WallsMap from '../components/WallsMap.jsx'
import { getActiveWallsWithSignals, browseTeamWalls, slugify } from '../lib/teamWallStore.js'
import { TEAM_PALETTES } from '../data/teamColors.js'
import { getSportIcon } from '../data/sports.js'
import './TeamWallsPage.css'

export default function TeamWallsPage() {
  const navigate = useNavigate()
  const [activeWalls, setActiveWalls] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [searching, setSearching] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    document.title = 'Team Walls | The Number Wall'
    getActiveWallsWithSignals(5)
      .then(setActiveWalls)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) { setSearchResults(null); return }
    setSearching(true)
    try {
      const results = await browseTeamWalls({ query: query.trim(), limit: 20 })
      setSearchResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  function navigateToWall(wall) {
    navigate(`/walls/${wall.school_slug}/${wall.sport}`)
  }

  // Compact "last active" string. Hours up to 23, then days up to 30, then date.
  function formatSince(iso) {
    if (!iso) return null
    const now = Date.now()
    const then = new Date(iso).getTime()
    const mins = Math.floor((now - then) / 60000)
    if (mins < 1)      return 'just now'
    if (mins < 60)     return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)      return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30)     return `${days}d ago`
    return new Date(iso).toLocaleDateString()
  }

  const wallsToShow = searchResults !== null ? searchResults : activeWalls

  // Group walls by school so one card holds all sports being built.
  // Maintains insertion order — first wall seen per school sets the rank.
  const groupedWalls = useMemo(() => {
    const map = new Map()
    for (const w of wallsToShow) {
      const key = w.school_slug
      if (!map.has(key)) {
        map.set(key, {
          school_slug:  w.school_slug,
          school:       w.school,
          town:         w.town,
          state:        w.state,
          color_primary: w.color_primary,
          walls:        [],
          // Aggregate signals across all sports for this school
          entryCount:       0,
          contributorCount: 0,
          lastActivityAt:   null,
          isHot:            false,
        })
      }
      const g = map.get(key)
      g.walls.push(w)
      g.entryCount += (w.entryCount || 0)
      g.contributorCount += (w.contributorCount || 0)
      if (w.lastActivityAt && (!g.lastActivityAt || w.lastActivityAt > g.lastActivityAt)) {
        g.lastActivityAt = w.lastActivityAt
      }
      if (w.lastActivityAt && (Date.now() - new Date(w.lastActivityAt).getTime()) < 24 * 60 * 60 * 1000) {
        g.isHot = true
      }
    }
    return Array.from(map.values())
  }, [wallsToShow])

  return (
    <AppShell>
      <AppHeader title="TEAM WALLS" back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="twb-page">
        {/* ── Left: Hero ───────────────────────────────────── */}
        <div className="twb-left">
          <div className="twb-hero">
            <h2 className="twb-hero__heading">EVERY TEAM HAS A WALL.</h2>
            <p className="twb-hero__sub">
              Start a wall for your team. Share the link. Let your teammates claim their numbers.
            </p>
            <p className="twb-hero__sub twb-hero__sub--dim">
              Every legend on the main wall started on a team like yours.
            </p>
            <button className="tnw-btn tnw-btn--primary twb-hero__cta" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Start a Team Wall
            </button>
          </div>

          <WallsMap />

        </div>

        {/* ── Right: Search + Cards ────────────────────────── */}
        <div className="twb-right">
          <form className="twb-search" onSubmit={handleSearch}>
            <Search size={16} className="twb-search__icon" />
            <input
              type="text"
              className="tnw-input twb-search__input"
              placeholder="Search by school name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="submit" className="tnw-btn tnw-btn--ghost twb-search__btn">
                Search
              </button>
            )}
          </form>

          <span className="twb-section-label">
            {searchResults !== null
              ? `${searchResults.length} RESULT${searchResults.length !== 1 ? 'S' : ''}`
              : 'BUILDING NOW'
            }
          </span>

          {loading ? (
            <p className="twb-empty">Loading…</p>
          ) : groupedWalls.length === 0 ? (
            <div className="twb-empty">
              {searchResults !== null
                ? <p>No walls found for "{query}". Be the first!</p>
                : <p>No team walls yet. Start one and be the first.</p>
              }
            </div>
          ) : (
            <div className="twb-cards">
              {groupedWalls.map(group => {
                const palette = TEAM_PALETTES[group.color_primary] || TEAM_PALETTES.orange
                const accent  = palette[3]
                const since   = formatSince(group.lastActivityAt)

                return (
                  <div key={group.school_slug} className="twb-card-wrap">
                    <div className="twb-card">
                      <div className="twb-card__content">
                        <span className="twb-card__dot" style={{ background: accent.bg }} />
                        <div className="twb-card__text">
                          <div className="twb-card__top">
                            <span className="twb-card__school">{group.school}</span>
                            {group.isHot && (
                              <span className="twb-card__hot" title="Active in the last 24 hours">
                                <Flame size={10} /> HOT
                              </span>
                            )}
                          </div>
                          <div className="twb-card__sports">
                            {group.walls.map(w => {
                              const Icon = getSportIcon(w.sport)
                              const label = w.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                              return (
                                <button
                                  key={w.id}
                                  className="twb-card__sport-pill"
                                  onClick={() => navigateToWall(w)}
                                >
                                  {Icon && <Icon size={11} />}
                                  <span>{label}</span>
                                </button>
                              )
                            })}
                          </div>
                          <div className="twb-card__meta">
                            {group.town && (
                              <span className="twb-card__meta-town">{group.town}, {group.state}</span>
                            )}
                          </div>
                          <div className="twb-card__signals">
                            {group.entryCount > 0 && (
                              <span className="twb-card__signal">
                                {group.entryCount} {group.entryCount === 1 ? 'name' : 'names'}
                              </span>
                            )}
                            {group.contributorCount > 0 && (
                              <span className="twb-card__signal">
                                <Users size={10} /> {group.contributorCount}
                              </span>
                            )}
                            {since && (
                              <span className="twb-card__signal twb-card__signal--dim">
                                {since}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="twb-global-cta">
          <Globe size={16} />
          <span>Team outside the US? Let us know — we'll open up the map.</span>
        </div>
      </main>

      <AppFooter />

      <CreateTeamWall open={showCreate} onClose={() => setShowCreate(false)} />
    </AppShell>
  )
}
