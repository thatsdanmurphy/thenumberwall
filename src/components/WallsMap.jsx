/**
 * WallsMap — world map for the TeamWalls hub.
 *
 * Each active wall lights up a glowing dot at its town.
 * Zero-state: one pulsing seed dot on Boston — "the first wall lights here."
 *
 * Dots are grouped by town_slug so multiple walls in one town stack into a
 * single node whose glow intensity scales with wall count. Click a dot →
 * drill into that town's wall list. Hover → tooltip with town + walls.
 *
 * Coords come from a hand-maintained TOWN_COORDS lookup. Unknown US towns
 * fall back to their state centroid. International towns without coords are
 * logged and skipped.
 *
 * Uses geoNaturalEarth1 projection for a clean, equal-area world view.
 * Continent zooming is a future enhancement.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getWallsForMap } from '../lib/teamWallStore.js'
import { TOWN_COORDS, STATE_CENTROIDS } from '../data/usGeography.js'
import './WallsMap.css'

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Boston — the seed. Shown pulsing when there are zero walls yet.
const SEED_COORDS = [-71.0589, 42.3601]

// Single map color — the signature TNW orange.
const MAP_HUE = '#e87c2a'

// Aggregate walls by town_slug → { key, coords, town, state, country, sports[], count }
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
    if (!coords) {
      unknown.push(key)
      continue
    }
    if (!map.has(key)) {
      map.set(key, {
        key,
        coords,
        town:    w.town,
        state:   w.state,
        country: w.country,
        sports:  [],
        walls:   [],
      })
    }
    const node = map.get(key)
    node.sports.push(w.sport)
    node.walls.push(w)
  }
  if (unknown.length) {
    console.info('[WallsMap] towns missing coords or using fallback:', [...new Set(unknown)])
  }
  return Array.from(map.values())
}

// Format location label — handles both US (town, state) and international (town, country)
function locationLabel(node) {
  const count = node.walls.length
  const loc = node.state
    ? `${node.town}, ${node.state}`
    : `${node.town}, ${node.country}`
  return count === 1 ? loc : `${loc} · ${count} walls`
}

export default function WallsMap() {
  const navigate = useNavigate()
  const [walls, setWalls] = useState(null)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    getWallsForMap()
      .then(setWalls)
      .catch(err => {
        console.error('[WallsMap] failed to load walls', err)
        setWalls([])
      })
  }, [])

  const nodes = useMemo(() => groupByTown(walls || []), [walls])
  const showSeed = walls === null || nodes.length === 0

  return (
    <div className="walls-map">
      <div className="walls-map__stage">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 140, center: [0, 20] }}
          width={780}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={WORLD_TOPO_URL}>
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

          {/* Seed pulse — shown on loading + zero-state */}
          {showSeed && (
            <MapDot
              coords={SEED_COORDS}
              hue={MAP_HUE}
              pulsing
              label="Boston, MA — the first wall lights here."
              onHoverIn={(x, y, label) => setHover({ x, y, label })}
              onHoverOut={() => setHover(null)}
            />
          )}

          {/* Live dots — one per town, orange with activity-based glow */}
          {!showSeed && nodes.map(node => {
            const count = node.walls.length
            const label = locationLabel(node)
            return (
              <MapDot
                key={node.key}
                coords={node.coords}
                hue={MAP_HUE}
                radius={4 + Math.min(count - 1, 4) * 1.25}
                pulsing={count >= 3}
                glowIntensity={Math.min(count / 5, 1)}
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

function MapDot({ coords, hue, radius = 5, pulsing = false, glowIntensity = 0.5, label, onClick, onHoverIn, onHoverOut }) {
  const opacity = 0.55 + glowIntensity * 0.45
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
        style={{ fill: hue, stroke: hue, fillOpacity: opacity }}
        onClick={onClick}
        onMouseEnter={e => onHoverIn?.(e.clientX, e.clientY, label)}
        onMouseLeave={onHoverOut}
      />
    </Marker>
  )
}
