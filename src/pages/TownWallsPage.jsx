/**
 * TownWallsPage — all team walls in a single town.
 * Route: /walls/town/:townSlug
 *
 * One card per (org × sport). Orgs are grouped so you can see that
 * Needham High has baseball + hockey + football walls side by side,
 * plus neighboring orgs in the same town.
 */

import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Plus } from 'lucide-react'
import AppShell  from '../components/AppShell.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import CreateTeamWall from '../components/CreateTeamWall.jsx'
import { getWallsInTown } from '../lib/teamWallStore.js'
import { getSportIcon } from '../data/sports.js'
import { getOrgTypeLabel } from '../data/orgTypes.js'
import { TEAM_PALETTES } from '../data/teamColors.js'
import './TownWallsPage.css'

export default function TownWallsPage() {
  const { townSlug } = useParams()
  const navigate     = useNavigate()

  const [walls, setWalls]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!townSlug) return
    setLoading(true)
    getWallsInTown(townSlug)
      .then(setWalls)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [townSlug])

  // Group walls by school — one block per org, sports as cards beneath.
  const orgs = useMemo(() => {
    const map = new Map()
    for (const w of walls) {
      if (!map.has(w.school_slug)) {
        map.set(w.school_slug, {
          school_slug: w.school_slug,
          school:      w.school,
          org_type:    w.org_type,
          town:        w.town,
          state:       w.state,
          color_primary: w.color_primary,
          walls: [],
        })
      }
      map.get(w.school_slug).walls.push(w)
    }
    return Array.from(map.values())
  }, [walls])

  const townDisplay = walls[0]
    ? `${walls[0].town}, ${walls[0].state}`
    : townSlug?.replace(/-/g, ' ').toUpperCase()

  useEffect(() => {
    document.title = walls[0]
      ? `${walls[0].town}, ${walls[0].state} | The Number Wall`
      : 'Town | The Number Wall'
  }, [walls])

  return (
    <AppShell>
      <AppHeader title="TOWN" back={{ label: 'Team Walls', onClick: () => navigate('/walls') }} />

      <main className="town-page">
        <header className="town-page__header">
          <div className="town-page__eyebrow">
            <MapPin size={12} /> TOWN
          </div>
          <h2 className="town-page__title">{townDisplay}</h2>
          <p className="town-page__sub">
            {orgs.length
              ? `${orgs.length} ${orgs.length === 1 ? 'organization' : 'organizations'}, ${walls.length} ${walls.length === 1 ? 'wall' : 'walls'}`
              : 'No walls here yet.'}
          </p>
        </header>

        {loading ? (
          <p className="town-page__loading">Loading…</p>
        ) : orgs.length === 0 ? (
          <div className="town-page__empty">
            <p>Nobody's started a wall in this town yet.</p>
            <button className="tnw-btn tnw-btn--primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Start the first one
            </button>
          </div>
        ) : (
          <div className="town-orgs">
            {orgs.map(org => {
              const palette = TEAM_PALETTES[org.color_primary] || TEAM_PALETTES.orange
              const accent  = palette[3]
              return (
                <section key={org.school_slug} className="town-org">
                  <div className="town-org__head">
                    <span className="town-org__dot" style={{ background: accent.bg }} />
                    <div className="town-org__titling">
                      <h3 className="town-org__name">{org.school}</h3>
                      <span className="town-org__type">{getOrgTypeLabel(org.org_type)}</span>
                    </div>
                  </div>
                  <div className="town-org__walls">
                    {org.walls.map(w => {
                      const Icon = getSportIcon(w.sport)
                      const sportLabel = w.sport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      return (
                        <button
                          key={w.id}
                          className="town-wall"
                          onClick={() => navigate(`/walls/${w.school_slug}/${w.sport}`)}
                        >
                          {Icon && <Icon size={13} className="town-wall__icon" />}
                          <span className="town-wall__sport">{sportLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            <div className="town-page__add">
              <button className="tnw-btn tnw-btn--secondary" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Start another wall in {walls[0]?.town || 'this town'}
              </button>
            </div>
          </div>
        )}
      </main>

      <AppFooter />

      <CreateTeamWall open={showCreate} onClose={() => setShowCreate(false)} />
    </AppShell>
  )
}
