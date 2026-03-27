import { track } from '@vercel/analytics'
import './SportsFilter.css'

export const SPORTS = [
  { id: 'Basketball', label: 'Basketball', icon: '🏀' },
  { id: 'Football',   label: 'Football',   icon: '🏈' },
  { id: 'Baseball',   label: 'Baseball',   icon: '⚾' },
  { id: 'Hockey',     label: 'Hockey',     icon: '🏒' },
  { id: 'Soccer',     label: 'Soccer',     icon: '⚽' },
]

/**
 * SportsFilter — exclusive single-select.
 * Clicking a sport shows only that sport.
 * Clicking the active sport (or ALL) resets to all.
 *
 * `sports` — optional custom sports list (defaults to global SPORTS).
 *            Each item: { id, label, icon }.
 * `trackEvent` — optional analytics event name (defaults to 'sport_filter').
 */
export default function SportsFilter({ active, onChange, sports = SPORTS, trackEvent = 'sport_filter' }) {
  const allActive = !active || active.size === 0

  function handleClick(sportId) {
    // If this sport is already the only active one — reset
    if (!allActive && active.has(sportId) && active.size === 1) {
      onChange(null)
      return
    }
    // Otherwise isolate this sport
    track(trackEvent, { sport: sportId })
    onChange(new Set([sportId]))
  }

  return (
    <div className="sports-filter" role="group" aria-label="Filter by sport">
      <button
        className={`sports-filter__pill${allActive ? ' sports-filter__pill--active' : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={allActive}
      >
        ALL
      </button>

      {sports.map(sport => {
        const isOn = !allActive && active.has(sport.id)
        return (
          <button
            key={sport.id}
            className={`sports-filter__pill${isOn ? ' sports-filter__pill--active' : ''}`}
            onClick={() => handleClick(sport.id)}
            aria-pressed={isOn}
            aria-label={`Filter: ${sport.label}`}
          >
            <span className="sports-filter__icon">{sport.icon}</span>
            {sport.label}
          </button>
        )
      })}
    </div>
  )
}
