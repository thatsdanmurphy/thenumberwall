/**
 * City validation — lightweight list of major sports cities worldwide.
 * Used for autocomplete suggestions, not hard blocking.
 * Includes US/Canada pro sports cities + major international football cities.
 */

const CITIES = [
  // NFL / NBA / MLB / NHL — US + Canada
  'Atlanta', 'Baltimore', 'Boston', 'Buffalo', 'Charlotte', 'Chicago',
  'Cincinnati', 'Cleveland', 'Columbus', 'Dallas', 'Denver', 'Detroit',
  'Green Bay', 'Houston', 'Indianapolis', 'Jacksonville', 'Kansas City',
  'Las Vegas', 'Los Angeles', 'Memphis', 'Miami', 'Milwaukee', 'Minneapolis',
  'Nashville', 'New Orleans', 'New York', 'Oklahoma City', 'Orlando',
  'Philadelphia', 'Phoenix', 'Pittsburgh', 'Portland', 'Raleigh',
  'Sacramento', 'Salt Lake City', 'San Antonio', 'San Diego', 'San Francisco',
  'Seattle', 'St. Louis', 'Tampa', 'Washington DC',
  // Canada
  'Calgary', 'Edmonton', 'Montreal', 'Ottawa', 'Toronto', 'Vancouver', 'Winnipeg',
  // Premier League / La Liga / Serie A / Bundesliga / Ligue 1
  'London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds', 'Newcastle',
  'Madrid', 'Barcelona', 'Seville', 'Valencia',
  'Milan', 'Rome', 'Turin', 'Naples',
  'Munich', 'Dortmund', 'Berlin', 'Frankfurt',
  'Paris', 'Lyon', 'Marseille',
  // South America
  'Buenos Aires', 'São Paulo', 'Rio de Janeiro', 'Bogotá', 'Lima',
  // Other major
  'Tokyo', 'Sydney', 'Melbourne', 'Auckland', 'Dublin', 'Glasgow',
  'Lisbon', 'Amsterdam', 'Brussels', 'Copenhagen', 'Stockholm',
  'Mexico City', 'Guadalajara', 'Monterrey',
]

// Lowercase index for matching
const CITY_INDEX = CITIES.map(c => ({ display: c, lower: c.toLowerCase() }))

/**
 * Get city suggestions matching a partial query.
 * Returns up to 5 matches, prioritizing start-of-word matches.
 */
export function getCitySuggestions(query) {
  if (!query || query.length < 2) return []
  const q = query.trim().toLowerCase()

  // Starts-with matches first, then includes
  const starts = CITY_INDEX.filter(c => c.lower.startsWith(q))
  const includes = CITY_INDEX.filter(c => !c.lower.startsWith(q) && c.lower.includes(q))

  return [...starts, ...includes].slice(0, 5).map(c => c.display)
}

/**
 * Check if a city is in our known list (case-insensitive).
 */
export function isKnownCity(city) {
  if (!city) return false
  return CITY_INDEX.some(c => c.lower === city.trim().toLowerCase())
}
