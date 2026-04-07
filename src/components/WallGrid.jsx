import { useCallback, useRef, useMemo } from 'react'
import { track } from '@vercel/analytics'
import { TILE_NUMBERS, globalIndex } from '../data/index.js'
import associationsData from '../data/associations.json'
import WallTile from './WallTile.jsx'
import './WallGrid.css'

// Build the set of debate numbers scoped to a wall + sport.
// Only returns numbers that have a curated debate for this specific sport.
function buildSportDebateNumbers(wallId, sport) {
  if (!sport) return new Set()
  return new Set(
    associationsData
      .filter(a => a.wall === wallId && a.sport === sport)
      .map(a => String(a.number))
  )
}

/**
 * WallGrid — 101-tile number grid.
 *
 * Pulse logic (two modes):
 *   ALL view (no sport filter) → pulse = "contested" — 2+ non-UNWRITTEN legends,
 *     no SACRED tier. Ambient signal: "this number has a story."
 *   Sport filter active → pulse = curated debate from associations.json.
 *     Specific, sport-scoped matchup (e.g. Jordan vs LeBron on Basketball #23).
 *
 * Keyboard nav:
 *   Arrow keys — move focus directionally within the grid
 */
export default function WallGrid({ index = globalIndex, activeNumber = null, onSelect, wallId = 'global', sportFilter = null }) {
  const gridRef = useRef(null)

  const activeSport = sportFilter ? [...sportFilter][0] : null

  // Sport-scoped debate numbers (only when a sport is active)
  const sportDebateNumbers = useMemo(
    () => buildSportDebateNumbers(wallId, activeSport),
    [wallId, activeSport]
  )

  function handleTileClick(number) {
    const entries = index.get(number) || []
    const next    = activeNumber === number ? null : number
    if (next) track('tile_select', { number })
    onSelect?.(next ? { number, entries } : null)
  }

  // Arrow-key navigation — moves focus to adjacent tile
  const handleKeyDown = useCallback((e) => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return
    e.preventDefault()

    const tiles   = Array.from(gridRef.current?.querySelectorAll('.wall-tile') || [])
    const focused = document.activeElement
    const idx     = tiles.indexOf(focused)
    if (idx === -1) return

    // Detect columns by comparing offsetTop of first two tiles
    const cols = tiles.filter(t => t.offsetTop === tiles[0].offsetTop).length || 10

    const delta = {
      ArrowLeft:  -1,
      ArrowRight: +1,
      ArrowUp:    -cols,
      ArrowDown:  +cols,
    }[e.key]

    const next = idx + delta
    if (next >= 0 && next < tiles.length) tiles[next].focus()
  }, [])

  return (
    <div
      className="wall-grid"
      role="grid"
      aria-label="Number wall"
      ref={gridRef}
      onKeyDown={handleKeyDown}
    >
      {TILE_NUMBERS.map(num => {
        const entries      = index.get(num) || []
        const legends      = entries.filter(e => e.tier !== 'UNWRITTEN')
        const hasSacred    = legends.some(e => e.tier === 'SACRED')

        // Pulse decision:
        //   Sport active → pulse if curated debate exists for this sport
        //   ALL view     → pulse if contested (2+ legends, no SACRED)
        const debating = activeSport
          ? sportDebateNumbers.has(String(num)) && legends.length >= 2
          : legends.length >= 2 && !hasSacred

        return (
          <WallTile
            key={num}
            number={num}
            entries={entries}
            isActive={activeNumber === num}
            isDebating={debating}
            debateVariant={debating ? 'c' : null}
            onClick={() => handleTileClick(num)}
          />
        )
      })}
    </div>
  )
}
