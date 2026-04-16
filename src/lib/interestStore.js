/**
 * THE NUMBER WALL — Global Interest Store
 * "I want my team here" pings from international users.
 * One ping per browser (fingerprint). Stores lat/lng + optional label.
 */

import { supabase } from './supabase.js'
import { getFingerprint } from './teamWallStore.js'

// ─── Fetch all pings (for the world map) ──────────────────────────────────

export async function fetchInterestPings() {
  try {
    const { data, error } = await supabase
      .from('global_interest')
      .select('lat, lng, country, label, created_at')

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

// ─── Check if this browser already pinged ─────────────────────────────────

export async function hasAlreadyPinged() {
  const fp = getFingerprint()
  try {
    const { data, error } = await supabase
      .from('global_interest')
      .select('id')
      .eq('fingerprint', fp)
      .limit(1)

    if (error) throw error
    return (data || []).length > 0
  } catch {
    return false
  }
}

// ─── Submit an interest ping ──────────────────────────────────────────────

/**
 * Sends one "I want my team here" ping.
 * Uses browser geolocation for lat/lng.
 * Returns { success: true } or { success: false, reason }.
 */
export async function submitInterestPing({ lat, lng, country = null, label = null }) {
  const fp = getFingerprint()
  try {
    const { error } = await supabase
      .from('global_interest')
      .upsert({
        fingerprint: fp,
        lat,
        lng,
        country,
        label,
      }, {
        onConflict: 'fingerprint',
      })

    if (error) throw error
    return { success: true }
  } catch (err) {
    return { success: false, reason: err.message }
  }
}

// ─── Browser geolocation helper ───────────────────────────────────────────

/**
 * Wraps navigator.geolocation.getCurrentPosition in a promise.
 * Returns { lat, lng } or null if denied/unavailable.
 */
export function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  })
}
