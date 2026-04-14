/**
 * Storage Keys — single source of truth for all localStorage keys.
 *
 * Every key the app reads/writes lives here. No raw strings elsewhere.
 * Makes refactoring painless and prevents typo bugs.
 *
 * Grouped by feature. Prefix: tnw_ (The Number Wall) or nw_ (legacy).
 */

// ── My Walls ────────────────────────────────────────────────────────────────
export const MY_WALL_TOKEN  = 'tnw_my_wall_token'   // UUID owner token
export const MY_WALL_ID     = 'tnw_my_wall_id'      // current wall DB id
export const MY_WALL_SLUG   = 'tnw_my_wall_slug'    // current wall URL slug

// ── Identity (hub profile) ──────────────────────────────────────────────────
export const IDENTITY_NUMBER = 'tnw_identity_number'
export const IDENTITY_CITY   = 'tnw_identity_city'
export const IDENTITY_HERO   = 'tnw_identity_hero'

// ── Team Walls ──────────────────────────────────────────────────────────────
export const FINGERPRINT = 'tnw_fingerprint'         // browser fingerprint UUID

// ── Feature Voting ──────────────────────────────────────────────────────────
export const VOTES = 'tnw_votes'                     // { optionId: true } map

// ── UI State ────────────────────────────────────────────────────────────────
export const HUB_WELCOMED   = 'tnw_hub_welcomed'     // first-visit placemat dismissed
export const FIRST_VISITED  = 'nw_visited'           // legends wall first-visit modal

// ── Player Picks (dynamic keys) ─────────────────────────────────────────────
// These use template functions because the key includes the number.
export const pickKey   = (number) => `nw_pick_${number}`
export const debateKey = (number) => `nw_debate_${number}`
