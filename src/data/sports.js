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

// Legends wall — 6 sports for the filter bar
export const LEGEND_SPORTS = [
  { id: 'Basketball', label: 'Basketball' },
  { id: 'Football',   label: 'Football' },
  { id: 'Baseball',   label: 'Baseball' },
  { id: 'Hockey',     label: 'Hockey' },
  { id: 'Soccer',     label: 'Soccer' },
  { id: 'Cricket',    label: 'Cricket' },
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
export const SPORT_NAMES = ['Basketball', 'Baseball', 'Hockey', 'Football', 'Soccer', 'Cricket']

// Unicode emoji map — used for lightweight contexts (HeroSearch) where
// react-icons components would be overkill. Keys match capitalised IDs.
export const SPORT_EMOJI = {
  Basketball: '\u{1F3C0}',
  Football:   '\u{1F3C8}',
  Baseball:   '\u26BE',
  Hockey:     '\u{1F3D2}',
  Soccer:     '\u26BD',
  Cricket:    '\u{1F3CF}',
}

// ── Positions by sport ───────────────────────────────────────────────────
// Canonical short codes so a team wall doesn't end up mixing "LD", "D",
// "Defense", and "Defence" for the same role. Free-text "Other…" remains
// available via PositionPicker so obscure or multi-role tags still work.
export const POSITIONS_BY_SPORT = {
  football:     ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'C', 'G', 'T', 'DL', 'DE', 'DT', 'LB', 'CB', 'S', 'K', 'P', 'LS', 'KR'],
  basketball:   ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'],
  hockey:       ['C', 'LW', 'RW', 'D', 'G'],
  baseball:     ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'OF', 'IF', 'UT'],
  softball:     ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DP', 'OF', 'IF', 'UT'],
  soccer:       ['GK', 'CB', 'FB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'],
  lacrosse:     ['A', 'M', 'D', 'G', 'LSM', 'FOGO', 'SSDM'],
  volleyball:   ['S', 'OH', 'MB', 'OPP', 'L', 'DS'],
  field_hockey: ['GK', 'D', 'M', 'F'],
  rugby:        ['Prop', 'Hook', 'Lock', 'Flank', 'No. 8', 'SH', 'FH', 'Centre', 'Wing', 'FB'],
  water_polo:   ['GK', 'CF', 'CB', 'Driver', 'Wing', 'Point'],
}

// Normalise common free-text variants to canonical codes so legacy entries
// fold into the picker's selection cleanly.
const POSITION_ALIASES = {
  // Hockey
  'defense': 'D', 'defence': 'D', 'left defense': 'D', 'right defense': 'D',
  'ld': 'D', 'rd': 'D',
  'center': 'C', 'centre': 'C', 'centerman': 'C',
  'left wing': 'LW', 'right wing': 'RW', 'winger': 'LW',
  'goalie': 'G', 'goaltender': 'G',
  // Football
  'quarterback': 'QB', 'running back': 'RB', 'halfback': 'RB', 'hb': 'RB',
  'fullback': 'FB', 'wide receiver': 'WR', 'tight end': 'TE',
  'offensive line': 'OL', 'o-line': 'OL', 'offense': 'OL',
  'defensive line': 'DL', 'd-line': 'DL', 'defensive end': 'DE',
  'defensive tackle': 'DT', 'linebacker': 'LB', 'cornerback': 'CB',
  'safety': 'S', 'strong safety': 'S', 'free safety': 'S',
  'kicker': 'K', 'punter': 'P', 'long snapper': 'LS',
  // Basketball
  'point guard': 'PG', 'shooting guard': 'SG', 'small forward': 'SF',
  'power forward': 'PF', 'guard': 'G', 'forward': 'F',
  // Baseball / softball
  'pitcher': 'P', 'catcher': 'C', 'first base': '1B', 'second base': '2B',
  'shortstop': 'SS', 'third base': '3B', 'left field': 'LF',
  'center field': 'CF', 'right field': 'RF', 'designated hitter': 'DH',
  'outfield': 'OF', 'infield': 'IF', 'utility': 'UT',
  // Soccer
  'goalkeeper': 'GK', 'keeper': 'GK', 'centre back': 'CB',
  'full back': 'FB', 'midfielder': 'CM', 'midfield': 'CM',
  'striker': 'ST', 'forward': 'ST',
}

export function normalisePosition(raw) {
  if (!raw) return ''
  const lower = String(raw).trim().toLowerCase()
  return POSITION_ALIASES[lower] || raw.trim()
}

export function getPositionsForSport(sportId) {
  if (!sportId) return []
  return POSITIONS_BY_SPORT[sportId.toLowerCase()] || []
}
