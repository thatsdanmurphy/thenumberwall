/**
 * analytics.js — lightweight wrapper around GA4 custom events.
 *
 * Usage:  import { trackEvent } from '../lib/analytics.js'
 *         trackEvent('wall_view', { wall: 'needham-hs', sport: 'football' })
 *
 * In dev (gtag not loaded), events log to console so you can see them.
 *
 * Key events:
 *   wall_view       — landed on a team wall page
 *   entry_added     — contributed a name (crowd or legend_seed)
 *   pipeline_expand — opened a PipelinePath on a legend card
 *   wall_created    — new wall born via StartWallDialog
 *   share_tap       — shared a wall or town link
 */
export function trackEvent(name, props = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, props)
    } else {
      console.info(`[analytics] ${name}`, props)
    }
  } catch { /* swallow */ }
}
