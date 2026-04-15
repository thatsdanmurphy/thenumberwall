/**
 * IdentityTiles — Two-slot identity row for the MyWalls hub.
 *
 *   ┌────┐ ┌──────────────┐
 *   │ 18 │ │ BROOKLINE,MA │
 *   └────┘ └──────────────┘
 *    square      field
 *
 * Number is one short value → square tile.
 * City is one medium-wide value → wide field.
 *
 * Slots share `--id-row-h` so the row reads as one object even though each
 * slot takes the shape its data asks for. Hero was part of this row in an
 * earlier pass — cut because the wall itself is where heroes live. Identity
 * is just number + city; the walls below it are how you express the rest.
 *
 * Voice: "my" throughout. MY NUMBER · MY CITY.
 */

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import './IdentityTiles.css'

export default function IdentityTiles({
  identity,
  citySuggestions,
  onSaveField,
}) {
  const { number, city } = identity

  return (
    <section className="id-row" aria-label="My identity">
      <NumberSlot value={number} onSave={v => onSaveField('number', v)} />
      <CitySlot   value={city}   suggestions={citySuggestions} onSave={v => onSaveField('city', v)} />
    </section>
  )
}

// ── Shared slot shell ──────────────────────────────────────────────────────
// Both slots render through this so borders, radii, hover, label treatment
// stay perfectly in sync. Variant drives sizing + accent color.

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
