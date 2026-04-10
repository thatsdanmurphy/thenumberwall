/**
 * THE NUMBER WALL — Team Wall Store
 * Supabase-backed CRUD for crowdsourced team walls.
 *
 * Tables: team_walls, team_wall_entries, team_wall_flags
 * Auth: browser fingerprint (localStorage). No login required.
 */

import { supabase } from './supabase.js'

// ─── Browser fingerprint ───────────────────────────────────────────────────
// Simple persistent ID per browser. Not secure — just prevents casual abuse.

const FP_KEY = 'tnw_fingerprint'

export function getFingerprint() {
  let fp = localStorage.getItem(FP_KEY)
  if (!fp) {
    fp = 'fp_' + crypto.randomUUID()
    localStorage.setItem(FP_KEY, fp)
  }
  return fp
}

// ─── Slug generation ───────────────────────────────────────────────────────

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Create a team wall ────────────────────────────────────────────────────

export async function createTeamWall({
  school, city, state, country = 'US',
  sport, year,
  colorPrimary, colorSecondary,
  coachName, coachFunFact,
}) {
  const fp = getFingerprint()
  const schoolSlug = slugify(school)

  const row = {
    school,
    school_slug:     schoolSlug,
    city,
    state,
    country,
    sport,
    year:            Number(year),
    color_primary:   colorPrimary || 'orange',
    created_by:      fp,
  }

  if (colorSecondary)  row.color_secondary = colorSecondary
  if (coachName)       row.coach_name      = coachName
  if (coachFunFact)    row.coach_fun_fact  = coachFunFact

  const { data, error } = await supabase
    .from('team_walls')
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Load a single team wall by ID ─────────────────────────────────────────

export async function loadTeamWall(wallId) {
  const { data: wall, error: wallError } = await supabase
    .from('team_walls')
    .select('*')
    .eq('id', wallId)
    .eq('status', 'active')
    .single()

  if (wallError) return null

  const { data: entries } = await supabase
    .from('team_wall_entries')
    .select('*')
    .eq('wall_id', wallId)
    .in('status', ['active', 'flagged'])
    .order('added_at', { ascending: true })

  return { ...wall, entries: entries || [] }
}

// ─── Load by slug + sport + year ───────────────────────────────────────────

export async function loadTeamWallByRoute(schoolSlug, sport, year) {
  const { data: wall, error } = await supabase
    .from('team_walls')
    .select('*')
    .eq('school_slug', schoolSlug)
    .eq('sport', sport)
    .eq('year', Number(year))
    .eq('status', 'active')
    .single()

  if (error || !wall) return null

  const { data: entries } = await supabase
    .from('team_wall_entries')
    .select('*')
    .eq('wall_id', wall.id)
    .in('status', ['active', 'flagged'])
    .order('added_at', { ascending: true })

  return { ...wall, entries: entries || [] }
}

// ─── Browse / search team walls ────────────────────────────────────────────

export async function browseTeamWalls({ state, sport, query, limit = 20 } = {}) {
  let q = supabase
    .from('team_walls')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (state) q = q.eq('state', state)
  if (sport) q = q.eq('sport', sport)
  if (query) q = q.ilike('school', `%${query}%`)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

// ─── Get recent / active walls (for homepage "BUILDING NOW" section) ──────

export async function getActiveWalls(limit = 5) {
  // Get walls that were most recently contributed to
  const { data: recentEntries } = await supabase
    .from('team_wall_entries')
    .select('wall_id, added_at')
    .eq('status', 'active')
    .order('added_at', { ascending: false })
    .limit(50)

  if (!recentEntries || recentEntries.length === 0) {
    // Fallback: most recently created walls
    const { data } = await supabase
      .from('team_walls')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }

  // Deduplicate by wall_id, keep most recent
  const seen = new Set()
  const uniqueWallIds = []
  for (const e of recentEntries) {
    if (!seen.has(e.wall_id)) {
      seen.add(e.wall_id)
      uniqueWallIds.push(e.wall_id)
    }
    if (uniqueWallIds.length >= limit) break
  }

  const { data: walls } = await supabase
    .from('team_walls')
    .select('*')
    .in('id', uniqueWallIds)
    .eq('status', 'active')

  if (!walls) return []

  // Maintain activity order
  const wallMap = new Map(walls.map(w => [w.id, w]))
  return uniqueWallIds.map(id => wallMap.get(id)).filter(Boolean)
}

// ─── Get entry counts for a wall ───────────────────────────────────────────

export async function getEntryCounts(wallId) {
  const { data, error } = await supabase
    .from('team_wall_entries')
    .select('number')
    .eq('wall_id', wallId)
    .eq('status', 'active')

  if (error) return {}

  const counts = {}
  for (const e of (data || [])) {
    counts[e.number] = (counts[e.number] || 0) + 1
  }
  return counts
}

// ─── Add an entry to a team wall ───────────────────────────────────────────

export async function addTeamEntry(wallId, { number, name, gradYear, position, funFact }) {
  const fp = getFingerprint()

  const row = {
    wall_id:   wallId,
    number:    String(number),
    name,
    grad_year: Number(gradYear),
    added_by:  fp,
  }

  if (position) row.position = position
  if (funFact)  row.fun_fact = funFact.slice(0, 140)

  const { data, error } = await supabase
    .from('team_wall_entries')
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Flag an entry ─────────────────────────────────────────────────────────

export async function flagEntry(entryId, reason) {
  const fp = getFingerprint()

  const { error } = await supabase
    .from('team_wall_flags')
    .insert({
      entry_id:   entryId,
      flagged_by: fp,
      reason:     reason || null,
    })

  if (error) {
    // Unique constraint = already flagged by this user
    if (error.code === '23505') return false
    throw error
  }

  // Increment flag_count on the entry
  const { data: entry } = await supabase
    .from('team_wall_entries')
    .select('flag_count')
    .eq('id', entryId)
    .single()

  const newCount = (entry?.flag_count || 0) + 1
  const newStatus = newCount >= 5 ? 'hidden' : newCount >= 3 ? 'flagged' : 'active'

  await supabase
    .from('team_wall_entries')
    .update({ flag_count: newCount, status: newStatus })
    .eq('id', entryId)

  return true
}

// ─── Check if current user created a wall ──────────────────────────────────

export function isWallCreator(wall) {
  if (!wall) return false
  return wall.created_by === getFingerprint()
}

// ─── Get all years for a school + sport (for lineage view) ─────────────────

export async function getSchoolYears(schoolSlug, sport) {
  const { data, error } = await supabase
    .from('team_walls')
    .select('id, year, level, roster_size, created_at')
    .eq('school_slug', schoolSlug)
    .eq('sport', sport)
    .eq('status', 'active')
    .order('year', { ascending: false })

  if (error) return []
  return data || []
}
