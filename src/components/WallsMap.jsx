/**
 * WallsMap — world map with cluster-to-split zoom.
 *
 * At world zoom, nearby towns merge into numbered cluster dots.
 * Click a cluster → zoom in, clusters split into individual school dots.
 * Click an individual dot → navigate to town page (via onDotClick prop).
 *
 * Props:
 *   hoveredTown  — town_slug the parent wants pulsed (from card hover)
 *   onDotClick   — callback(townSlug) when an individual dot is clicked
 */

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { getWallsForMap } from '../lib/teamWallStore.js'
import { TOWN_COORDS, STATE_CENTROIDS } from '../data/usGeography.js'
import { ZoomOut } from 'lucide-react'
import './WallsMap.css'

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const SEED_COORDS = [-71.0589, 42.3601]
const MAP_HUE = '#e87c2a'

// Pixel distance threshold for clustering at a given zoom level.
// Higher zoom → smaller threshold → more dots split apart.
const CLUSTER_RADIUS = 30

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

/**
 * Cluster nodes that are within CLUSTER_RADIUS pixels of each other.
 * Returns array of { nodes: [...], center: [lng, lat], totalWalls: number }
 *
 * We use a simple greedy approach: for each unclustered node, find all
 * unclustered nodes within radius and merge them.
 */
function clusterNodes(nodes, projectionFn, zoom) {
  if (!projectionFn || nodes.length === 0) return nodes.map(n => ({
    nodes: [n], center: n.coords, totalWalls: n.walls.length, key: n.key,
  }))

  const threshold = CLUSTER_RADIUS / zoom
  const used = new Set()
  const clusters = []

  for (let i = 0; i < nodes.length; i++) {
    if (used.has(i)) continue
    const cluster = [nodes[i]]
    used.add(i)

    for (let j = i + 1; j < nodes.length; j++) {
      if (used.has(j)) continue
      const dx = nodes[i].coords[0] - nodes[j].coords[0]
      const dy = nodes[i].coords[1] - nodes[j].coords[1]
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < threshold) {
        cluster.push(nodes[j])
        used.add(j)
      }
    }

    // Cluster center = average of member coords
    const cx = cluster.reduce((s, n) => s + n.coords[0], 0) / cluster.length
    const cy = cluster.reduce((s, n) => s + n.coords[1], 0) / cluster.length
    const total = cluster.reduce((s, n) => s + n.walls.length, 0)

    clusters.push({
      nodes: cluster,
      center: [cx, cy],
      totalWalls: total,
      key: cluster.map(n => n.key).join('+'),
      isSingle: cluster.length === 1,
    })
  }

  return clusters
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
  const [center, setCenter] = useState([10, 20])
  const [zoom, setZoom]     = useState(1)

  useEffect(() => {
    getWallsForMap()
      .then(setWalls)
      .catch(err => { console.error('[WallsMap]', err); setWalls([]) })
  }, [])

  const nodes = useMemo(() => groupByTown(walls || []), [walls])
  const showSeed = walls === null || nodes.length === 0

  const clusters = useMemo(() => clusterNodes(nodes, null, zoom), [nodes, zoom])

  const isZoomed = zoom > 1.5

  const zoomToCluster = useCallback((cluster) => {
    if (cluster.isSingle) {
      // Single town — navigate to it
      if (onDotClick) {
        onDotClick(cluster.nodes[0].key)
      } else {
        navigate(`/walls/town/${cluster.nodes[0].key}`)
      }
      return
    }
    // Multi-town cluster — zoom in to show them split
    setCenter(cluster.center)
    setZoom(prev => Math.min(prev * 2.5, 8))
    setHover(null)
  }, [navigate, onDotClick])

  const zoomOut = useCallback(() => {
    setCenter([10, 20])
    setZoom(1)
    setHover(null)
  }, [])

  // Handle ZoomableGroup's onMoveEnd for free panning
  const handleMoveEnd = useCallback(({ coordinates, zoom: z }) => {
    setCenter(coordinates)
    setZoom(z)
  }, [])

  return (
    <div className="walls-map">
      <div className="walls-map__stage">

        {isZoomed && (
          <button
            className="walls-map__zoom-out"
            onClick={zoomOut}
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
            center={center}
            zoom={zoom}
            onMoveEnd={handleMoveEnd}
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
              <Marker coordinates={SEED_COORDS}>
                <circle r={6} className="walls-map__dot-pulse" style={{ fill: MAP_HUE }} />
                <circle r={5} className="walls-map__dot" style={{ fill: MAP_HUE, stroke: MAP_HUE, fillOpacity: 0.85 }} />
              </Marker>
            )}

            {!showSeed && clusters.map(cluster => {
              if (cluster.isSingle) {
                // Individual town dot
                const node = cluster.nodes[0]
                const count = node.walls.length
                const isPulsed = hoveredTown === node.key
                const label = locationLabel(node)
                const r = count > 1 ? 6 + Math.min(count - 1, 5) * 0.8 : 4.5

                return (
                  <Marker key={cluster.key} coordinates={node.coords}>
                    {isPulsed && (
                      <circle r={r + 6} className="walls-map__dot-pulse" style={{ fill: MAP_HUE }} />
                    )}
                    <circle
                      r={r}
                      className="walls-map__dot"
                      style={{ fill: MAP_HUE, stroke: MAP_HUE, fillOpacity: 0.55 + Math.min(count / 5, 0.45) }}
                      onClick={() => onDotClick ? onDotClick(node.key) : navigate(`/walls/town/${node.key}`)}
                      onMouseEnter={e => setHover({ x: e.clientX, y: e.clientY, label })}
                      onMouseLeave={() => setHover(null)}
                    />
                    {count > 1 && (
                      <text
                        className="walls-map__dot-count"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: r < 8 ? 7 : 8 }}
                        onClick={() => onDotClick ? onDotClick(node.key) : navigate(`/walls/town/${node.key}`)}
                        onMouseEnter={e => setHover({ x: e.clientX, y: e.clientY, label })}
                        onMouseLeave={() => setHover(null)}
                      >
                        {count}
                      </text>
                    )}
                  </Marker>
                )
              }

              // Multi-town cluster — shows total count, click to zoom
              const isAnyHovered = cluster.nodes.some(n => hoveredTown === n.key)
              const r = 10 + Math.min(cluster.totalWalls - 2, 8) * 0.6
              const townNames = cluster.nodes.map(n => n.town).join(', ')
              const label = `${townNames} · ${cluster.totalWalls} walls — click to zoom`

              return (
                <Marker key={cluster.key} coordinates={cluster.center}>
                  {isAnyHovered && (
                    <circle r={r + 6} className="walls-map__dot-pulse" style={{ fill: MAP_HUE }} />
                  )}
                  <circle
                    r={r}
                    className="walls-map__dot walls-map__dot--cluster"
                    style={{ fill: MAP_HUE, stroke: MAP_HUE, fillOpacity: 0.75 }}
                    onClick={() => zoomToCluster(cluster)}
                    onMouseEnter={e => setHover({ x: e.clientX, y: e.clientY, label })}
                    onMouseLeave={() => setHover(null)}
                  />
                  <text
                    className="walls-map__dot-count"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontSize: r < 12 ? 9 : 10 }}
                    onClick={() => zoomToCluster(cluster)}
                    onMouseEnter={e => setHover({ x: e.clientX, y: e.clientY, label })}
                    onMouseLeave={() => setHover(null)}
                  >
                    {cluster.totalWalls}
                  </text>
                </Marker>
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
      </div>
    </div>
  )
}
