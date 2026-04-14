/**
 * IdentityTiles — the top section of the MyWalls hub.
 *
 * Treats user identity the way the rest of the site treats everything else:
 * as tiles on a wall. Three slots:
 *   - Your number: one <WallTile>, your personal glow
 *   - Your city: one wide "tile" using the same visual tokens, text instead
 *     of a digit
 *   - Your heroes: up to 5 tiles, each showing the hero's number. Name
 *     appears as a caption below the row.
 *
 * Click any tile to edit. Empty slots show a dashed "+" tile inviting input.
 *
 * Data model: identity.heroes is an array of names (migrated from legacy
 * single-hero key). See lib/identity.js.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import WallTile from './WallTile.jsx'
import { MAX_HEROES } from '../lib/identity.js'
import './IdentityTiles.css'

/**
 * Resolve a hero name → number via the shared player lookup.
 * Accepts a lookup map from the parent so we don't build it twice.
 */
function resolveHero(name, lookup) {
  if (!name || !lookup) return null
  const q = name.trim().toLowerCase()
  if (lookup[q]) return lookup[q]
  const lastNameMatch = Object.entries(lookup).find(([n]) => {
    const parts = n.split(' ')
    return parts[parts.length - 1] === q
  })
  if (lastNameMatch) return lastNameMatch[1]
  const partial = Object.entries(lookup).find(([n]) => n.includes(q))
  return partial ? partial[1] : null
}

