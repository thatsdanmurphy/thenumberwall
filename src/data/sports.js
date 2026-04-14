/**
 * Sports — single source of truth for sport constants.
 *
 * SPORT_ICONS:   react-icons map for sport pill icons.
 * LEGEND_SPORTS: 5 sports on the legends wall (filter bar).
 * TEAM_SPORTS:   11 numbered team sports (team wall creation + add sport).
 *
 * Consumers: SportsFilter, TeamWallPage, CreateTeamWall, PlayerSearch
 */

import { FaBasketballBall, FaFootballBall, FaBaseballBall, FaHockeyPuck, FaFutbol } from 'react-icons/fa'

// Sport icon map — Font Awesome sport icons via react-icons.
// Keys are lowercase IDs (match team wall sport column).
// SportsFilter uses capitalised IDs — lookup is case-insensitive via helper.
export const SPORT_ICONS = {
  basketball: FaBasketballBall,
  football:   FaFootballBall,
  baseball:   FaBaseballBall,
  hockey:     FaHockeyPuck,
  soccer:     FaFutbol,
}

// Case-insensitive icon lookup (SportsFilter uses "Basketball", team walls use "basketball")
export function getSportIcon(sportId) {
  return SPORT_ICONS[sportId?.toLowerCase()] || null
}

// Legends wall — 5 sports for the filter bar
export const LEGEND_SPORTS = [
  { id: 'Basketball', label: 'Basketball' },
  { id: 'Football',   label: 'Football' },
  { id: 'Baseball',   label: 'Baseball' },
  { id: 'Hockey',     label: 'Hockey' },
  { id: 'Soccer',     label: 'Soccer' },
]

// Team walls — all numbered team sports
export const TEAM_SPORTS = [
  { id: 'baseball',      label: 'Baseball' },
  { id: 'basketball',    label: 'Basketball' },
  { id: 'football',      label: 'Football' },
  { id: 'hockey',        label: 'Hockey' },
  { id: 'soccer',        label: 'Soccer' },
  { id: 'lacrosse',      label: 'Lacrosse' },
  { id: 'volleyball',    label: 'Volleyball' },
  { id: 'softball',      label: 'Softball' },
  { id: 'field_hockey',  label: 'Field Hockey' },
  { id: 'rugby',         label: 'Rugby' },
  { id: 'water_polo',    label: 'Water Polo' },
]

// Simple string list for PlayerSearch sport selector
export const SPORT_NAMES = ['Basketball', 'Baseball', 'Hockey', 'Football', 'Soccer']

// Unicode emoji map — used for lightweight contexts (HeroSearch) where
// react-icons components would be overkill. Keys match capitalised IDs.
export const SPORT_EMOJI = {
  Basketball: '\u{1F3C0}',
  Football:   '\u{1F3C8}',
  Baseball:   '\u26BE',
  Hockey:     '\u{1F3D2}',
  Soccer:     '\u26BD',
}
