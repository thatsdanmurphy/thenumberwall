import { track } from '@vercel/analytics'
import { FaBasketballBall, FaFootballBall, FaBaseballBall, FaHockeyPuck, FaFutbol } from 'react-icons/fa'
import './SportsFilter.css'

// Sport icon map — Font Awesome sport icons via react-icons
const SPORT_ICONS = {
  Basketball: FaBasketballBall,
  Football:   FaFootballBall,
  Baseball:   FaBaseballBall,
  Hockey:     FaHockeyPuck,
  Soccer:     FaFutbol,
}

export const SPORTS = [
  { id: 'Basketball', label: 'Basketball' },
  { id: 'Football',   label: 'Football' },
  { id: 'Baseball',   label: 'Baseball' },
  { id: 'Hockey',     label: 'Hockey' },
  { id: 'Soccer',     label: 'Soccer' },
]

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
      <button
        className={`sports-filter__pill${allActive ? ' sports-filter__pill--active' : ''}`}
        onClick={() => onChange(null)}
        aria-pressed={allActive}
      >
        ALL
      </button>

      {sportsList.map(sport => {
        const isOn = !allActive && active.has(sport.id)
        const Icon = SPORT_ICONS[sport.id]
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
