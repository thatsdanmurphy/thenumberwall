import { getHeatStyle, getTileTextColor, SELECTED_TILE } from '../data/index.js'
import './WallTile.css'

export default function WallTile({ number, entries, isActive, isDebating, debateVariant, onClick }) {
  const isSacred    = entries.some(e => e.tier === 'SACRED')
  // UNWRITTEN placeholder rows don't count — a tile is unwritten if it has no real legends
  const isUnwritten = !entries.some(e => e.tier !== 'UNWRITTEN')
  const heat        = getHeatStyle(entries, isSacred)

  // Selected: white ring + heat glow still bleeds through underneath
  const selectedGlow = heat.glow !== 'none'
    ? `0 0 0 2px rgba(255,255,255,0.45), ${heat.glow}`
    : '0 0 0 2px rgba(255,255,255,0.45)'

  const tileStyle = isActive
    ? {
        background:   SELECTED_TILE.bg,
        border:       `1px solid ${SELECTED_TILE.border}`,
        borderRadius: '4px',
        boxShadow:    selectedGlow,
      }
    : {
        background:   heat.bg,
        border:       `1px solid ${heat.border}`,
        borderRadius: '4px',
        boxShadow:    heat.glow,
      }

  const textColor = isActive
    ? SELECTED_TILE.text
    : getTileTextColor(entries, isSacred)

  // debateVariant: 'a' | 'b' | 'c' | null (null = production default .wall-tile--debating)
  const debateClass = isDebating
    ? debateVariant
      ? `wall-tile--debating-${debateVariant}`
      : 'wall-tile--debating'
    : null

  const classes = [
    'wall-tile',
    isUnwritten  && 'wall-tile--unwritten',
    isActive     && 'wall-tile--active',
    debateClass,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      style={tileStyle}
      onClick={onClick}
      aria-label={`Number ${number}${entries.length ? ` — ${entries.length} legend${entries.length > 1 ? 's' : ''}` : ' — unwritten'}`}
      aria-pressed={isActive}
    >
      <span
        className="wall-tile__number"
        style={{ color: textColor }}
      >
        {number}
      </span>
    </button>
  )
}
