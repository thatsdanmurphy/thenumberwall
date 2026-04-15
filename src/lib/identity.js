/**
 * THE NUMBER WALL — Identity Store
 *
 * localStorage-backed profile that lives at the hub level, independent of
 * any specific wall. Three facets:
 *   - number  : your personal number (string, e.g. "18")
 *   - city    : your city (free text, e.g. "Edmonton")
 *   - heroes  : up to 5 hero names (array of strings, resolved to numbers
 *               via findHeroNumber at render time)
 *
 * Backcompat: earlier versions stored a single hero under IDENTITY_HERO.
 * getIdentity() migrates that legacy value into the heroes array on first
 * read, then leaves it alone. We don't delete the old key — if a user
 * downgrades, they keep their original hero.
 */

import {
  IDENTITY_NUMBER,
  IDENTITY_CITY,
  IDENTITY_HERO,
  IDENTITY_HEROES,
} from './storageKeys.js'

export const MAX_HEROES = 5

export function getIdentity() {
  if (typeof window === 'undefined') {
    return { number: null, city: null, heroes: [] }
  }
  return {
    number: localStorage.getItem(IDENTITY_NUMBER) || null,
    city:   localStorage.getItem(IDENTITY_CITY)   || null,
    heroes: readHeroes(),
  }
}

// Heroes normalise to objects of shape { name, number }. Strings from legacy
// storage become { name: str, number: null } at read time so the UI never
// has to branch.
function normaliseHero(h) {
  if (!h) return null
  if (typeof h === 'string') return { name: h, number: null }
  if (typeof h === 'object' && h.name) {
    return { name: h.name, number: h.number ? String(h.number) : null }
  }
  return null
}

function readHeroes() {
  // Prefer the new array key
  const raw = localStorage.getItem(IDENTITY_HEROES)
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return arr.map(normaliseHero).filter(Boolean).slice(0, MAX_HEROES)
    } catch {
      // fall through to legacy read
    }
  }
  // Legacy: single hero string. If present, seed the array and persist.
  const legacy = localStorage.getItem(IDENTITY_HERO)
  if (legacy) {
    const seeded = [{ name: legacy, number: null }]
    localStorage.setItem(IDENTITY_HEROES, JSON.stringify(seeded))
    return seeded
  }
  return []
}

export function setIdentityField(field, value) {
  if (field === 'number') {
    if (!value) localStorage.removeItem(IDENTITY_NUMBER)
    else        localStorage.setItem(IDENTITY_NUMBER, value)
    return
  }
  if (field === 'city') {
    if (!value) localStorage.removeItem(IDENTITY_CITY)
    else        localStorage.setItem(IDENTITY_CITY, value)
    return
  }
  if (field === 'heroes') {
    // Accepts either an array (set whole) or a single string (append).
    if (Array.isArray(value)) {
      const clean = value.filter(Boolean).slice(0, MAX_HEROES)
      localStorage.setItem(IDENTITY_HEROES, JSON.stringify(clean))
    } else if (typeof value === 'string') {
      const current = readHeroes()
      if (!current.includes(value) && current.length < MAX_HEROES) {
        current.push(value)
        localStorage.setItem(IDENTITY_HEROES, JSON.stringify(current))
      }
    } else if (value === null) {
      localStorage.removeItem(IDENTITY_HEROES)
    }
    return
  }
}

// addHero accepts either a string (name only) or a { name, number } object.
export function addHero(hero) {
  const h = typeof hero === 'string' ? { name: hero, number: null } : hero
  if (!h || !h.name) return
  const heroes = readHeroes()
  if (heroes.some(x => x.name === h.name)) return
  if (heroes.length >= MAX_HEROES) return
  heroes.push({ name: h.name, number: h.number ? String(h.number) : null })
  localStorage.setItem(IDENTITY_HEROES, JSON.stringify(heroes))
}

export function removeHero(hero) {
  const name = typeof hero === 'string' ? hero : hero?.name
  if (!name) return
  const heroes = readHeroes().filter(h => h.name !== name)
  localStorage.setItem(IDENTITY_HEROES, JSON.stringify(heroes))
}

export function updateHero(oldHero, newHero) {
  const oldName = typeof oldHero === 'string' ? oldHero : oldHero?.name
  const next = typeof newHero === 'string' ? { name: newHero, number: null } : newHero
  if (!next || !next.name) return
  const heroes = readHeroes().map(h => h.name === oldName ? { name: next.name, number: next.number ? String(next.number) : null } : h)
  localStorage.setItem(IDENTITY_HEROES, JSON.stringify(heroes))
}
