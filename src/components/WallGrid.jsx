import { useCallback, useRef, useMemo } from 'react'
import { track } from '@vercel/analytics'
import { TILE_NUMBERS, globalIndex } from '../data/index.js'
import debatesData from '../data/debates.json'
import WallTile from './WallTile.jsx'
import './WallGrid.css'

// PROTOTYPE: C is the winner — testing 3 loudness sub-variants across
// tiles at different heat levels (dim → medium → bright → very bright → sacred).
// c  = border + glow, 2.2s  (base — on sparse tiles like #42 for sacred contrast)
// c2 = thicker border, faster 1.7s (on medium tile)
// c3 = border + scale pulse  (on dense/bright tiles)
//
// Actual debate numbers (#0, #7, #23) all get 'c' for the real debates.
// Extra tiles (#4, #11, #42, #99) are heat-level test dummies only.
const DEBATE_VARIANTS = {
  // Real debates
  '0':  'c',   // medium heat (Lillard/Westbrook)
  '7':  'c',   // high heat   (Mantle/Elway/CR7)
  '23': 'c',   // very bright (Jordan/LeBron)
  // Heat-level test tiles — pulse only, no panel debate
  '4':  'c3',  // bright (Orr/Gehrig) — scale variant
  '11': 'c2',  // medium (various)   — fast variant
  '42': 'c',   // sacred/blue        — base on contrasting tile color
  '99': 'c3',  // sacred/Gretzky     — scale on brightest tile in the wall
}
const DEBATE_NUMBERS = new Set(Object.keys(DEBATE_VARIANTS))

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
          isDebating={DEBATE_NUMBERS.has(String(num))}
          debateVariant={DEBATE_VARIANTS[String(num)] ?? null}
          onClick={() => handleTileClick(num)}
        />
      ))}
    </div>
  )
}
