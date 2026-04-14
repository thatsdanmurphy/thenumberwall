/**
 * THE NUMBER WALL — Feature Vote Store
 * Supabase-backed voting with localStorage rate-limiting.
 * Each browser gets 1 vote per option. Anonymous.
 */

import { supabase } from './supabase.js'
import { VOTES } from './storageKeys.js'

// ─── Local vote tracking ───────────────────────────────────────────────────

function getLocalVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTES) || '{}')
  } catch { return {} }
}

function setLocalVote(optionId) {
  const votes = getLocalVotes()
  votes[optionId] = Date.now()
  localStorage.setItem(VOTES, JSON.stringify(votes))
}

export function hasVoted(optionId) {
  return !!getLocalVotes()[optionId]
}

// ─── Supabase operations ───────────────────────────────────────────────────

/** Fetch all vote counts. Returns { option_id: count } */
export async function fetchVotes() {
  try {
    const { data, error } = await supabase
      .from('feature_votes')
      .select('option_id, count')
    if (error) throw error
    const map = {}
    for (const row of data) map[row.option_id] = row.count
    return map
  } catch {
    // Table might not exist yet — return empty
    return {}
  }
}

/** Cast a vote. Increments count in Supabase, marks localStorage. */
export async function castVote(optionId) {
  if (hasVoted(optionId)) return false

  try {
    // Upsert: increment if exists, insert with count=1 if not
    const { error } = await supabase.rpc('increment_vote', { option: optionId })
    if (error) throw error
  } catch {
    // Fallback: try direct upsert if RPC doesn't exist yet
    try {
      const { data } = await supabase
        .from('feature_votes')
        .select('count')
        .eq('option_id', optionId)
        .single()

      if (data) {
        await supabase
          .from('feature_votes')
          .update({ count: data.count + 1 })
          .eq('option_id', optionId)
      } else {
        await supabase
          .from('feature_votes')
          .insert({ option_id: optionId, count: 1 })
      }
    } catch {
      // Supabase not ready — vote still counts locally
    }
  }

  setLocalVote(optionId)
  return true
}
