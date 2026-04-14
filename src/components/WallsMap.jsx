/**
 * WallsMap — stylized US map for the TeamWalls hub.
 *
 * Each active wall lights up a glowing dot at its town.
 * Zero-state: one pulsing seed dot on Boston — "the first wall lights here."
 *
 * Dots are grouped by town_slug so multiple walls in one town stack into a
 * single node whose glow intensity scales with wall count. Click a dot →
 * drill into that town's wall list. Hover → tooltip with town + walls.
 *
 * Coords come from a hand-maintained TOWN_COORDS lookup. Unknown towns fall
 * back to their state centroid (so every wall still lights something up, and
 * we get a log of missing coords to fill in).
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getWallsForMap } from '../lib/teamWallStore.js'
import { TOWN_COORDS, STATE_CENTROIDS } from '../data/usGeography.js'
import './WallsMap.css'

const US_TOPO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// Boston — the seed. Shown pulsing when there are zero walls yet.
const SEED_COORDS = [-71.0589, 42.3601]

// Sport → glow hue. Tuned against the paper/parchment background.
const SPORT_HUE = {
  hockey:        '#4aa3ff',
  football:      '#d76a3b',
  basketball:    '#e89a3b',
  baseball:      '#8ec96b',
  soccer:        '#6ad0bf',
  lacrosse:      '#b480e0',
  volleyball:    '#e06bb8',
  track:         '#e0c064',
  swimming:      '#6ac9e0',
  default:       '#e87c2a',
}

function hueFor(sport) {
  return SPORT_HUE[sport] || SPORT_HUE.default
}

// Aggregate walls by town_slug → { key, coords, town, state, sports[], count }
function groupByTown(walls) {
  const map = new Map()
  const unknown = []
  for (const w of walls) {
    const key = w.town_slug
    let coords = TOWN_COORDS[key]
    if (!coords && w.state) {
      coords = STATE_CENTROIDS[w.state.toUpperCase()]
      if (coords) unknown.push(key) // fell back to state centroid
    }
    if (!coords) continue
    if (!map.has(key)) {
      map.set(key, {
        key,
        coords,
        town:   w.town,
        state:  w.state,
        sports: [],
        walls:  [],
      })
    }
    const node = map.get(key)
    node.sports.push(w.sport)
    node.walls.push(w)
  }
  if (unknown.length) {
    console.info('[WallsMap] towns using state-centroid fallback:', [...new Set(unknown)])
  }
  return Array.from(map.values())
}

export default function WallsMap() {
  const navigate = useNavigate()
  const [walls, setWalls] = useState(null)   // null = loading, [] = zero-state
  const [hover, setHover] = useState(null)   // { node, x, y }

  useEffect(() => {
    getWallsForMap()
      .then(setWalls)
      .catch(err => {
        console.error('[WallsMap] failed to load walls', err)
        setWalls([])
      })
  }, [])

  const nodes = useMemo(() => groupByTown(walls || []), [walls])
  const isEmpty = walls !== null && nodes.length === 0

  // Projection scale tuned for the left column (≈500–650px wide).
  // AlbersUsa handles AK/HI insets automatically.
  const projectionConfig = { scale: 900 }

  return (
    <div className="walls-map">
      <div className="walls-map__header">
        <span className="walls-map__eyebrow">THE MAP</span>
        <h3 className="walls-map__title">
          {isEmpty ? 'The first wall lights here.' : 'Every wall is a light.'}
        </h3>
        <p className="walls-map__sub">
          {isEmpty
            ? 'One pulse, waiting. Start a team wall and a new dot joins the map.'
            : 'Each town with an active wall glows. Tap a dot to visit that town.'}
        </p>
      </div>

      <div className="walls-map__stage">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={projectionConfig}
          width={780}
          height={480}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={US_TOPO_URL}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  className="walls-map__state"
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Zero-state: single pulsing seed dot */}
          {isEmpty && (
            <MapDot
              coords={SEED_COORDS}
              hue={SPORT_HUE.default}
              pulsing
              label="Boston, MA — the first wall lights here."
              onHoverIn={(x, y, label) => setHover({ x, y, label })}
              onHoverOut={() => setHover(null)}
            />
          )}

          {/* Live state: one dot per town, sport-colored */}
          {!isEmpty && nodes.map(node => {
            const dominantSport = node.sports[0]
            const count = node.walls.length
            const label = count === 1
              ? `${node.town}, ${node.state}`
              : `${node.town}, ${node.state} · ${count} walls`
            return (
              <MapDot
                key={node.key}
                coords={node.coords}
                hue={hueFor(dominantSport)}
                radius={4 + Math.min(count - 1, 4) * 1.25}
                pulsing={count >= 3}
                label={label}
                onClick={() => navigate(`/walls/town/${node.key}`)}
                onHoverIn={(x, y, l) => setHover({ x, y, label: l })}
                onHoverOut={() => setHover(null)}
              />
            )
          })}
        </ComposableMap>

        {hover && (
          <div
            className="walls-map__tooltip"
            style={{ left: hover.x, top: hover.y }}
            role="tooltip"
          >
            {hover.label}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * MapDot — projected point with optional pulse. Uses react-simple-maps'
 * Marker would be nicer, but we want SVG filter control, so we use raw
 * <circle> inside a <Marker>-style transform done via the Annotation-less
 * Marker equivalent: wrap in <g transform> using the projection via a child
 * of ComposableMap. Since we're inside <Geographies>'s sibling slot, we use
 * <Marker> from the lib.
 */
function MapDot({ coords, hue, radius = 5, pulsing = false, label, onClick, onHoverIn, onHoverOut }) {
  return (
    <Marker coordinates={coords}>
      {pulsing && (
        <circle
          r={radius + 4}
          className="walls-map__dot-pulse"
          style={{ fill: hue }}
        />
      )}
      <circle
        r={radius}
        className="walls-map__dot"
        style={{ fill: hue, stroke: hue }}
        onClick={onClick}
        onMouseEnter={e => onHoverIn?.(e.clientX, e.clientY, label)}
        onMouseLeave={onHoverOut}
      />
    </Marker>
  )
}
