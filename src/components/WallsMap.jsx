/**
 * WallsMap — tabbed regional maps for the Team Walls hub.
 *
 * Tabs: USA (default) | Canada | Europe
 * Each tab renders a zoomed projection of that region with well-spread dots.
 * No clustering needed — at regional zoom, towns are visually distinct.
 *
 * Props:
 *   hoveredTown  — town_slug the parent wants pulsed (from card hover)
 *   onDotClick   — callback(townSlug) when a dot is clicked
 */

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { getWallsForMap } from '../lib/teamWallStore.js'
import { TOWN_COORDS, STATE_CENTROIDS } from '../data/usGeography.js'
import './WallsMap.css'

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const MAP_HUE = 'var(--color-heat)'

// Region configs: projection center, scale, and bounding box for filtering dots.
// North America covers CONUS + Hawaii + Alaska + Canada + Mexico.
const REGIONS = {
  'north-america': {
    label: 'North America',
    center: [-96, 45],
    scale: 340,
    width: 780,
    height: 460,
    filter: (node) => {
      const [lng, lat] = node.coords
      return lng > -170 && lng < -50 && lat > 15 && lat < 72
    },
  },
  europe: {
    label: 'Europe',
    center: [10, 50],
    scale: 600,
    width: 780,
    height: 420,
    filter: (node) => {
      const [lng, lat] = node.coords
      return lng > -15 && lng < 40 && lat > 35 && lat < 65
    },
  },
}

const REGION_KEYS = Object.keys(REGIONS)

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
        walls: [],
      })
    }
    map.get(key).walls.push(w)
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

export default function WallsMap({ hoveredTown, onDotClick }) {
  const navigate = useNavigate()
  const [walls, setWalls] = useState(null)
  const [hover, setHover] = useState(null)
  const [activeRegion, setActiveRegion] = useState('north-america')

  useEffect(() => {
    getWallsForMap()
      .then(setWalls)
      .catch(err => { console.error('[WallsMap]', err); setWalls([]) })
  }, [])

  const allNodes = useMemo(() => groupByTown(walls || []), [walls])

  const region = REGIONS[activeRegion]
  const visibleNodes = useMemo(
    () => allNodes.filter(region.filter),
    [allNodes, region]
  )

  // Count dots per region for tab badges
  const regionCounts = useMemo(() => {
    const counts = {}
    for (const key of REGION_KEYS) {
      counts[key] = allNodes.filter(REGIONS[key].filter).length
    }
    return counts
  }, [allNodes])

  const handleDotClick = useCallback((townSlug) => {
    if (onDotClick) {
      onDotClick(townSlug)
    } else {
      navigate(`/walls/town/${townSlug}`)
    }
  }, [navigate, onDotClick])

  return (
    <div className="walls-map">
      {/* Region tabs */}
      <div className="walls-map__tabs">
        {REGION_KEYS.map(key => (
          <button
            key={key}
            className={`walls-map__tab${activeRegion === key ? ' walls-map__tab--active' : ''}`}
            onClick={() => { setActiveRegion(key); setHover(null) }}
          >
            {REGIONS[key].label}
            {regionCounts[key] > 0 && (
              <span className="walls-map__tab-count">{regionCounts[key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="walls-map__stage">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: region.scale, center: region.center }}
          width={region.width}
          height={region.height}
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

          {visibleNodes.map(node => {
            const count = node.walls.length
            const isPulsed = hoveredTown === node.key
            const label = locationLabel(node)
            const r = count > 1 ? 6 + Math.min(count - 1, 5) * 0.8 : 5

            return (
              <Marker key={node.key} coordinates={node.coords}>
                {isPulsed && (
                  <circle r={r + 6} className="walls-map__dot-pulse" style={{ fill: MAP_HUE }} />
                )}
                <circle
                  r={r}
                  className="walls-map__dot"
                  style={{ fill: MAP_HUE, stroke: MAP_HUE, fillOpacity: 0.55 + Math.min(count / 5, 0.45) }}
                  onClick={() => handleDotClick(node.key)}
                  onMouseEnter={e => setHover({ x: e.clientX, y: e.clientY, label })}
                  onMouseLeave={() => setHover(null)}
                />
              </Marker>
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
