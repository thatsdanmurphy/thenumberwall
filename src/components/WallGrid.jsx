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
  '12': 'c',   // Brady / Namath
  '23': 'c',   // Jordan / LeBron
  '24': 'c',   // Mays / Kobe
  '32': 'c',   // Magic / Jim Brown
  '33': 'c',   // Bird / Kareem
  '34': 'c',   // Ortiz / Pierce (Boston)
  '44': 'c',   // Aaron / Reggie Jackson
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
