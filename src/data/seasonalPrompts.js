/**
 * THE NUMBER WALL — Seasonal & Themed Wall Prompts
 *
 * Hardcoded for now. Move to Supabase when we need admin UI.
 * Each prompt seeds a wall creation flow with a theme and description.
 *
 * `months` — array of 1-indexed months when this prompt is active.
 *            null = always active (evergreen prompts).
 */

export const SEASONAL_PROMPTS = [
  // ─── Seasonal ──────────────────────────────────────────────────────────────
  {
    id: 'nba-finals',
    name: 'Finals Wall',
    description: 'The legends who defined the Finals for you.',
    icon: '🏆',
    months: [5, 6],  // May–June
    category: 'seasonal',
  },
  {
    id: 'world-series',
    name: 'World Series Wall',
    description: 'The heroes of October baseball.',
    icon: '⚾',
    months: [10],  // October
    category: 'seasonal',
  },
  {
    id: 'playoff-legends',
    name: 'Playoff Legends',
    description: 'The players who showed up when it mattered most.',
    icon: '🏆',
    months: [4, 5, 6],  // April–June (NBA & NHL playoffs)
    category: 'seasonal',
  },
  {
    id: 'super-bowl',
    name: 'Super Bowl Wall',
    description: 'The plays. The players. The numbers that won it.',
    icon: '🏈',
    months: [1, 2],  // January–February
    category: 'seasonal',
  },
  {
    id: 'stanley-cup',
    name: 'Stanley Cup Wall',
    description: 'Playoff beards and overtime legends.',
    icon: '🏒',
    months: [5, 6],  // May–June
    category: 'seasonal',
  },

  // ─── Evergreen ─────────────────────────────────────────────────────────────
  {
    id: 'for-your-players',
    name: 'For Your Players',
    description: 'The wall you build for your locker room.',
    icon: '🧑‍🏫',
    months: null,
    category: 'coach',
  },
  {
    id: 'family-wall',
    name: 'Family Wall',
    description: 'The players your family grew up watching.',
    icon: '🏠',
    months: null,
    category: 'family',
  },
  {
    id: 'road-trip',
    name: 'Road Trip Wall',
    description: 'Everyone picks. One wall. Settle it on the drive.',
    icon: '🚗',
    months: null,
    category: 'friends',
  },
  {
    id: 'rival-city',
    name: 'Rival City',
    description: 'Got a friend in another sports town? Settle it.',
    icon: '⚔️',
    months: null,
    category: 'friends',
  },
]

/**
 * Get prompts that are active right now (seasonal + all evergreen).
 */
export function getActivePrompts() {
  const month = new Date().getMonth() + 1  // 1-indexed
  return SEASONAL_PROMPTS.filter(p =>
    p.months === null || p.months.includes(month)
  )
}

/**
 * Get seasonal prompts only (for homepage banner).
 */
export function getSeasonalPrompts() {
  const month = new Date().getMonth() + 1
  return SEASONAL_PROMPTS.filter(p =>
    p.months !== null && p.months.includes(month)
  )
}
