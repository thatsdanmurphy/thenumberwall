/**
 * WallsMap — world map for the TeamWalls hub with continent zoom.
 *
 * Default: full world view (geoNaturalEarth1).
 * Tap a region label or dot cluster → zoom into that continent.
 * Back button (zoom out) returns to world view.
 *
 * Dots grouped by town_slug. Each dot shows the wall count as a number.
 * Click dot → drill into town wall list.
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { getWallsForMap } from '../lib/teamWallStore.js'
import { TOWN_COORDS, STATE_CENTROIDS } from '../data/usGeography.js'
import { ZoomOut } from 'lucide-react'
import './WallsMap.css'

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const SEED_COORDS = [-71.0589, 42.3601]
const MAP_HUE = '#e87c2a'

// Zoom presets: world + continent regions
const VIEWS = {
  world:         { center: [10, 20],    zoom: 1 },
  northAmerica:  { center: [-95, 40],   zoom: 3.2 },
  europe:        { center: [15, 50],    zoom: 4.5 },
}

function groupByTown(walls) {
  const map = new Map()
  const unknown = []
  for (const w of walls) {
    const key = w.town_slug
    let coords = TOWN_COORDS[key]
    if (!coords && w.state) {
      coords = STATE_CENTROIDS[w.state.toUpperCase()]
      if (coords) unknown.push(key)
    }
    if (!coords) { unknown.push(key); continue }
    if (!map.has(key)) {
      map.set(key, {
        key, coords,
        town: w.town, state: w.state, country: w.country,
        sports: [], walls: [],
      })
    }
    const node = map.get(key)
    node.sports.push(w.sport)
    node.walls.push(w)
  }
  if (unknown.length) {
    console.info('[WallsMap] towns missing coords:', [...new Set(unknown)])
  }
  return Array.from(map.values())
}

function locationLabel(node) {
  const count = node.walls.length
  const suffix = node.state || node.country || ''
  const loc = suffix ? `${node.town}, ${suffix}` : node.town
  return count === 1 ? loc : `${loc} · ${count} walls`
}

export default function WallsMap() {
  const navigate = useNavigate()
  const [walls, setWalls] = useState(null)
  const [hover, setHover] = useState(null)
  const [view, setView] = useState('world')

  useEffect(() => {
    getWallsForMap()
      .then(setWalls)
      .catch(err => { console.error('[WallsMap]', err); setWalls([]) })
  }, [])

  const nodes = useMemo(() => groupByTown(walls || []), [walls])
  const showSeed = walls === null || nodes.length === 0

  const currentView = VIEWS[view] || VIEWS.world
  const isZoomed = view !== 'world'

  const zoomTo = useCallback((region) => {
    setView(region)
    setHover(null)
  }, [])

  return (
    <div className="walls-map">
      <div className="walls-map__stage">

        {isZoomed && (
          <button
            className="walls-map__zoom-out"
            onClick={() => zoomTo('world')}
            aria-label="Zoom out to world view"
          >
            <ZoomOut size={14} />
            <span>World view</span>
          </button>
        )}

        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 140, center: [10, 20] }}
          width={780}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup
            center={currentView.center}
            zoom={currentView.zoom}
            maxZoom={8}
            translateExtent={[[-200, -200], [980, 600]]}
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

            {showSeed && (
              <MapDot
                coords={SEED_COORDS}
                hue={MAP_HUE}
                count={0}
                pulsing
                label="Boston, MA — the first wall lights here."
                onHoverIn={(x, y, label) => setHover({ x, y, label })}
                onHoverOut={() => setHover(null)}
              />
            )}

            {!showSeed && nodes.map(node => {
              const count = node.walls.length
              const label = locationLabel(node)
              return (
                <MapDot
                  key={node.key}
                  coords={node.coords}
                  hue={MAP_HUE}
                  count={count}
                  pulsing={count >= 3}
                  glowIntensity={Math.min(count / 5, 1)}
                  label={label}
                  onClick={() => navigate(`/walls/town/${node.key}`)}
                  onHoverIn={(x, y, l) => setHover({ x, y, label: l })}
                  onHoverOut={() => setHover(null)}
                />
              )
            })}
          </ZoomableGroup>
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

        {!isZoomed && (
          <div className="walls-map__regions">
            <button className="walls-map__region-btn" onClick={() => zoomTo('northAmerica')}>
              North America
            </button>
            <button className="walls-map__region-btn" onClick={() => zoomTo('europe')}>
              Europe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * MapDot — a single town marker on the map.
 * Shows a numbered circle when count > 1, plain dot otherwise.
 */
function MapDot({ coords, hue, count = 0, pulsing = false, glowIntensity = 0.5, label, onClick, onHoverIn, onHoverOut }) {
  const opacity = 0.55 + glowIntensity * 0.45
  const showCount = count > 1
  const radius = showCount ? 8 + Math.min(count - 2, 6) * 0.8 : 5

  return (
    <Marker coordinates={coords}>
      {pulsing && (
        <circle r={radius + 5} className="walls-map__dot-pulse" style={{ fill: hue }} />
      )}
      <circle
        r={radius}
        className="walls-map__dot"
        style={{ fill: hue, stroke: hue, fillOpacity: opacity }}
        onClick={onClick}
        onMouseEnter={e => onHoverIn?.(e.clientX, e.clientY, label)}
        onMouseLeave={onHoverOut}
      />
      {showCount && (
        <text
          className="walls-map__dot-count"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize: radius < 10 ? 8 : 9 }}
          onClick={onClick}
          onMouseEnter={e => onHoverIn?.(e.clientX, e.clientY, label)}
          onMouseLeave={onHoverOut}
        >
          {count}
        </text>
      )}
    </Marker>
  )
}
