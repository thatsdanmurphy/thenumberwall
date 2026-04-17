/**
 * THE NUMBER WALL — Votes Store
 * Live crowd votes for "who owns this number?" picks.
 *
 * Table: number_picks (Supabase)
 * One vote per fingerprint per number+wall+sport combo.
 *
 * Seeds (from associations.json) bootstrap the percentages so bars
 * aren't empty on day one. As real votes accumulate they gradually
 * outweigh the seeds. The blend formula:
 *
 *   displayed = seed × fadeWeight + live
 *   fadeWeight = max(0, 1 − liveTotal / FADE_THRESHOLD)
 *
 * Once liveTotal ≥ FADE_THRESHOLD the seeds contribute nothing and
 * the wall runs purely on crowd data.
 */

import { supabase } from './supabase.js'
import { getFingerprint } from './teamWallStore.js'

// Once this many real votes exist for a number+wall+sport, seeds
// are fully faded out. Low enough that early traffic matters quickly,
// high enough that the first 3 votes don't whipsaw the bars.
const FADE_THRESHOLD = 100

// ─── Write a pick ─────────────────────────────────────────────────────────
// Upserts so a second call from the same browser is a silent no-op
// (the unique index on number+wall+sport+fingerprint rejects dupes).

export async function submitNumberPick({ number, optionIdx, wall = 'global', sport = null }) {
  const fp = getFingerprint()
  const { error } = await supabase
    .from('number_picks')
    .upsert(
      {
        number,
        option_idx: optionIdx,
        wall,
        sport:       sport || null,
        fingerprint: fp,
      },
      { onConflict: 'number,wall,sport,fingerprint', ignoreDuplicates: true }
    )
  // Swallow constraint violations — means they already voted.
  if (error && error.code !== '23505') {
    console.error('Vote write failed:', error)
  }
}

// ─── Read aggregated counts ───────────────────────────────────────────────
// Returns a Map: optionIdx → count of real votes.
// Callers blend this with seed data using blendVotes().

export async function getPickCounts({ number, wall = 'global', sport = null }) {
  // Supabase JS client doesn't expose GROUP BY natively, so we pull
  // the slim rows and fold in JS. For a single number the row count
  // is tiny (hundreds at most).
  const query = supabase
    .from('number_picks')
    .select('option_idx')
    .eq('number', number)
    .eq('wall', wall)

  if (sport) {
    query.eq('sport', sport)
  } else {
    query.is('sport', null)
  }

  const { data, error } = await query
  if (error) {
    // Table might not exist yet (migration pending). Return empty
    // so the UI falls back to seed-only gracefully.
    if (/schema cache/i.test(error.message || '') || error.code === 'PGRST205') return new Map()
    console.error('Vote read failed:', error)
    return new Map()
  }

  const counts = new Map()
  for (const row of data || []) {
    counts.set(row.option_idx, (counts.get(row.option_idx) || 0) + 1)
  }
  return counts
}

// ─── Blend seed + live votes ──────────────────────────────────────────────
// Returns an array of blended vote counts, one per option.
//
//   seeds:      [288, 120, 48, ...]  — static editorial seeds
//   liveCounts: Map { 0 → 14, 1 → 9, ... } — from getPickCounts
//
// The seed contribution fades linearly as live votes grow:
//   fadeWeight = max(0, 1 − liveTotal / FADE_THRESHOLD)
//   blended[i] = round(seed[i] × fadeWeight) + live[i]
//
// This means:
//   0 live votes   → 100% seed (bars look populated from day one)
//   50 live votes  → 50% seed + live (transition phase)
//   100+ live      → 0% seed, pure crowd

export function blendVotes(seeds, liveCounts) {
  const liveTotal = Array.from(liveCounts.values()).reduce((a, b) => a + b, 0)
  const fadeWeight = Math.max(0, 1 - liveTotal / FADE_THRESHOLD)

  return seeds.map((seed, i) => {
    const live = liveCounts.get(i) || 0
    return Math.round(seed * fadeWeight) + live
  })
}
