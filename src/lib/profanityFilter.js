/**
 * THE NUMBER WALL — Profanity Filter
 * Lightweight client-side check for wall names and slugs.
 * Catches common slurs and offensive terms. Not exhaustive —
 * a determined troll can always get around it — but stops
 * casual profanity from showing up in shareable URLs.
 */

// Lowercase terms to block. Keep sorted for readability.
// This list covers the obvious stuff without being encyclopedic.
const BLOCKED = new Set([
  'anal', 'anus', 'arse', 'ass', 'asshole',
  'bastard', 'bitch', 'bollocks', 'boob', 'butt',
  'chink', 'cock', 'coon', 'crap', 'cum', 'cunt',
  'damn', 'dick', 'dildo', 'dyke',
  'fag', 'faggot', 'fuck', 'fucker', 'fuckin', 'fucking',
  'goddamn', 'gringo',
  'hell', 'homo',
  'jizz',
  'kike',
  'lmao', 'lmfao',
  'muff',
  'negro', 'nigga', 'nigger', 'nig',
  'paki', 'penis', 'piss', 'poop', 'porn', 'prick', 'pussy',
  'queer',
  'rape', 'rapist', 'retard',
  'scrotum', 'sex', 'shit', 'slut', 'smegma', 'spic', 'spick',
  'tit', 'tits', 'twat',
  'vagina',
  'wank', 'wetback', 'whore', 'wtf',
])

/**
 * Check if a name contains profanity.
 * Splits on word boundaries and checks each token.
 * Also checks the full slug (joined with no separators)
 * for embedded blocked words.
 *
 * @param {string} name — the raw wall name (e.g. "Danny's Wall")
 * @returns {{ clean: boolean, reason?: string }}
 */
export function checkProfanity(name) {
  if (!name) return { clean: true }

  const lower = name.toLowerCase().trim()

  // Split into tokens on non-alphanumeric boundaries
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean)

  for (const token of tokens) {
    if (BLOCKED.has(token)) {
      return { clean: false, reason: 'That name contains language we can\'t allow.' }
    }
  }

  // Also check for blocked words embedded in the slug form (no spaces/special chars)
  const slug = lower.replace(/[^a-z0-9]/g, '')
  for (const word of BLOCKED) {
    if (word.length >= 4 && slug.includes(word)) {
      return { clean: false, reason: 'That name contains language we can\'t allow.' }
    }
  }

  return { clean: true }
}