export default function IdentityTiles({
  identity,
  heroLookup,
  heroSuggestions,
  citySuggestions,
  onSaveField,    // (field, value) — field: 'number' | 'city'
  onAddHero,      // (name)
  onUpdateHero,   // (oldName, newName)
  onRemoveHero,   // (name)
}) {
  const { number, city, heroes } = identity

  return (
    <section className="id-tiles" aria-label="Your identity">
      <div className="id-tiles__row">
        {/* ── Your Number ──────────────────────────────────────────── */}
        <div className="id-tiles__slot">
          <EditableNumberTile
            value={number}
            onSave={v => onSaveField('number', v)}
          />
          <span className="id-tiles__caption">YOU</span>
        </div>

        {/* ── Your City ────────────────────────────────────────────── */}
        <div className="id-tiles__slot id-tiles__slot--city">
          <EditableCityCell
            value={city}
            suggestions={citySuggestions}
            onSave={v => onSaveField('city', v)}
          />
          <span className="id-tiles__caption">YOUR CITY</span>
        </div>

        {/* ── Your Heroes ──────────────────────────────────────────── */}
        <div className="id-tiles__slot id-tiles__slot--heroes">
          <HeroesRow
            heroes={heroes}
            heroLookup={heroLookup}
            heroSuggestions={heroSuggestions}
            onAdd={onAddHero}
            onUpdate={onUpdateHero}
            onRemove={onRemoveHero}
          />
          <span className="id-tiles__caption">
            {heroes.length === 0 ? 'YOUR HEROES' : heroes.join(' · ')}
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── Number tile ───────────────────────────────────────────────────────────

function EditableNumberTile({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')

  useEffect(() => { setDraft(value || '') }, [value])

  function commit() {
    const trimmed = draft.trim().replace(/[^0-9]/g, '').slice(0, 2)
    onSave(trimmed || null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="id-tile id-tile--editing">
        <input
          className="id-tile__input"
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={commit}
          placeholder="00"
          autoFocus
          inputMode="numeric"
        />
      </div>
    )
  }

  if (!value) {
    return (
      <button
        className="id-tile id-tile--empty"
        onClick={() => setEditing(true)}
        aria-label="Set your number"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    )
  }

  return (
    <div onClick={() => setEditing(true)} className="id-tile id-tile--wrap">
      <WallTile number={value} entries={[]} isActive={false} onClick={() => setEditing(true)} />
    </div>
  )
}

// ─── City cell (wide, tile-styled text) ───────────────────────────────────

function EditableCityCell({ value, suggestions: suggestionFn, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => { setDraft(value || '') }, [value])

  function commit(override) {
    const next = (override !== undefined ? override : draft).trim().slice(0, 24)
    onSave(next || null)
    setEditing(false)
    setSuggestions([])
  }

  function onDraftChange(v) {
    setDraft(v)
    setSuggestions(suggestionFn ? suggestionFn(v) : [])
  }

  if (editing) {
    return (
      <div className="id-tile id-tile--city id-tile--editing">
        <input
          className="id-tile__input id-tile__input--city"
          type="text"
          value={draft}
          onChange={e => onDraftChange(e.target.value.slice(0, 24))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={() => setTimeout(() => commit(), 150)}
          placeholder="Your city"
          autoFocus
        />
        {suggestions.length > 0 && (
          <div className="id-tile__suggestions">
            {suggestions.map(s => (
              <button
                key={s}
                className="id-tile__suggestion"
                onMouseDown={e => { e.preventDefault(); commit(s) }}
              >{s}</button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!value) {
    return (
      <button
        className="id-tile id-tile--city id-tile--empty"
        onClick={() => setEditing(true)}
        aria-label="Set your city"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    )
  }

  return (
    <button
      className="id-tile id-tile--city id-tile--filled"
      onClick={() => setEditing(true)}
    >
      <span className="id-tile__city-name">{value}</span>
    </button>
  )
}

// ─── Heroes row (up to MAX_HEROES tiles + add button) ─────────────────────

function HeroesRow({ heroes, heroLookup, heroSuggestions, onAdd, onUpdate, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft]   = useState('')
  const [suggestions, setSuggestions] = useState([])

  function commitAdd(value) {
    const name = (value !== undefined ? value : draft).trim()
    if (name) onAdd(name)
    setDraft('')
    setAdding(false)
    setSuggestions([])
  }

  function onDraftChange(v) {
    setDraft(v)
    setSuggestions(heroSuggestions ? heroSuggestions(v) : [])
  }

  return (
    <div className="id-heroes">
      {heroes.map(name => (
        <HeroTile
          key={name}
          name={name}
          number={resolveHero(name, heroLookup)}
          onRemove={() => onRemove(name)}
        />
      ))}

      {adding && (
        <div className="id-tile id-tile--editing id-tile--hero">
          <input
            className="id-tile__input"
            type="text"
            value={draft}
            onChange={e => onDraftChange(e.target.value.slice(0, 40))}
            onKeyDown={e => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') { setAdding(false); setDraft('') } }}
            onBlur={() => setTimeout(() => { if (!draft) setAdding(false) }, 200)}
            placeholder="Name"
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="id-tile__suggestions">
              {suggestions.map(s => (
                <button
                  key={s.name}
                  className="id-tile__suggestion"
                  onMouseDown={e => { e.preventDefault(); commitAdd(s.name) }}
                >
                  <span>{s.name}</span>
                  <span className="id-tile__suggestion-num">#{s.number}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!adding && heroes.length < MAX_HEROES && (
        <button
          className="id-tile id-tile--hero id-tile--empty"
          onClick={() => setAdding(true)}
          aria-label="Add a hero"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

function HeroTile({ name, number, onRemove }) {
  const [hover, setHover] = useState(false)

  if (!number) {
    // Unresolved hero (name doesn't match any player in our data)
    return (
      <div
        className="id-tile id-tile--hero id-tile--unresolved"
        title={`${name} (not found)`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <span className="id-tile__unresolved">?</span>
        {hover && (
          <button className="id-tile__remove" onClick={e => { e.stopPropagation(); onRemove() }} aria-label="Remove hero">
            <X size={10} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="id-tile id-tile--wrap id-tile--hero"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={name}
    >
      <WallTile number={number} entries={[]} isActive={false} onClick={() => {}} />
      {hover && (
        <button className="id-tile__remove" onClick={e => { e.stopPropagation(); onRemove() }} aria-label={`Remove ${name}`}>
          <X size={10} />
        </button>
      )}
    </div>
  )
}
