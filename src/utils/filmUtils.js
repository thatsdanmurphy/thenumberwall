// filmUtils.js — shared film helpers used by ReelWallPage + PlayerPanel
// Kept here to avoid circular dependency (ReelWallPage → PlayerPanel → ReelWallPage)

/**
 * filmGroup — maps any raw Film field string to a canonical film ID.
 * Must stay in sync with the FILMS array ids in ReelWallPage.jsx.
 */
export function filmGroup(filmStr) {
  if (!filmStr) return null
  if (filmStr === 'Space Jam') return 'Space Jam'
  if (filmStr.includes('Mighty Ducks') || filmStr.startsWith('D2') || filmStr.startsWith('D3')) return 'Mighty Ducks'
  if (filmStr.includes('Little Giants'))         return 'Little Giants'
  if (filmStr.includes('The Natural'))           return 'The Natural'
  if (filmStr.includes('Bull Durham'))           return 'Bull Durham'
  if (filmStr.includes('Remember the Titans'))   return 'Remember the Titans'
  if (filmStr.includes('Major League'))          return 'Major League'
  if (filmStr.includes('Hoosiers'))              return 'Hoosiers'
  if (filmStr.includes('League of Their Own'))   return 'A League of Their Own'
  if (filmStr.includes('Hardball'))              return 'Hardball'
  if (filmStr.includes('Replacements'))          return 'The Replacements'
  if (filmStr.includes('Varsity Blues'))         return 'Varsity Blues'
  if (filmStr.includes('Friday Night Lights'))   return 'Friday Night Lights'
  if (filmStr.includes('Slap Shot'))             return 'Slap Shot'
  if (filmStr.includes('Bad News Bears'))        return 'Bad News Bears'
  if (filmStr.includes('Ted Lasso'))             return 'Ted Lasso'
  if (filmStr.includes('Big Green'))             return 'Big Green'
  return null
}

/**
 * filmBadgeLabel — display string for a film badge pill.
 * Trims long franchise strings ("The Mighty Ducks / D2 / D3" → "The Mighty Ducks").
 */
export function filmBadgeLabel(filmStr) {
  if (!filmStr) return null
  const trimmed = filmStr.split('/')[0].trim()
  return trimmed.length > 24 ? trimmed.slice(0, 22) + '…' : trimmed
}
