/**
 * THE NUMBER WALL — Team Wall Store
 * Supabase-backed CRUD for crowdsourced team walls.
 *
 * Tables: team_walls, team_wall_entries, team_wall_flags
 * Auth: browser fingerprint (localStorage). No login required.
 */

import { supabase } from './supabase.js'
import { FINGERPRINT } from './storageKeys.js'

// ─── Browser fingerprint ───────────────────────────────────────────────────
// Simple persistent ID per browser. Not secure — just prevents casual abuse.

export function getFingerprint() {
  let fp = localStorage.getItem(FINGERPRINT)
  if (!fp) {
    fp = 'fp_' + crypto.randomUUID()
    localStorage.setItem(FINGERPRINT, fp)
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

// Town slug = town + state, disambiguated across states
// ("Newton", "MA") → "newton-ma"
export function townSlugify(town, state) {
  return `${slugify(town)}-${(state || '').toLowerCase()}`
}

// Simple similarity check for dedupe suggestions — normalized tokens
// "Newton North" vs "Newton North High School" → considered similar.
function normalizeForCompare(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\b(high school|hs|school|academy|prep|college|university|of|the|and|&)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function fuzzyMatch(a, b) {
  const na = normalizeForCompare(a)
  const nb = normalizeForCompare(b)
  if (!na || !nb) return false
  if (na === nb) return true
  if (na.length >= 4 && nb.includes(na)) return true
  if (nb.length >= 4 && na.includes(nb)) return true
  return false
}

// ─── Create a team wall ────────────────────────────────────────────────────

export async function createTeamWall({
  school, orgType = 'public_hs',
  town, state, country = 'US',
  sport,
  colorPrimary, colorSecondary,
  coachName, coachFunFact,
  existingSchoolSlug, // if joining an existing org with a new sport
}) {
  const fp = getFingerprint()
  const schoolSlug = existingSchoolSlug || slugify(school)
  const townSlug = townSlugify(town, state)

  const row = {
    school,
    school_slug:     schoolSlug,
    org_type:        orgType,
    town,
    town_slug:       townSlug,
    state,
    country,
    sport,
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

// Find all orgs in a town (distinct school_slug), used for town browse + dedupe.
export async function findOrgsInTown(townSlug) {
  const { data, error } = await supabase
    .from('team_walls')
    .select('school, school_slug, org_type, sport, color_primary, created_at')
    .eq('town_slug', townSlug)
    .eq('status', 'active')
    .order('school', { ascending: true })

  if (error) return []
  // Group by school_slug so each org appears once with its sports
  const orgMap = new Map()
  for (const row of data || []) {
    const existing = orgMap.get(row.school_slug)
    if (!existing) {
      orgMap.set(row.school_slug, {
        school: row.school,
        school_slug: row.school_slug,
        org_type: row.org_type || 'public_hs',
        color_primary: row.color_primary,
        sports: [row.sport],
      })
    } else {
      existing.sports.push(row.sport)
    }
  }
  return [...orgMap.values()]
}

// Find orgs with similar names in same town (for dedupe nudge during create).
export async function findSimilarOrgsInTown(school, townSlug) {
  const orgs = await findOrgsInTown(townSlug)
  return orgs.filter(o => fuzzyMatch(o.school, school))
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

export async function loadTeamWallByRoute(schoolSlug, sport) {
  // Accept active + archived (so creator can see and undo the retire).
  // Hidden walls (past cooldown) are not loadable from the UI.
  const { data: wall, error } = await supabase
    .from('team_walls')
    .select('*')
    .eq('school_slug', schoolSlug)
    .eq('sport', sport)
    .in('status', ['active', 'archived'])
    .single()

  if (error || !wall) return null

  // Auto-hide if archived past the cooldown
  const daysLeft = retireDaysLeft(wall)
  if (wall.status === 'archived' && daysLeft === 0) {
    await supabase
      .from('team_walls')
      .update({ status: 'hidden' })
      .eq('id', wall.id)
    return null
  }

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

// ─── Enriched BUILDING NOW ─────────────────────────────────────────────────
// Same walls as getActiveWalls, plus activity signals that make the card
// feel alive: entry count, contributor count, most recent activity.
//
// One follow-up query per wall could stack up, but active list is small
// (5 walls by default). Single batch: pull all entries for the shortlist,
// then fold in JS.

export async function getActiveWallsWithSignals(limit = 5) {
  const walls = await getActiveWalls(limit)
  if (walls.length === 0) return []

  const wallIds = walls.map(w => w.id)
  const { data: entries } = await supabase
    .from('team_wall_entries')
    .select('wall_id, added_by, added_at')
    .in('wall_id', wallIds)
    .eq('status', 'active')

  const signals = new Map()
  for (const id of wallIds) {
    signals.set(id, { entryCount: 0, contributors: new Set(), lastActivityAt: null })
  }
  for (const e of entries || []) {
    const s = signals.get(e.wall_id)
    if (!s) continue
    s.entryCount += 1
    if (e.added_by) s.contributors.add(e.added_by)
    if (!s.lastActivityAt || e.added_at > s.lastActivityAt) {
      s.lastActivityAt = e.added_at
    }
  }

  return walls.map(w => {
    const s = signals.get(w.id)
    return {
      ...w,
      entryCount:       s.entryCount,
      contributorCount: s.contributors.size,
      lastActivityAt:   s.lastActivityAt,
    }
  })
}

// ─── Town browse ───────────────────────────────────────────────────────────
// All active walls in a single town. Unlike findOrgsInTown (which collapses
// by school), this returns the raw wall rows so each {org × sport} pair
// renders as its own card.

export async function getWallsInTown(townSlug) {
  if (!townSlug) return []
  const { data, error } = await supabase
    .from('team_walls')
    .select('*')
    .eq('town_slug', townSlug)
    .eq('status', 'active')
    .order('school', { ascending: true })
  if (error) throw error
  return data || []
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
    added_by:  fp,
  }

  if (gradYear) row.grad_year = Number(gradYear)

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

// ─── Update an entry (anyone can edit name, position, fun_fact, grad_year) ─

export async function updateTeamEntry(entryId, { name, position, funFact, gradYear }) {
  const updates = {}
  if (name !== undefined)     updates.name      = name
  if (position !== undefined) updates.position   = position || null
  if (funFact !== undefined)  updates.fun_fact   = funFact ? funFact.slice(0, 140) : null
  if (gradYear !== undefined) updates.grad_year  = gradYear ? Number(gradYear) : null

  const { data, error } = await supabase
    .from('team_wall_entries')
    .update(updates)
    .eq('id', entryId)
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

// ─── Wall retirement flow ──────────────────────────────────────────────────
// Creator-only. Sets status=archived + archived_at. 7-day cooldown before
// it flips to hidden (done by a server-side job or on-read check).

const RETIRE_COOLDOWN_DAYS = 7

// Creator-only: update the coach block on a wall. Intentionally narrow —
// exposing only coach_name + coach_fun_fact keeps this safe to ship before
// broader wall-settings UI lands.
export async function updateWallCoach(wallId, { coachName, coachFunFact }) {
  // Coach is a community contribution like any entry, not a creator-only
  // setting. Anyone who can see the wall can add/update the coach.
  const { data, error } = await supabase
    .from('team_walls')
    .update({
      coach_name:     coachName?.trim() || null,
      coach_fun_fact: coachFunFact?.trim() || null,
    })
    .eq('id', wallId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function archiveWall(wallId) {
  const { data, error } = await supabase
    .from('team_walls')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', wallId)
    .eq('created_by', getFingerprint())
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unarchiveWall(wallId) {
  const { data, error } = await supabase
    .from('team_walls')
    .update({ status: 'active', archived_at: null })
    .eq('id', wallId)
    .eq('created_by', getFingerprint())
    .select()
    .single()
  if (error) throw error
  return data
}

// Days remaining in retire cooldown; null if not archived.
export function retireDaysLeft(wall) {
  if (!wall?.archived_at || wall.status !== 'archived') return null
  const archivedAt = new Date(wall.archived_at).getTime()
  const elapsed = (Date.now() - archivedAt) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(RETIRE_COOLDOWN_DAYS - elapsed))
}

// ─── Entry deletion ────────────────────────────────────────────────────────
// Contributor (same fingerprint) can delete their own entry.
// Wall creator can hide any entry on their wall.

export async function deleteOwnEntry(entryId) {
  const fp = getFingerprint()
  const { error } = await supabase
    .from('team_wall_entries')
    .delete()
    .eq('id', entryId)
    .eq('added_by', fp)
  if (error) throw error
  return true
}

export async function hideEntryAsCreator(entryId, wallId) {
  // Verify current user created the wall (RLS should also enforce this)
  const fp = getFingerprint()
  const { data: wall } = await supabase
    .from('team_walls')
    .select('created_by')
    .eq('id', wallId)
    .single()
  if (!wall || wall.created_by !== fp) throw new Error('Not authorized')

  const { error } = await supabase
    .from('team_wall_entries')
    .update({ status: 'hidden' })
    .eq('id', entryId)
    .eq('wall_id', wallId)
  if (error) throw error
  return true
}

export function canDeleteEntry(entry) {
  return entry?.added_by === getFingerprint()
}

// ─── Get all sports for a school (for sport nav) ──────────────────────────

export async function getSchoolSports(schoolSlug) {
  const { data, error } = await supabase
    .from('team_walls')
    .select('id, sport, color_primary, created_at')
    .eq('school_slug', schoolSlug)
    .eq('status', 'active')
    .order('sport', { ascending: true })

  if (error) return []
  return data || []
}
