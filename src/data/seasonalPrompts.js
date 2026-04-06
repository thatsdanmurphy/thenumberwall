/**
 * THE NUMBER WALL — Seasonal & Themed Wall Prompts
 *
 * Hardcoded for now. Move to Supabase when we need admin UI.
 * Each prompt seeds a wall creation flow with a theme and description.
 *
 * `months` — array of 1-indexed months when this prompt is active.
 *            null = always active (evergreen prompts).
 *
 * `lucideIcon` — icon name from lucide-react, used in the hub modal.
 */

export const SEASONAL_PROMPTS = [
  // ─── Seasonal ──────────────────────────────────────────────────────────────
  {
    id: 'playoff-legends',
    name: 'Playoff Legends',
    description: 'The players who showed up when it mattered most.',
    lucideIcon: 'trophy',
    months: [4, 5, 6],  // April–June (NBA & NHL playoffs)
    category: 'seasonal',
  },
  {
    id: 'nba-finals',
    name: 'Finals Wall',
    description: 'The legends who defined the Finals for you.',
    lucideIcon: 'flame',
    months: [5, 6],  // May–June
    category: 'seasonal',
  },
  {
    id: 'stanley-cup',
    name: 'Stanley Cup Wall',
    description: 'Playoff beards and overtime legends.',
    lucideIcon: 'shield',
    months: [5, 6],  // May–June
    category: 'seasonal',
  },
  {
    id: 'world-series',
    name: 'World Series Wall',
    description: 'The heroes of October baseball.',
    lucideIcon: 'diamond',
    months: [10],  // October
    category: 'seasonal',
  },
  {
    id: 'super-bowl',
    name: 'Super Bowl Wall',
    description: 'The plays. The players. The numbers that won it.',
    lucideIcon: 'zap',
    months: [1, 2],  // January–February
    category: 'seasonal',
  },

  // ─── Evergreen ─────────────────────────────────────────────────────────────
  {
    id: 'locker-room',
    name: 'Locker Room',
    description: 'The legends your players should know.',
    lucideIcon: 'clipboard-list',
    months: null,
    category: 'coach',
  },
  {
    id: 'family-wall',
    name: 'Family Wall',
    description: 'Everyone picks their legends. See who agrees.',
    lucideIcon: 'users',
    months: null,
    category: 'family',
  },
  {
    id: 'rival-city',
    name: 'Rival City',
    description: 'Got a friend in another sports town? Settle it.',
    lucideIcon: 'swords',
    months: null,
    category: 'friends',
  },
  {
    id: 'road-trip',
    name: 'Road Trip Wall',
    description: 'Pick \'em on the drive. Each person gets a lane.',
    lucideIcon: 'map',
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
