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
    id: 'march-madness',
    name: 'March Madness Wall',
    description: 'The tournament runs that live rent-free in your head.',
    icon: '🏀',
    months: [3, 4],  // March–April
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
    id: 'coach-legends',
    name: 'Coach Legends',
    description: 'Build a wall of the greats your team should know.',
    icon: '📋',
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
