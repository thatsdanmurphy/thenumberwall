import { track } from '@vercel/analytics'
import { getSportIcon, LEGEND_SPORTS } from '../data/sports.js'
import './SportsFilter.css'

// Re-export for backwards compatibility — consumers that import SPORTS from SportsFilter
export const SPORTS = LEGEND_SPORTS

/**
 * SportsFilter — exclusive single-select.
 * Clicking a sport shows only that sport.
 * Clicking the active sport (or ALL) resets to all.
 */
export default function SportsFilter({ active, onChange, sports, trackEvent }) {
  const allActive = !active || active.size === 0
  const sportsList = sports || SPORTS

  function handleClick(sportId) {
    if (!allActive && active.has(sportId) && active.size === 1) {
      onChange(null)
      return
    }
    track(trackEvent || 'sport_filter', { sport: sportId })
    onChange(new Set([sportId]))
  }

  return (
    <div className="sports-filter" role="group" aria-label="Filter by sport">
      <span className="sports-filter__label">Filter:</span>
      <button
        className={`sports-filter__pill${allActive ? ' sports-filter__pill--active' : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={allActive}
      >
        ALL
      </button>

      {sportsList.map(sport => {
        const isOn = !allActive && active.has(sport.id)
        const Icon = getSportIcon(sport.id)
        return (
          <button
            key={sport.id}
            className={`sports-filter__pill${isOn ? ' sports-filter__pill--active' : ''}`}
            onClick={() => handleClick(sport.id)}
            aria-pressed={isOn}
            aria-label={`Filter: ${sport.label}`}
          >
            {Icon && <Icon size={13} className="sports-filter__icon" />}
            {sport.label}
          </button>
        )
      })}
    </div>
  )
}
