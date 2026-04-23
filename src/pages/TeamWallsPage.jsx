/**
 * TeamWallsPage — legend origins discovery experience.
 * Route: /walls
 *
 * Desktop: Zillow-style split — 61.8% map / 38.2% scrollable card list.
 * Mobile:  Feed-first with map toggle.
 *
 * Cards are legend-led: school name on top, legend names underneath.
 * Map and list are synchronized — hover card pulses dot, click dot
 * highlights + scrolls card.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Globe, ChevronRight, ExternalLink, Map as MapIcon, List } from 'lucide-react'
import AppShell  from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import CreateTeamWall from '../components/CreateTeamWall.jsx'
import WallsMap from '../components/WallsMap.jsx'
import { getActiveWallsWithSignals, browseTeamWalls } from '../lib/teamWallStore.js'
import { trackEvent } from '../lib/analytics.js'
import './TeamWallsPage.css'

export default function TeamWallsPage() {
  const navigate = useNavigate()
  const [activeWalls, setActiveWalls] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [query, setQuery]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [searching, setSearching] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Map-list sync state
  const [hoveredSchool, setHoveredSchool] = useState(null)
  const [highlightedSchool, setHighlightedSchool] = useState(null)

  // Mobile view mode
  const [mobileView, setMobileView] = useState('list') // 'list' | 'map'

  const cardRefs = useRef({})

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

  const wallsToShow = searchResults !== null ? searchResults : activeWalls

  // Group walls by school — one card per school, multiple sports inside.
  const groupedWalls = useMemo(() => {
    const map = new Map()
    for (const w of wallsToShow) {
      const key = w.school_slug
      if (!map.has(key)) {
        map.set(key, {
          school_slug:    w.school_slug,
          school:         w.school,
          town:           w.town,
          state:          w.state,
          town_slug:      w.town_slug,
          color_primary:  w.color_primary,
          walls:          [],
          entryCount:       0,
          legendCount:      0,
          topNames:         [],
          contributorCount: 0,
          lastActivityAt:   null,
        })
      }
      const g = map.get(key)
      g.walls.push(w)
      g.entryCount += (w.entryCount || 0)
      g.legendCount += (w.legendCount || 0)
      if (w.topNames) g.topNames.push(...w.topNames)
      g.contributorCount += (w.contributorCount || 0)
      if (w.lastActivityAt && (!g.lastActivityAt || w.lastActivityAt > g.lastActivityAt)) {
        g.lastActivityAt = w.lastActivityAt
      }
    }
    return Array.from(map.values())
  }, [wallsToShow])

  // Map dot clicked → highlight card + scroll to it
  const handleMapDotClick = useCallback((townSlug) => {
    // Find first school in this town
    const match = groupedWalls.find(g => g.town_slug === townSlug)
    if (match) {
      setHighlightedSchool(match.school_slug)
      const ref = cardRefs.current[match.school_slug]
      if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setTimeout(() => setHighlightedSchool(null), 2500)
    }
  }, [groupedWalls])

  // Card hover → tell map which town to pulse
  const handleCardHover = useCallback((townSlug) => {
    setHoveredSchool(townSlug)
  }, [])

  return (
    <AppShell>
      <AppHeader title="TEAM WALLS" back={{ label: 'Main Wall', onClick: () => navigate('/') }} />

      <main className="twb-page">
        {/* ── Desktop: split layout ─────────────────────── */}
        <div className="twb-split">
          {/* Left: map */}
          <div className="twb-map-col">
            <div className="twb-map-hero-text">
              <h2 className="twb-hero__heading">Did you play with a legend?</h2>
              <p className="twb-hero__sub">
                Every legend came from somewhere. Find their school — and if you played there too, put those names on the wall.
              </p>
            </div>
            <WallsMap
              hoveredTown={hoveredSchool}
              onDotClick={handleMapDotClick}
            />
            <div className="twb-global-cta">
              <Globe size={14} />
              <span>Walls across 5 countries and counting</span>
            </div>
          </div>

          {/* Right: search + card list */}
          <div className="twb-list-col">
            <form className="twb-search" onSubmit={handleSearch}>
              <Search size={14} className="twb-search__icon" />
              <input
                type="text"
                className="tnw-input twb-search__input"
                placeholder="Search by school or legend…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button type="submit" className="tnw-btn tnw-btn--ghost twb-search__btn">
                  Search
                </button>
              )}
            </form>

            <div className="twb-list-header">
              <span className="twb-section-label">
                {searchResults !== null
                  ? `${searchResults.length} RESULT${searchResults.length !== 1 ? 'S' : ''}`
                  : 'LEGEND ORIGINS'
                }
              </span>
              <button className="tnw-btn tnw-btn--primary twb-start-btn" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Start a wall
              </button>
            </div>

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
                  const sportsLabel = group.walls
                    .map(w => w.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
                    .join(' · ')
                  const topNames = [...new Set(group.topNames || [])].slice(0, 3)
                  const topNamesStr = topNames.join(', ')
                  const locParts = [group.town, group.state || group.walls[0]?.country].filter(Boolean)
                  const locStr = locParts.join(', ')

                  return (
                    <button
                      key={group.school_slug}
                      ref={el => { cardRefs.current[group.school_slug] = el }}
                      className={`twb-card${highlightedSchool === group.school_slug ? ' twb-card--highlighted' : ''}`}
                      onClick={() => navigateToWall(group.walls[0])}
                      onMouseEnter={() => handleCardHover(group.town_slug)}
                      onMouseLeave={() => handleCardHover(null)}
                    >
                      <div className="twb-card__body">
                        <span className="twb-card__school">{group.school}</span>
                        <span className="twb-card__loc">
                          {locStr}{locStr ? ' · ' : ''}{sportsLabel}
                        </span>

                        {topNamesStr && (
                          <div className="twb-card__legends">
                            <span className="twb-card__legends-label">Names on the wall</span>
                            <span className="twb-card__legends-names">
                              {topNamesStr}
                            </span>
                          </div>
                        )}

                        <div className="twb-card__stats">
                          <span className="twb-card__stat">{group.entryCount} {group.entryCount === 1 ? 'name' : 'names'}</span>
                          {group.contributorCount > 0 && (
                            <span className="twb-card__stat">{group.contributorCount} {group.contributorCount === 1 ? 'contributor' : 'contributors'}</span>
                          )}
                        </div>
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
                          trackEvent('share_tap', { wall: group.school_slug, context: 'browse' })
                        }}
                      >
                        <ExternalLink size={14} />
                      </span>
                      <ChevronRight size={14} className="twb-card__arrow" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile: feed + map toggle ─────────────────── */}
        <div className="twb-mobile">
          <div className="twb-mobile__header">
            <h2 className="twb-hero__heading twb-hero__heading--sm">Did you play with a legend?</h2>
            <button
              className="twb-mobile__toggle"
              onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
            >
              {mobileView === 'list'
                ? <><MapIcon size={13} /> Map</>
                : <><List size={13} /> List</>
              }
            </button>
          </div>

          {mobileView === 'list' ? (
            <>
              <form className="twb-search" onSubmit={handleSearch}>
                <Search size={14} className="twb-search__icon" />
                <input
                  type="text"
                  className="tnw-input twb-search__input"
                  placeholder="Search by school or legend…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button type="submit" className="tnw-btn tnw-btn--ghost twb-search__btn">
                    Search
                  </button>
                )}
              </form>

              <span className="twb-section-label twb-section-label--mobile">
                {searchResults !== null
                  ? `${searchResults.length} RESULT${searchResults.length !== 1 ? 'S' : ''}`
                  : 'LEGEND ORIGINS'
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
                <div className="twb-cards twb-cards--mobile">
                  {groupedWalls.map(group => {
                    const sportsLabel = group.walls
                      .map(w => w.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
                      .join(' · ')
                    const topNames = [...new Set(group.topNames || [])].slice(0, 3)
                    const topNamesStr = topNames.join(', ')
                    const locParts = [group.town, group.state || group.walls[0]?.country].filter(Boolean)
                    const locStr = locParts.join(', ')

                    return (
                      <button
                        key={group.school_slug}
                        className="twb-card"
                        onClick={() => navigateToWall(group.walls[0])}
                      >
                        <div className="twb-card__body">
                          <span className="twb-card__school">{group.school}</span>
                          <span className="twb-card__loc">
                            {locStr}{locStr ? ' · ' : ''}{sportsLabel}
                          </span>
                          {topNamesStr && (
                            <div className="twb-card__legends">
                              <span className="twb-card__legends-label">Names on the wall</span>
                              <span className="twb-card__legends-names">
                                {topNamesStr}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight size={14} className="twb-card__arrow" />
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="twb-mobile__cta">
                <button className="tnw-btn tnw-btn--primary twb-mobile__cta-btn" onClick={() => setShowCreate(true)}>
                  <Plus size={14} /> Start a wall
                </button>
              </div>
            </>
          ) : (
            <div className="twb-mobile__map">
              <WallsMap onDotClick={handleMapDotClick} />
              <div className="twb-global-cta">
                <Globe size={14} />
                <span>Walls across 5 countries and counting</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <AppFooter />

      <CreateTeamWall open={showCreate} onClose={() => setShowCreate(false)} />
    </AppShell>
  )
}
