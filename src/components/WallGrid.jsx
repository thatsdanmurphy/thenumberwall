import { useCallback, useRef, useMemo } from 'react'
import { track } from '@vercel/analytics'
import { TILE_NUMBERS, globalIndex } from '../data/index.js'
import associationsData from '../data/associations.json'
import WallTile from './WallTile.jsx'
import './WallGrid.css'

// Tiles with a FIRST THOUGHT association get the pulse animation.
// Variant key drives the CSS class suffix: 'c' | 'c2' | 'c3'
//
// Association tiles (#0, #7, #23, #34) all use 'c' (border + glow base).
// Heat-level test dummies (#4, #11, #42, #99) kept for visual QA only.
const ASSOC_VARIANTS = {
  // Real associations
  '0':  'c',   // medium heat (Lillard/Westbrook)
  '7':  'c',   // high heat   (Mantle/Elway)
  '23': 'c',   // very bright (Jordan/LeBron)
  '34': 'c',   // Boston      (Ortiz/Pierce)
  // Heat-level test tiles — pulse only, no panel card
  '4':  'c3',
  '11': 'c2',
  '42': 'c',
  '99': 'c3',
}
const ASSOC_NUMBERS = new Set(Object.keys(ASSOC_VARIANTS))

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
export default function WallGrid({ index = globalIndex, activeNumber = null, onSelect }) {
  const gridRef = useRef(null)

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
      {TILE_NUMBERS.map(num => (
        <WallTile
          key={num}
          number={num}
          entries={index.get(num) || []}
          isActive={activeNumber === num}
          isDebating={ASSOC_NUMBERS.has(String(num))}
          debateVariant={ASSOC_VARIANTS[String(num)] ?? null}
          onClick={() => handleTileClick(num)}
        />
      ))}
    </div>
  )
}
