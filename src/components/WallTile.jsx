import { getHeatStyle, getTileTextColor, getHeatStyleBC, getTileTextColorBC, SELECTED_TILE } from '../data/index.js'
import './WallTile.css'

export default function WallTile({ number, entries, isActive, forceActive, isDebating, debateVariant, onClick, theme = 'global' }) {
  const isSacred    = entries.some(e => e.tier === 'SACRED')
  // UNWRITTEN placeholder rows don't count — a tile is unwritten if it has no real legends
  const isUnwritten = !entries.some(e => e.tier !== 'UNWRITTEN')
  // Select heat palette by theme — 'bc' uses maroon→gold, 'global' uses the orange/red scale
  const heatFn      = theme === 'bc' ? getHeatStyleBC      : getHeatStyle
  const textColorFn = theme === 'bc' ? getTileTextColorBC  : getTileTextColor
  const heat        = heatFn(entries, isSacred)

  // forceActive: render selected (white) appearance without being the real active tile.
  // Used for supercut A/B comparisons — right tile of each pair shows pulse in selected state.
  const effectiveActive = isActive || forceActive

  // Selected: white ring + heat glow still bleeds through underneath
  const selectedGlow = heat.glow !== 'none'
    ? `0 0 0 2px rgba(255,255,255,0.45), ${heat.glow}`
    : '0 0 0 2px rgba(255,255,255,0.45)'

  const tileStyle = effectiveActive
    ? {
        background:   heat.bg,
        border:       `1px solid rgba(255,255,255,0.82)`,
        borderRadius: '4px',
        boxShadow:    selectedGlow,
      }
    : {
        background:   heat.bg,
        border:       `1px solid ${heat.border}`,
        borderRadius: '4px',
        boxShadow:    heat.glow,
      }

  const textColor = effectiveActive
    ? SELECTED_TILE.text
    : textColorFn(entries, isSacred)

  // Pulse only shows when tile is NOT selected — selected state is clean white ring only.
  // Suppressing the amber ::after overlay when active prevents any sacred-tier confusion.
  const debateClass = isDebating && !effectiveActive
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
