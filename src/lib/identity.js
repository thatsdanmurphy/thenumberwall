/**
 * THE NUMBER WALL — Identity Store
 * Lightweight localStorage wrapper for the 3 identity fields:
 * your number, your city, your hero (stored as a number).
 * These live at the hub level, not tied to any specific wall.
 */

const KEYS = {
  number: 'tnw_identity_number',
  city:   'tnw_identity_city',
  hero:   'tnw_identity_hero',  // stored as number string
}

export function getIdentity() {
  if (typeof window === 'undefined') return { number: null, city: null, hero: null }
  return {
    number: localStorage.getItem(KEYS.number) || null,
    city:   localStorage.getItem(KEYS.city)   || null,
    hero:   localStorage.getItem(KEYS.hero)   || null,
  }
}

export function setIdentityField(field, value) {
  if (!KEYS[field]) return
  if (value === null || value === '') {
    localStorage.removeItem(KEYS[field])
  } else {
    localStorage.setItem(KEYS[field], value)
  }
}
