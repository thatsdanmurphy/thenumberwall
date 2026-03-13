/**
 * THE NUMBER WALL — Data Layer
 *
 * Static JSON imports. No network requests. No loading states.
 * Source of truth: 03_Data/dist/ (compiled from relational CSVs).
 * Re-run compile_wall_data.py to regenerate, then re-export to JSON.
 *
 * Three datasets:
 *   wallData       — 147 entries, numbers 0, 00, 1–99 (global wall)
 *   bostonLegends  — 80 entries (Boston legend wall)
 *   bostonCurrent  — 133 entries (Boston current season rosters)
 */

import wallDataRaw      from './wallData.json'
import bostonLegendsRaw from './bostonLegends.json'
import bostonCurrentRaw from './bostonCurrent.json'

// ─── Normalise ─────────────────────────────────────────────────────────────
// Clean and type-cast raw CSV rows into consistent JS objects.

function normalise(row) {
  return {
    number:    row.Number     ?? '',
    tier:      row.Tier       ?? '',
    name:      row.Name       ?? '',
    sport:     row.Sport      ?? '',
    league:    row.League     ?? '',
    status:    row.Status     ?? '',
    era:       row.Era        ?? '',
    team:      row.Team       ?? '',
    role:      row.Role       ?? '',
    stat:      row['Signature Stat'] ?? '',
    statLabel: row['Stat Label']     ?? '',
    statWeight: Number(row['Stat Weight']) || 0,
    funFact:   row['Fun Fact'] ?? '',
    notes:     row.Notes      ?? '',
  }
}

export const wallData      = wallDataRaw.map(normalise)
export const bostonLegends = bostonLegendsRaw.map(normalise)
export const bostonCurrent = bostonCurrentRaw.map(normalise)

// ─── Wall index ────────────────────────────────────────────────────────────
// Groups entries by number for fast tile lookup.
// Returns a Map: number string → array of player entries.
// Numbers are stored as strings ('0', '00', '1' ... '99').

function buildIndex(entries) {
  const index = new Map()
  for (const entry of entries) {
    const key = String(entry.number)
    if (!index.has(key)) index.set(key, [])
    index.get(key).push(entry)
  }
  return index
}

export const globalIndex  = buildIndex(wallData)
export const bostonIndex  = buildIndex([...bostonLegends, ...bostonCurrent])

// ─── Filtered index ────────────────────────────────────────────────────────
// Returns a new Map with entries filtered to the given sport IDs.
// UNWRITTEN placeholder rows are always preserved so tiles exist.
// If sportFilter is null or empty, returns the base index unchanged.

export function buildFilteredIndex(baseData, sportFilter) {
  if (!sportFilter || sportFilter.size === 0) return buildIndex(baseData)
  const filtered = baseData.filter(
    e => e.tier === 'UNWRITTEN' || sportFilter.has(e.sport)
  )
  return buildIndex(filtered)
}

// ─── Tile numbers ──────────────────────────────────────────────────────────
// Ordered list of all 102 numbers for the tile grid: 0, 00, 1–99.

export const TILE_NUMBERS = ['0', '00', ...Array.from({ length: 99 }, (_, i) => String(i + 1))]

// ─── Heat level ────────────────────────────────────────────────────────────
// Derives a heat step (0–5) from the entries on a tile.
// Tier weights: SACRED=5, LEGEND=3, ACTIVE=2, UNWRITTEN=0.
// Total weight maps to a heat step.

const TIER_WEIGHT = { SACRED: 5, LEGEND: 3, ACTIVE: 2, UNWRITTEN: 0 }

export function getHeatLevel(entries) {
  if (!entries || entries.length === 0) return 0
  // UNWRITTEN placeholder rows carry no heat — strip them before scoring
  const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
  if (legends.length === 0) return 0

  const hasSacred = legends.some(e => e.tier === 'SACRED')
  if (hasSacred) return 5 // inferno — sacred always burns hottest

  const totalWeight = legends.reduce((sum, e) => sum + (TIER_WEIGHT[e.tier] ?? 0), 0)

  if (totalWeight >= 10) return 5 // inferno
  if (totalWeight >= 7)  return 4 // blazing
  if (totalWeight >= 4)  return 3 // hot
  if (totalWeight >= 2)  return 2 // warm
  if (totalWeight >= 1)  return 1 // ember
  return 0                        // unwritten
}

