/**
 * THE NUMBER WALL — Player Vote Store
 * Reddit-style up/down voting on player cards.
 * Supabase-backed with localStorage for optimistic UI + fingerprint identity.
 *
 * One vote per player per browser. Can change direction (up → down).
 * Vote data drives card ordering and tile pulse.
 */

import { supabase } from './supabase.js'
import { getFingerprint } from './teamWallStore.js'

// ─── Local cache ───────────────────────────────────────────────────────────
// localStorage key for optimistic vote tracking
const LOCAL_KEY = 'tnw_player_votes'

function getLocalVotes() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}')
  } catch { return {} }
}

function setLocalVote(wallId, number, playerName, direction) {
  const votes = getLocalVotes()
  const key = `${wallId}|${number}|${playerName}`
  votes[key] = { direction, ts: Date.now() }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(votes))
}

function removeLocalVote(wallId, number, playerName) {
  const votes = getLocalVotes()
  const key = `${wallId}|${number}|${playerName}`
  delete votes[key]
  localStorage.setItem(LOCAL_KEY, JSON.stringify(votes))
}

/** Get the user's vote for a specific player. Returns 1, -1, or null. */
export function getMyVote(wallId, number, playerName) {
  const key = `${wallId}|${number}|${playerName}`
  const local = getLocalVotes()[key]
  return local?.direction ?? null
}

// ─── Fetch scores ──────────────────────────────────────────────────────────

/**
 * Fetch vote scores for all players on a wall.
 * Returns Map: "number|playerName" → { netScore, totalVotes }
 */
export async function fetchWallScores(wallId) {
  try {
    const { data, error } = await supabase
      .from('player_vote_scores')
      .select('number, player_name, net_score, total_votes')
      .eq('wall_id', wallId)

    if (error) throw error

    const map = new Map()
    for (const row of (data || [])) {
      map.set(`${row.number}|${row.player_name}`, {
        netScore: row.net_score,
        totalVotes: row.total_votes,
      })
    }
    return map
  } catch {
    return new Map()
  }
}

/**
 * Fetch vote activity (last 24h) per number on a wall.
 * Returns Map: number → recentVotes count (drives tile pulse).
 */
export async function fetchWallActivity(wallId) {
  try {
    const { data, error } = await supabase
      .from('player_vote_activity')
      .select('number, recent_votes')
      .eq('wall_id', wallId)

    if (error) throw error

    const map = new Map()
    for (const row of (data || [])) {
      map.set(row.number, row.recent_votes)
    }
    return map
  } catch {
    return new Map()
  }
}

/**
 * Fetch the current user's votes on a wall.
 * Returns Map: "number|playerName" → direction (1 or -1)
 */
export async function fetchMyVotes(wallId) {
  const fp = getFingerprint()
  try {
    const { data, error } = await supabase
      .from('player_votes')
      .select('number, player_name, direction')
      .eq('wall_id', wallId)
      .eq('fingerprint', fp)

    if (error) throw error

    const map = new Map()
    for (const row of (data || [])) {
      map.set(`${row.number}|${row.player_name}`, row.direction)
    }
    return map
  } catch {
    return new Map()
  }
}

// ─── Cast / change vote ────────────────────────────────────────────────────

/**
 * Cast or change a vote.
 * If user already voted the same direction, removes the vote (toggle off).
 * Returns the new direction (1, -1, or null if toggled off).
 */
export async function castPlayerVote(wallId, number, playerName, direction) {
  const fp = getFingerprint()
  const currentVote = getMyVote(wallId, number, playerName)

  // Toggle off: same direction again → remove vote
  if (currentVote === direction) {
    removeLocalVote(wallId, number, playerName)
    try {
      await supabase
        .from('player_votes')
        .delete()
        .eq('wall_id', wallId)
        .eq('number', number)
        .eq('player_name', playerName)
        .eq('fingerprint', fp)
    } catch {}
    return null
  }

  // New vote or direction change
  setLocalVote(wallId, number, playerName, direction)
  try {
    await supabase
      .from('player_votes')
      .upsert({
        wall_id: wallId,
        number,
        player_name: playerName,
        fingerprint: fp,
        direction,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'wall_id,number,player_name,fingerprint',
      })
  } catch {
    // Supabase not ready — vote still counts locally
  }

  return direction
}
