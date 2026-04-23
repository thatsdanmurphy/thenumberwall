/**
 * analytics.js — lightweight wrapper around Vercel Analytics custom events.
 *
 * Usage:  import { trackEvent } from '../lib/analytics.js'
 *         trackEvent('wall_view', { wall: 'needham-hs', sport: 'football' })
 *
 * In dev (no Vercel runtime), events log to console so you can see them.
 */

let _track = null

async function ensureTrack() {
  if (_track) return _track
  try {
    const mod = await import('@vercel/analytics')
    _track = mod.track
  } catch {
    // Vercel Analytics not available (local dev) — console fallback.
    _track = (name, props) => {
      console.info(`[analytics] ${name}`, props)
    }
  }
  return _track
}

/**
 * Fire a custom event. Non-blocking — won't throw if analytics is missing.
 *
 * Key events for team walls:
 *   wall_view       — landed on a team wall page
 *   entry_added     — contributed a name (crowd or legend_seed)
 *   pipeline_expand — opened a PipelinePath on a legend card
 *   wall_created    — new wall born via StartWallDialog
 *   share_tap       — shared a wall or town link
 */
export function trackEvent(name, props = {}) {
  ensureTrack().then(fn => {
    try { fn(name, props) } catch { /* swallow */ }
  })
}
