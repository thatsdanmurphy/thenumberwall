/**
 * seriesTeams.js — Rival grid data for /series page.
 *
 * Defines specific pro team colors by league code, generates heatStyle
 * objects compatible with WallTile's heatStyle/textColor override API,
 * and holds mock roster data until the NHL/NBA APIs are wired (Task #6).
 *
 * Mock roster players are clearly labelled — replace with API calls.
 * The gradient overlap tile uses both teams' colors split at 135°.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** One fake ACTIVE entry — prevents WallTile unwritten state on team tiles */
export const ACTIVE_ENTRY = [{ tier: 'ACTIVE' }]

function rgba(rgb, a) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`
}

/** Standard team tile heat — coloured bg, border, twin-layer glow */
function teamHeat(rgb) {
  return {
    bg:     rgba(rgb, 0.24),
    border: rgba(rgb, 0.68),
    glow:   `0 0 14px ${rgba(rgb, 0.45)}, 0 0 28px ${rgba(rgb, 0.18)}`,
  }
}

/** Brighten rgb for readable number text on dark tile bg */
function teamText(rgb) {
  const br = rgb.map(v => Math.round(Math.min(255, v + (255 - v) * 0.45)))
  return rgba(br, 1)
}

/**
 * Overlap tile — both teams share this number.
 * Smooth left→right gradient blend, dual glow from both team colors.
 * No hard split — the number belongs to both.
 */
export function overlapHeat(aRgb, bRgb) {
  return {
    bg:     `linear-gradient(90deg, ${rgba(aRgb, 0.28)} 0%, ${rgba(bRgb, 0.28)} 100%)`, /* ds:intentional — smooth team blend, no hard split */
    border: 'rgba(255, 255, 255, 0.55)', /* ds:intentional — neutral white border, neither team owns overlap */
    glow:   `0 0 16px ${rgba(aRgb, 0.35)}, 0 0 16px ${rgba(bRgb, 0.35)}`,
    text:   'rgba(255, 255, 255, 0.95)',  /* ds:intentional — white number, above both team colors */
  }
}

// ── Team definitions ─────────────────────────────────────────────────────────

const TEAMS = {
  // NHL
  CAR: {
    code: 'CAR', name: 'Carolina Hurricanes', city: 'Carolina', league: 'nhl',
    rgb:  [204, 0, 0],   /* ds:intentional — Hurricanes red #CC0000 */
  },
  MTL: {
    code: 'MTL', name: 'Montréal Canadiens',  city: 'Montréal', league: 'nhl',
    rgb:  [0, 62, 126],  /* ds:intentional — Canadiens blue #003E7E, primary contrast vs CAR red */
  },
  VGK: {
    code: 'VGK', name: 'Vegas Golden Knights', city: 'Vegas', league: 'nhl',
    rgb:  [180, 151, 90], /* ds:intentional — Golden Knights gold #B4975A */
  },

  // NBA
  NYK: {
    code: 'NYK', name: 'New York Knicks', city: 'New York', league: 'nba',
    rgb:  [0, 107, 182], /* ds:intentional — Knicks blue #006BB6 */
  },
  OKC: {
    code: 'OKC', name: 'Oklahoma City Thunder', city: 'Oklahoma City', league: 'nba',
    rgb:  [239, 59, 36], /* ds:intentional — Thunder orange #EF3B24, contrasts NYK blue */
  },
  SAS: {
    code: 'SAS', name: 'San Antonio Spurs', city: 'San Antonio', league: 'nba',
    rgb:  [196, 206, 212], /* ds:intentional — Spurs silver #C4CED4 */
  },
}

/** Returns { heat: { bg, border, glow }, text } for any team code */
export function getTeamStyle(code) {
  const team = TEAMS[code]
  if (!team) return null
  return {
    heat: teamHeat(team.rgb),
    text: teamText(team.rgb),
    rgb:  team.rgb,
  }
}

export { TEAMS }

// ── Mock rosters — replace with NHL/NBA API calls in Task #6 ─────────────────
// Players listed are confirmed 2024–25 season starters.
// Full active game rosters (~20 skaters per team) will come from the API.

const NHL_ROSTERS = {
  CAR: [
    { number: 20,  name: 'Sebastian Aho',        pos: 'C',  isOnWall: false, series: '3G, 5A (8 pts)' },
    { number: 37,  name: 'Andrei Svechnikov',    pos: 'RW', isOnWall: false, series: '2G, 3A (5 pts)' },
    { number: 88,  name: 'Martin Necas',         pos: 'C',  isOnWall: false, series: '1G, 4A (5 pts)' },
    { number: 82,  name: 'Jesperi Kotkaniemi',   pos: 'C',  isOnWall: false, series: '1G, 2A (3 pts)' },
    { number: 11,  name: 'Jordan Staal',         pos: 'C',  isOnWall: false, series: '0G, 1A (1 pt)'  },
    { number: 14,  name: 'Jaccob Slavin',        pos: 'D',  isOnWall: false, series: '0G, 2A (2 pts)' },
    { number: 26,  name: 'Brady Skjei',          pos: 'D',  isOnWall: false, series: '1G, 1A (2 pts)' },
    { number: 31,  name: 'Frederik Andersen',    pos: 'G',  isOnWall: false, series: '.924 SV%'        },
  ],
  MTL: [
    { number: 14,  name: 'Nick Suzuki',          pos: 'C',  isOnWall: false, series: '2G, 4A (6 pts)' },
    { number: 22,  name: 'Cole Caufield',        pos: 'RW', isOnWall: false, series: '4G, 2A (6 pts)' },
    { number: 20,  name: 'Juraj Slafkovský',     pos: 'LW', isOnWall: false, series: '1G, 3A (4 pts)' },
    { number: 44,  name: 'Joel Armia',           pos: 'RW', isOnWall: false, series: '1G, 0A (1 pt)'  },
    { number: 58,  name: 'David Savard',         pos: 'D',  isOnWall: false, series: '0G, 1A (1 pt)'  },
    { number: 8,   name: 'Mike Matheson',        pos: 'D',  isOnWall: false, series: '0G, 2A (2 pts)' },
    { number: 35,  name: 'Samuel Montembeault',  pos: 'G',  isOnWall: false, series: '.931 SV%'        },
  ],
}

const NBA_ROSTERS = {
  NYK: [
    { number: 11,  name: 'Jalen Brunson',        pos: 'G',  isOnWall: false, series: '31.4 PPG' },
    { number: 32,  name: 'Karl-Anthony Towns',   pos: 'C',  isOnWall: false, series: '22.1 PPG, 11.3 RPG' },
    { number: 8,   name: 'OG Anunoby',           pos: 'SF', isOnWall: false, series: '14.2 PPG' },
    { number: 3,   name: 'Josh Hart',            pos: 'PF', isOnWall: false, series: '9.4 PPG, 9.1 RPG' },
    { number: 25,  name: 'Mikal Bridges',        pos: 'SG', isOnWall: false, series: '16.8 PPG' },
    { number: 0,   name: 'Precious Achiuwa',     pos: 'PF', isOnWall: false, series: '7.2 PPG'  },
  ],
  OKC: [
    { number: 2,   name: 'Shai Gilgeous-Alexander', pos: 'G',  isOnWall: false, series: '29.6 PPG' },
    { number: 8,   name: 'Jalen Williams',           pos: 'SF', isOnWall: false, series: '22.4 PPG' },
    { number: 7,   name: 'Chet Holmgren',            pos: 'C',  isOnWall: false, series: '14.8 PPG, 9.2 RPG' },
    { number: 5,   name: 'Luguentz Dort',            pos: 'SG', isOnWall: false, series: '10.3 PPG' },
    { number: 15,  name: 'Isaiah Joe',               pos: 'G',  isOnWall: false, series: '8.1 PPG'  },
  ],
  SAS: [
    { number: 10,  name: 'Jeremy Sochan',        pos: 'PF', isOnWall: false, series: '14.2 PPG' },
    { number: 5,   name: 'Keldon Johnson',       pos: 'SF', isOnWall: false, series: '16.1 PPG' },
    { number: 1,   name: 'Victor Wembanyama',    pos: 'C',  isOnWall: false, series: '26.4 PPG, 11.8 RPG, 3.6 BPG' },
    { number: 4,   name: 'Devin Vassell',        pos: 'SG', isOnWall: false, series: '18.2 PPG' },
    { number: 12,  name: 'Tre Jones',            pos: 'G',  isOnWall: false, series: '8.4 PPG'  },
  ],
}

export { NHL_ROSTERS, NBA_ROSTERS }

// ── Series matchup definitions ────────────────────────────────────────────────

export const SERIES_MATCHUPS = {
  'stanley-cup': {
    id:          'stanley-cup',
    label:       'Stanley Cup',
    sport:       'nhl',
    status:      'live',   // 'live' | 'upcoming' | 'locked'
    statusLabel: null,
    teamA:       TEAMS.CAR,
    teamB:       TEAMS.MTL,
    seriesState: 'CAR leads 2–1 · Game 4 tonight',
    rostA:       NHL_ROSTERS.CAR,
    rostB:       NHL_ROSTERS.MTL,
  },
  'nba-finals': {
    id:          'nba-finals',
    label:       'NBA Finals',
    sport:       'nba',
    status:      'live',
    statusLabel: null,
    teamA:       TEAMS.NYK,
    teamB:       TEAMS.OKC,   // swap to SAS if they advance
    seriesState: 'Finals begin Jun 3',
    rostA:       NBA_ROSTERS.NYK,
    rostB:       NBA_ROSTERS.OKC,
  },
  'world-cup': {
    id:          'world-cup',
    label:       'World Cup',
    sport:       'soccer',
    status:      'upcoming',
    statusLabel: 'Jun 11',
    teamA:       null,
    teamB:       null,
    seriesState: 'Groups begin Jun 11',
    rostA:       [],
    rostB:       [],
  },
}

export const SERIES_ORDER = ['stanley-cup', 'nba-finals', 'world-cup']
