/**
 * TeamWallsPage — browse and discover team walls.
 * Route: /walls
 *
 * Shows active walls ("BUILDING NOW"), search, and create button.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, MapPin } from 'lucide-react'
import AppShell  from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import CreateTeamWall from '../components/CreateTeamWall.jsx'
import { getActiveWalls, browseTeamWalls, slugify } from '../lib/teamWallStore.js'
import { TEAM_PALETTES } from '../data/teamColors.js'
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
    getActiveWalls(5)
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

  const wallsToShow = searchResults !== null ? searchResults : activeWalls

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
            <button className="twb-hero__cta" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Start a Team Wall
            </button>
          </div>
        </div>

        {/* ── Right: Search + Cards ────────────────────────── */}
        <div className="twb-right">
          <form className="twb-search" onSubmit={handleSearch}>
            <Search size={16} className="twb-search__icon" />
            <input
              type="text"
              className="twb-search__input"
              placeholder="Search by school name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="submit" className="twb-search__btn">
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
          ) : wallsToShow.length === 0 ? (
            <div className="twb-empty">
              {searchResults !== null
                ? <p>No walls found for "{query}". Be the first!</p>
                : <p>No team walls yet. Start one and be the first.</p>
              }
            </div>
          ) : (
            <div className="twb-cards">
              {wallsToShow.map(wall => {
                const palette = TEAM_PALETTES[wall.color_primary] || TEAM_PALETTES.orange
                const accent  = palette[3] // "hot" level
                const sportLabel = wall.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

                return (
                  <button
                    key={wall.id}
                    className="twb-card"
                    onClick={() => navigateToWall(wall)}
                  >
                    <div className="twb-card__content">
                      <span className="twb-card__dot" style={{ background: accent.bg }} />
                      <div className="twb-card__text">
                        <span className="twb-card__school">
                          {wall.school}
                        </span>
                        <div className="twb-card__meta">
                          <span>{sportLabel}</span>
                        </div>
                        <div className="twb-card__location">
                          <MapPin size={11} />
                          <span>{wall.city}, {wall.state}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <AppFooter />

      <CreateTeamWall open={showCreate} onClose={() => setShowCreate(false)} />
    </AppShell>
  )
}
