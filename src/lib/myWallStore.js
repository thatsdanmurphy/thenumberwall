/**
 * THE NUMBER WALL — My Wall Store
 * Supabase-backed persistence for My Wall.
 * Handles creating walls, loading walls by slug, and placing/removing entries.
 *
 * Security: walls have an `owner_token` (UUID) generated on creation.
 * The token is stored in localStorage and checked on mutations.
 * This isn't full auth, but it prevents casual abuse.
 */

import { supabase } from './supabase.js'

// ─── Create a new wall ──────────────────────────────────────────────────────

export async function createWall({ slug, ownerName, myNumber, theme, themeDescription, allowContributions }) {
  const row = {
    slug,
    owner_name: ownerName,
    my_number: myNumber,
  }
  if (theme) row.theme = theme
  if (themeDescription) row.theme_description = themeDescription
  if (allowContributions) row.allow_contributions = true

  const { data, error } = await supabase
    .from('walls')
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return data  // includes owner_token from DB default
}

// ─── List all walls owned by the current user ─────────────────────────────

export async function listMyWalls(ownerToken) {
  if (!ownerToken) return []

  // Get walls with entry counts
  const { data: walls, error } = await supabase
    .from('walls')
    .select('id, slug, owner_name, my_number, theme, theme_description, allow_contributions, created_at, updated_at, owner_token')
    .eq('owner_token', ownerToken)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!walls || walls.length === 0) return []

  // Fetch entry counts + distinct contributors for each wall
  const wallIds = walls.map(w => w.id)
  const { data: entries } = await supabase
    .from('wall_entries')
    .select('wall_id, contributed_by')
    .in('wall_id', wallIds)

  const entriesByWall = {}
  const contribsByWall = {}
  for (const e of (entries || [])) {
    entriesByWall[e.wall_id] = (entriesByWall[e.wall_id] || 0) + 1
    if (e.contributed_by) {
      if (!contribsByWall[e.wall_id]) contribsByWall[e.wall_id] = new Set()
      contribsByWall[e.wall_id].add(e.contributed_by)
    }
  }

  return walls.map(w => ({
    ...w,
    entryCount: entriesByWall[w.id] || 0,
    contributors: contribsByWall[w.id] ? [...contribsByWall[w.id]] : [],
  }))
}

// ─── Load a wall by slug ────────────────────────────────────────────────────

export async function loadWall(slug) {
  const { data: wall, error: wallError } = await supabase
    .from('walls')
    .select('*')
    .eq('slug', slug)
    .single()

  if (wallError) return null

  const { data: entries, error: entriesError } = await supabase
    .from('wall_entries')
    .select('*')
    .eq('wall_id', wall.id)
    .order('added_at', { ascending: true })

  if (entriesError) throw entriesError

  return { ...wall, entries: entries || [] }
}

// ─── Check if a slug is available ───────────────────────────────────────────

export async function isSlugAvailable(slug) {
  const { data } = await supabase
    .from('walls')
    .select('id')
    .eq('slug', slug)
    .single()

  return !data
}

// ─── Place a player on a wall ───────────────────────────────────────────────

export async function placeEntry(wallId, entry, ownerToken) {
  // Verify authorization: owner by token, or collaborative wall allows anyone
  const { data: wall } = await supabase
    .from('walls')
    .select('owner_token, allow_contributions')
    .eq('id', wallId)
    .single()

  const isOwner = ownerToken && wall?.owner_token === ownerToken
  const isCollaborative = wall?.allow_contributions === true

  if (!isOwner && !isCollaborative) {
    throw new Error('Not authorized to modify this wall')
  }

  const row = {
    wall_id:         wallId,
    number:          entry.number,
    player_name:     entry.playerName,
    player_id:       entry.playerId || null,
    sport:           entry.sport || null,
    source:          entry.source || 'custom',
    tier:            entry.tier || null,
    info_stat:       entry.infoSnap?.stat || null,
    info_stat_label: entry.infoSnap?.statLabel || null,
    info_fun_fact:   entry.infoSnap?.funFact || null,
    info_fallback:   entry.infoSnap?.fallback || false,
    contributed_by:  entry.contributedBy || null,
  }

  const { data, error } = await supabase
    .from('wall_entries')
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Remove a specific entry by its id ──────────────────────────────────────

export async function removeEntry(wallId, number, entryId, ownerToken) {
  if (ownerToken) {
    const { data: wall } = await supabase
      .from('walls')
      .select('owner_token')
      .eq('id', wallId)
      .single()
    if (!wall || wall.owner_token !== ownerToken) {
      throw new Error('Not authorized to modify this wall')
    }
  }

  const { error } = await supabase
    .from('wall_entries')
    .delete()
    .eq('id', entryId)
    .eq('wall_id', wallId)

  if (error) throw error
}

// ─── Clear all entries from a wall ──────────────────────────────────────────

export async function clearAllEntries(wallId, ownerToken) {
  if (ownerToken) {
    const { data: wall } = await supabase
      .from('walls')
      .select('owner_token')
      .eq('id', wallId)
      .single()
    if (!wall || wall.owner_token !== ownerToken) {
      throw new Error('Not authorized to modify this wall')
    }
  }

  const { error } = await supabase
    .from('wall_entries')
    .delete()
    .eq('wall_id', wallId)

  if (error) throw error
}

// ─── Update wall metadata ───────────────────────────────────────────────────

export async function updateWall(wallId, updates, ownerToken) {
  if (ownerToken) {
    const { data: wall } = await supabase
      .from('walls')
      .select('owner_token')
      .eq('id', wallId)
      .single()
    if (!wall || wall.owner_token !== ownerToken) {
      throw new Error('Not authorized to modify this wall')
    }
  }

  const { data, error } = await supabase
    .from('walls')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', wallId)
    .select()
    .single()

  if (error) throw error
  return data
}
