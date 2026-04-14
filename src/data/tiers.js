/**
 * Tiers — single source of truth for player tier constants.
 *
 * TIER_WEIGHT:  numeric weight for heat computation (higher = hotter)
 * TIER_RANK:    sort order (lower = more prestigious)
 * TIER_DESC:    human-readable tier descriptions
 *
 * Consumers: data/index.js (heat), PlayerPanel (sort + descriptions), MyWallsHub (sort)
 */

// Weight for heat level computation — used by getHeatLevel() in data/index.js
// Higher weight = more heat on the tile.
export const TIER_WEIGHT = {
  SACRED:      5,
  LEGEND:      4,
  ICON:        3,
  CONDITIONAL: 3,
  ACTIVE:      2,
  UNWRITTEN:   0,
}

// Sort rank — lower number = more prestigious. Used for legend ordering in panels.
export const TIER_RANK = {
  SACRED:      0,
  LEGEND:      1,
  ICON:        1.5,
  CONDITIONAL: 2,
  ACTIVE:      3,
  UNWRITTEN:   9,
}

// Human-readable descriptions — shown in PlayerPanel tooltips/badges.
export const TIER_DESC = {
  SACRED:      'Retired league-wide or untouchable — the number belongs to them.',
  LEGEND:      'Hall of Fame or era-defining player who wore this number.',
  CONDITIONAL: 'Legend status under annual review.',
  ACTIVE:      'Current player wearing this number.',
  ICON:        'Iconic player who defined the number in their era.',
  UNWRITTEN:   'No notable player has claimed this number yet.',
}
