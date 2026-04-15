/**
 * IdentityTiles — Triptych layout for the MyWalls hub.
 *
 * Three slots sharing a common height, each shaped for its data:
 *   ┌────┐ ┌──────────────┐ ┌─────────────────────────────┐
 *   │ 18 │ │ BROOKLINE,MA │ │ #4 ORR · #77 BOURQUE · +ADD │
 *   └────┘ └──────────────┘ └─────────────────────────────┘
 *    square      field                 roster
 *
 * Why this shape:
 *   Number is one short value → square tile.
 *   City is one medium-wide value → wide field.
 *   Heroes is 1..N pairs of (number, name) → pill-chip roster.
 *
 * Earlier attempts jammed heroes into square tiles and dropped the name
 * underneath as a caption — names didn't fit and containers were different
 * heights. The Triptych lets each slot take its natural shape while a shared
 * `--id-row-height` keeps the row looking like one thing.
 *
 * Voice: "my" throughout. MY NUMBER · MY CITY · MY HEROES.
 */

import { useState, useEffect, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { MAX_HEROES } from '../lib/identity.js'
import './IdentityTiles.css'

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

// "Bobby Orr" → "ORR". Keeps the roster readable at small sizes; full name
// stays in the title attribute for hover disclosure.
function lastNameUpper(full) {
  if (!full) return ''
  const parts = full.trim().split(/\s+/)
  return parts[parts.length - 1].toUpperCase()
}

export default function IdentityTiles({
  identity,
  heroLookup,
  heroSuggestions,
  citySuggestions,
  onSaveField,
  onAddHero,
  onUpdateHero,    // kept in API; not yet wired — remove-and-readd handles rename
  onRemoveHero,
}) {
  const { number, city, heroes } = identity

  return (
    <section className="id-row" aria-label="My identity">
      <NumberSlot value={number} onSave={v => onSaveField('number', v)} />
      <CitySlot   value={city}   suggestions={citySuggestions} onSave={v => onSaveField('city', v)} />
      <HeroesSlot
        heroes={heroes}
        heroLookup={heroLookup}
        heroSuggestions={heroSuggestions}
        onAdd={onAddHero}
        onRemove={onRemoveHero}
      />
    </section>
  )
}

// ── Shared slot shell ──────────────────────────────────────────────────────
// All three slots render through this so borders, radii, hover, label
// treatment stay perfectly in sync. Variant drives sizing + accent color.

function Slot({ variant, label, filled, interactive, children, onClick, ariaLabel }) {
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      className={`id-slot id-slot--${variant}${filled ? ' id-slot--filled' : ' id-slot--empty'}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="id-slot__label">{label}</span>
      <div className="id-slot__body">{children}</div>
    </Tag>
  )
}

// ── Slot 1: Number ─────────────────────────────────────────────────────────

function NumberSlot({ value, onSave }) {
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
      <Slot variant="number" label="MY NUMBER" filled>
        <input
          className="id-slot__input id-slot__input--number"
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={commit}
          placeholder="00"
          autoFocus
          inputMode="numeric"
        />
      </Slot>
    )
  }

  if (!value) {
    return (
      <Slot variant="number" label="MY NUMBER" filled={false} interactive
            onClick={() => setEditing(true)} ariaLabel="Set my number">
        <Plus size={18} strokeWidth={2.5} className="id-slot__plus" />
      </Slot>
    )
  }

  return (
    <Slot variant="number" label="MY NUMBER" filled interactive
          onClick={() => setEditing(true)} ariaLabel={`Edit my number (${value})`}>
      <span className="id-slot__number-value">{value}</span>
    </Slot>
  )
}

// ── Slot 2: City ───────────────────────────────────────────────────────────

function CitySlot({ value, suggestions: suggestionFn, onSave }) {
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
      <Slot variant="city" label="MY CITY" filled>
        <input
          className="id-slot__input id-slot__input--city"
          type="text"
          value={draft}
          onChange={e => onDraftChange(e.target.value.slice(0, 24))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={() => setTimeout(() => commit(), 150)}
          placeholder="Your city"
          autoFocus
        />
        {suggestions.length > 0 && (
          <div className="id-slot__suggestions">
            {suggestions.map(s => (
              <button
                key={s}
                className="id-slot__suggestion"
                onMouseDown={e => { e.preventDefault(); commit(s) }}
              >{s}</button>
            ))}
          </div>
        )}
      </Slot>
    )
  }

  if (!value) {
    return (
      <Slot variant="city" label="MY CITY" filled={false} interactive
            onClick={() => setEditing(true)} ariaLabel="Set my city">
        <span className="id-slot__prompt">+ Add city</span>
      </Slot>
    )
  }

  return (
    <Slot variant="city" label="MY CITY" filled interactive
          onClick={() => setEditing(true)} ariaLabel={`Edit my city (${value})`}>
      <span className="id-slot__city-value">{value}</span>
    </Slot>
  )
}

// ── Slot 3: Heroes roster ──────────────────────────────────────────────────

function HeroesSlot({ heroes, heroLookup, heroSuggestions, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft]   = useState('')
  const [suggestions, setSuggestions] = useState([])
  const inputRef = useRef(null)

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

  const canAddMore = heroes.length < MAX_HEROES
  const isEmpty    = heroes.length === 0 && !adding

  return (
    <Slot variant="heroes"
          label={heroes.length > 0 ? `MY HEROES · ${heroes.length}` : 'MY HEROES'}
          filled={heroes.length > 0}>
      <div className="id-heroes">
        {heroes.map(name => {
          const num = resolveHero(name, heroLookup)
          return (
            <HeroChip
              key={name}
              name={name}
              number={num}
              onRemove={() => onRemove(name)}
            />
          )
        })}

        {adding && (
          <div className="id-chip id-chip--editing">
            <input
              ref={inputRef}
              className="id-chip__input"
              type="text"
              value={draft}
              onChange={e => onDraftChange(e.target.value.slice(0, 40))}
              onKeyDown={e => {
                if (e.key === 'Enter') commitAdd()
                if (e.key === 'Escape') { setAdding(false); setDraft(''); setSuggestions([]) }
              }}
              onBlur={() => setTimeout(() => { if (!draft) { setAdding(false); setSuggestions([]) } }, 200)}
              placeholder="Name"
              autoFocus
            />
            {suggestions.length > 0 && (
              <div className="id-slot__suggestions id-slot__suggestions--chip">
                {suggestions.map(s => (
                  <button
                    key={s.name}
                    className="id-slot__suggestion"
                    onMouseDown={e => { e.preventDefault(); commitAdd(s.name) }}
                  >
                    <span>{s.name}</span>
                    <span className="id-slot__suggestion-num">#{s.number}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!adding && canAddMore && (
          <button
            className={`id-chip id-chip--add${isEmpty ? ' id-chip--add-lead' : ''}`}
            onClick={() => setAdding(true)}
            aria-label="Add a hero"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>{isEmpty ? 'Add a hero' : 'Add'}</span>
          </button>
        )}
      </div>
    </Slot>
  )
}

function HeroChip({ name, number, onRemove }) {
  const display = lastNameUpper(name)
  const unresolved = !number
  return (
    <span
      className={`id-chip id-chip--filled${unresolved ? ' id-chip--unresolved' : ''}`}
      title={name}
    >
      <span className="id-chip__num">{unresolved ? '?' : `#${number}`}</span>
      <span className="id-chip__name">{display}</span>
      <button
        type="button"
        className="id-chip__remove"
        onClick={e => { e.stopPropagation(); onRemove() }}
        aria-label={`Remove ${name}`}
      >
        <X size={10} />
      </button>
    </span>
  )
}
