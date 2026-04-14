/**
 * THE NUMBER WALL — Team Color Palette System
 *
 * 10 base colors that cover the vast majority of team color schemes.
 * Each generates a full 6-level heat progression (unwritten → inferno).
 * SACRED stays ice-blue universally — it transcends team identity.
 *
 * Usage:
 *   import { TEAM_PALETTES, getTeamHeatStyle, getTeamTileTextColor } from './teamColors.js'
 *   const style = getTeamHeatStyle('red', entries)
 *   // → { bg, border, glow, text } — same API as HEAT_TILES in index.js
 */

// ─── Base color definitions ────────────────────────────────────────────────

export const TEAM_COLORS = {
  red:    { label: 'Red',        rgb: [200, 30, 30]  },
  blue:   { label: 'Royal Blue', rgb: [50, 90, 210]  },
  green:  { label: 'Green',      rgb: [30, 140, 55]  },
  orange: { label: 'Orange',     rgb: [220, 100, 20] },
  purple: { label: 'Purple',     rgb: [110, 45, 180] },
  maroon: { label: 'Maroon',     rgb: [139, 21, 56]  },
  navy:   { label: 'Navy',       rgb: [25, 45, 110]  },
  gold:   { label: 'Gold',       rgb: [195, 160, 35] },
  black:  { label: 'Black',      rgb: [90, 90, 90]   },
  teal:   { label: 'Teal',       rgb: [0, 130, 140]  },
}

// ─── Color key list (for dropdowns) ────────────────────────────────────────

export const TEAM_COLOR_KEYS = Object.keys(TEAM_COLORS)

// ─── Palette generator ─────────────────────────────────────────────────────

function generateHeatPalette([R, G, B]) {
  const darken   = (v, f) => Math.round(v * f)
  const brighten = (v, f) => Math.round(Math.min(255, v + (255 - v) * f))

  const base   = [R, G, B]
  const bright = base.map(v => brighten(v, 0.35))
  const white  = base.map(v => brighten(v, 0.65))
  const dark   = base.map(v => darken(v, 0.70))

  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`

  return [
    // 0 — unwritten — no team identity until someone fills it in
    {
      bg:     'rgba(255,255,255,0.02)',
      border: 'rgba(255,255,255,0.05)',
      glow:   'none',
      text:   'rgba(255,255,255,0.38)',
    },
    // 1 — ember
    {
      bg:     rgba(dark, 0.28),
      border: rgba(base, 0.42),
      glow:   `0 0 8px ${rgba(base, 0.32)}`,
      text:   rgba(bright, 0.70),
    },
    // 2 — warm
    {
      bg:     rgba(dark, 0.42),
      border: rgba(base, 0.58),
      glow:   `0 0 12px ${rgba(base, 0.48)}, 0 0 24px ${rgba(dark, 0.20)}`,
      text:   rgba(bright, 0.88),
    },
    // 3 — hot
    {
      bg:     rgba(base, 0.55),
      border: rgba(base, 0.68),
      glow:   `0 0 16px ${rgba(base, 0.52)}, 0 0 32px ${rgba(dark, 0.28)}`,
      text:   rgba(bright, 1.0),
    },
    // 4 — blazing
    {
      bg:     rgba(base, 0.62),
      border: rgba(bright, 0.78),
      glow:   `0 0 20px ${rgba(bright, 0.68)}, 0 0 40px ${rgba(base, 0.32)}`,
      text:   rgba(white, 1.0),
    },
    // 5 — inferno
    {
      bg:     rgba(bright, 0.75),
      border: rgba(bright, 0.92),
      glow:   `0 0 24px ${rgba(bright, 0.88)}, 0 0 48px ${rgba(base, 0.48)}, 0 0 64px ${rgba(dark, 0.22)}`,
      text:   rgba(white, 1.0),
    },
  ]
}

// ─── Pre-computed palettes ─────────────────────────────────────────────────

export const TEAM_PALETTES = Object.fromEntries(
  Object.entries(TEAM_COLORS).map(([key, { rgb }]) => [key, generateHeatPalette(rgb)])
)

// SACRED — always ice-blue, imported from data/index.js (single source of truth)
import { SACRED_TILE } from './index.js'

// ─── Heat level from entry count (team walls don't have tiers) ─────────────
// Team wall entries are all equal — heat is purely density-based.

export function getTeamHeatLevel(entryCount) {
  if (entryCount === 0) return 0
  if (entryCount === 1) return 1
  if (entryCount === 2) return 2
  if (entryCount === 3) return 3
  if (entryCount <= 5)  return 4
  return 5 // 6+ entries on same number = inferno
}

// ─── Public API — matches getHeatStyle / getTileTextColor from index.js ────

export function getTeamHeatStyle(colorKey, entryCount, isSacred = false) {
  if (isSacred) return SACRED_TILE
  const palette = TEAM_PALETTES[colorKey] || TEAM_PALETTES.orange
  const level = getTeamHeatLevel(entryCount)
  return palette[level]
}

export function getTeamTileTextColor(colorKey, entryCount, isSacred = false) {
  if (isSacred) return SACRED_TILE.text
  const palette = TEAM_PALETTES[colorKey] || TEAM_PALETTES.orange
  const level = getTeamHeatLevel(entryCount)
  return palette[level].text
}
