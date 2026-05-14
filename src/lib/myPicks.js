/**
 * THE NUMBER WALL — My Picks Store
 *
 * Anonymous, localStorage-backed collection of "Add to my wall" picks.
 * No login required. Persists across sessions in the same browser.
 *
 * Each pick: { name, number, team, sport, film, addedAt }
 *
 * If the user later creates a full wall (My Walls), their picks are
 * surfaced in the My Walls hub as a separate section — a lightweight
 * "I saved this" layer beneath the full wall builder.
 */

import { MY_PICKS } from './storageKeys.js'

function readPicks() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MY_PICKS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writePicks(picks) {
  try {
    localStorage.setItem(MY_PICKS, JSON.stringify(picks))
  } catch {
    // Ignore quota errors — picks are a nice-to-have, not critical.
  }
}

/** Returns all picks, newest first. */
export function getMyPicks() {
  return readPicks()
}

/** Returns true if a pick exists for this player name (case-sensitive). */
export function hasPick(playerName) {
  return readPicks().some(p => p.name === playerName)
}

/**
 * Adds a pick from a legend entry object.
 * Idempotent — calling twice for the same player is a no-op.
 */
export function addPick(entry) {
  const picks = readPicks()
  if (picks.some(p => p.name === entry.name)) return
  picks.unshift({
    name:     entry.name,
    number:   entry.number    ?? null,
    team:     entry.team      ?? null,
    sport:    entry.sport     ?? null,
    film:     entry.film      ?? null,
    addedAt:  Date.now(),
  })
  writePicks(picks)
}

/** Removes a pick by player name. No-op if not found. */
export function removePick(playerName) {
  writePicks(readPicks().filter(p => p.name !== playerName))
}

/** Returns the count of picks. */
export function getPickCount() {
  return readPicks().length
}
