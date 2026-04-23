/**
 * TeamWallsPage — browse and discover team walls.
 * Route: /walls
 *
 * Shows active walls ("BUILDING NOW"), search, and create button.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Globe, ChevronRight, ExternalLink } from 'lucide-react'
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
    getActiveWallsWithSignals(100)
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
          entryCount:       0,
          legendCount:      0,
          contributorCount: 0,
          lastActivityAt:   null,
        })
      }
      const g = map.get(key)
      g.walls.push(w)
      g.entryCount += (w.entryCount || 0)
      g.legendCount += (w.legendCount || 0)
      g.contributorCount += (w.contributorCount || 0)
      if (w.lastActivityAt && (!g.lastActivityAt || w.lastActivityAt > g.lastActivityAt)) {
        g.lastActivityAt = w.lastActivityAt
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
            <h2 className="twb-hero__heading">DID YOU PLAY WITH A LEGEND?</h2>
            <p className="twb-hero__sub">
              Every legend came from somewhere. Find their school, see who else played there, and put your name on the wall too.
            </p>
            <button className="tnw-btn tnw-btn--primary twb-hero__cta" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Start a wall
            </button>
          </div>

          <WallsMap />

          <div className="twb-global-cta">
            <Globe size={16} />
            <span>Legends came from everywhere. Walls across 5 countries and counting.</span>
          </div>
        </div>

        {/* ── Right: Search + Cards ────────────────────────── */}
        <div className="twb-right">
          <form className="twb-search" onSubmit={handleSearch}>
            <Search size={16} className="twb-search__icon" />
            <input
              type="text"
              className="tnw-input twb-search__input"
              placeholder="Search by program or school…"
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
              : 'WHERE LEGENDS PLAYED'
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
                const since = formatSince(group.lastActivityAt)
                const sportsLabel = group.walls
                  .map(w => w.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
                  .join(' · ')

                return (
                  <button
                    key={group.school_slug}
                    className="twb-card"
                    onClick={() => navigateToWall(group.walls[0])}
                  >
                    <div className="twb-card__text">
                      <span className="twb-card__school">{group.school}</span>
                      <span className="twb-card__sports-line">{sportsLabel}</span>
                      {group.town && (
                        <span className="twb-card__meta-line">
                          {group.town}{group.state ? `, ${group.state}` : group.walls[0]?.country ? `, ${group.walls[0].country}` : ''}
                          {group.legendCount > 0 && ` · ${group.legendCount} ${group.legendCount === 1 ? 'legend' : 'legends'} came through here`}
                        </span>
                      )}
                    </div>
                    <span
                      className="twb-card__share"
                      role="button"
                      aria-label={`Share ${group.school}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        const url = `${window.location.origin}/walls/${group.school_slug}/${group.walls[0].sport}`
                        const title = `${group.school} — The Number Wall`
                        if (navigator.share) {
                          navigator.share({ title, url }).catch(() => {})
                        } else {
                          navigator.clipboard.writeText(url).catch(() => {})
                        }
                      }}
                    >
                      <ExternalLink size={12} />
                    </span>
                    <ChevronRight size={16} className="twb-card__arrow" />
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
