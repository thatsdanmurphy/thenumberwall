import { useCallback, useRef, useMemo } from 'react'
import { track } from '@vercel/analytics'
import { TILE_NUMBERS, globalIndex } from '../data/index.js'
import associationsData from '../data/associations.json'
import WallTile from './WallTile.jsx'
import './WallGrid.css'

// Tiles with a FIRST THOUGHT association get the pulse animation.
// Variant 'c' = border + glow (production winner, confirmed pulse-2 baseline).
const ASSOC_VARIANTS = {
  '0':  'c',   // Lillard / Westbrook
  '7':  'c',   // Mantle / Elway
  '10': 'c',   // Messi / Pelé
  '12': 'c',   // Brady / Namath
  '23': 'c',   // Jordan / LeBron
  '24': 'c',   // Mays / Kobe
  '33': 'c',   // Bird / Kareem
  '34': 'c',   // Ortiz / Pierce (Boston)
  '44': 'c',   // Aaron / Reggie Jackson
}

// Build the set of pulsing numbers scoped to a given wall.
// wallId 'global' → all debates
// wallId 'boston' → only associations tagged for Boston
// wallId 'none'   → no debates (current roster, etc.)
function buildAssocNumbers(wallId) {
  if (wallId === 'none') return new Set()
  if (wallId === 'global') return new Set(Object.keys(ASSOC_VARIANTS))
  // City walls: only debates whose wallContext mentions this city
  const tag = wallId.charAt(0).toUpperCase() + wallId.slice(1)
  return new Set(
    associationsData
      .filter(a => a.wallContext.includes(tag))
      .map(a => String(a.number))
  )
}

/**
 * WallGrid — 101-tile number grid.
 * Controlled: active tile is driven by parent via `activeNumber`.
 * Accepts an optional `index` prop so Boston and global wall
 * both use the same grid with different data.
 *
 * Keyboard nav:
 *   Tab / Shift-Tab  — move between tiles (native button focus)
 *   Enter / Space    — select tile (native button behaviour)
 *   Arrow keys       — move focus directionally within the grid
 */
export default function WallGrid({ index = globalIndex, activeNumber = null, onSelect, wallId = 'global' }) {
  const gridRef = useRef(null)
  const assocNumbers = useMemo(() => buildAssocNumbers(wallId), [wallId])

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
        const visibleCount = entries.filter(e => e.tier !== 'UNWRITTEN').length
        const debating     = assocNumbers.has(String(num)) && visibleCount >= 2
        return (
          <WallTile
            key={num}
            number={num}
            entries={entries}
            isActive={activeNumber === num}
            isDebating={debating}
            debateVariant={debating ? (ASSOC_VARIANTS[String(num)] ?? 'c') : null}
            onClick={() => handleTileClick(num)}
          />
        )
      })}
    </div>
  )
}
