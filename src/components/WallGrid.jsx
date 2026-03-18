import { useCallback, useRef, useMemo } from 'react'
import { track } from '@vercel/analytics'
import { TILE_NUMBERS, globalIndex } from '../data/index.js'
import associationsData from '../data/associations.json'
import WallTile from './WallTile.jsx'
import './WallGrid.css'

// Tiles with a FIRST THOUGHT association get the pulse animation.
// Variant key drives the CSS class suffix: 'c' | 'c2' | 'c3' | 'pulse-1'…'pulse-5'
//
// Real association tiles (#0, #7, #23, #34) use 'c' (border + glow base).
//
// ── PULSE SUPERCUT ─────────────────────────────────────────────────────────
// 5 variant pairs for side-by-side comparison.
// Left tile = normal (heat state). Right tile = forceActive (white/selected state).
// Pair  Left  Right  Variant   Description
//  1     #3    #4    pulse-1   Ghost border — minimal, no glow
//  2    #11   #12    pulse-2   Baseline+ — floor 0.40, border+glow
//  3    #28   #29    pulse-3   Wide corona — slow big outer haze, no border
//  4    #40   #41    pulse-4   Heartbeat — two beats then silence
//  5    #55   #56    pulse-5   Ember fill — radial gradient inside tile
const ASSOC_VARIANTS = {
  // Real associations
  '0':  'c',      // medium heat (Lillard/Westbrook)
  '7':  'c',      // high heat   (Mantle/Elway)
  '23': 'c',      // very bright (Jordan/LeBron)
  '34': 'c',      // Boston      (Ortiz/Pierce)
  // Supercut pairs — left = normal, right = forceActive
  '3':  'pulse-1', '4':  'pulse-1',
  '11': 'pulse-2', '12': 'pulse-2',
  '28': 'pulse-3', '29': 'pulse-3',
  '40': 'pulse-4', '41': 'pulse-4',
  '55': 'pulse-5', '56': 'pulse-5',
}
const ASSOC_NUMBERS    = new Set(Object.keys(ASSOC_VARIANTS))
// Right tile of each pair is rendered with forceActive (white selected state)
const FORCE_ACTIVE_TILES = new Set(['4', '12', '29', '41', '56'])

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
          forceActive={FORCE_ACTIVE_TILES.has(String(num))}
          isDebating={ASSOC_NUMBERS.has(String(num))}
          debateVariant={ASSOC_VARIANTS[String(num)] ?? null}
          onClick={() => handleTileClick(num)}
        />
      ))}
    </div>
  )
}