// ─── Heat level (count-based) ──────────────────────────────────────────────
// Overrides the tier-weight version above for visual heat rendering.
// Based on real legend count — UNWRITTEN placeholder rows don't count.
// Tier weight drives the sort/ranking; count drives the visual heat.

export function getHeatLevelByCount(entries) {
  if (!entries || entries.length === 0) return 0
  // Strip UNWRITTEN placeholders — they don't contribute to heat
  const legends = entries.filter(e => e.tier !== 'UNWRITTEN')
  if (legends.length === 0) return 0
  if (legends.some(e => e.tier === 'SACRED')) return 5 // sacred always burns at peak
  const count = legends.length
  if (count >= 6) return 5
  if (count >= 4) return 4
  if (count === 3) return 3
  if (count === 2) return 2
  if (count === 1) return 1
  return 0
}

// ─── Heat tile styles ──────────────────────────────────────────────────────
// Each step has a background, border colour, box-shadow glow, and text colour.
// Text colour is a warm tone that lives inside the tile — not inverted black.
// The glow is what makes the wall feel alive — don't remove it.

const HEAT_TILES = [
  // 0 — unwritten — lights out. Zero orange. Number barely there.
  { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)', glow: 'none',                                                                                          text: 'rgba(255,255,255,0.38)' },
  // 1 — ember
  { bg: 'rgba(140,32,0,0.42)',    border: 'rgba(200,55,0,0.55)',    glow: '0 0 8px rgba(200,60,0,0.40)',                                                                   text: 'rgba(220,110,50,0.85)' },
  // 2 — warm
  { bg: 'rgba(170,42,0,0.52)',    border: 'rgba(225,70,5,0.65)',    glow: '0 0 12px rgba(240,80,10,0.50), 0 0 24px rgba(220,60,0,0.22)',                                   text: 'rgba(255,145,65,1)' },
  // 3 — hot
  { bg: 'rgba(198,52,0,0.62)',    border: 'rgba(245,92,15,0.75)',   glow: '0 0 16px rgba(255,100,15,0.65), 0 0 32px rgba(255,75,0,0.30)',                                  text: 'rgba(255,170,85,1)' },
  // 4 — blazing
  { bg: 'rgba(212,88,0,0.72)',    border: 'rgba(245,130,20,0.85)',  glow: '0 0 20px rgba(245,140,20,0.78), 0 0 40px rgba(255,100,0,0.38)',                                 text: 'rgba(255,190,100,1)' },
  // 5 — inferno
  { bg: 'rgba(222,125,0,0.82)',   border: 'rgba(245,180,30,0.92)',  glow: '0 0 24px rgba(245,193,53,0.92), 0 0 48px rgba(255,130,0,0.50), 0 0 64px rgba(255,80,0,0.22)', text: 'rgba(255,210,120,1)' },
]

const SACRED_TILE = {
  bg:     'rgba(200,220,255,0.12)',
  border: 'rgba(200,220,255,0.38)',
  glow:   '0 0 18px rgba(200,220,255,0.52), 0 0 36px rgba(180,210,255,0.22)',
  text:   'rgba(230,240,255,0.92)',
}

// Selected tile — white ring treatment. Heat glow bleeds through underneath.
export const SELECTED_TILE = {
  bg:     'rgba(255,255,255,0.15)',
  border: 'rgba(255,255,255,0.82)',
  text:   '#FFFFFF',
}

export function getHeatStyle(entries, isSacred = false) {
  if (isSacred) return SACRED_TILE
  const level = getHeatLevelByCount(entries)
  return HEAT_TILES[level]
}

// ─── Tile text colour ──────────────────────────────────────────────────────

export function getTileTextColor(entries, isSacred = false) {
  if (isSacred) return SACRED_TILE.text
  const level = getHeatLevelByCount(entries)
  return HEAT_TILES[level].text
}
