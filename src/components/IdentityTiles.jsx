/**
 * IdentityTiles — Three-slot identity triptych for the MyWalls hub.
 *
 *   ┌────────┐  ┌────────┐  ┌────────┐
 *   │ NUMBER │  │  CITY  │  │  HERO  │
 *   │   18   │  │ BOSTON │  │ BRADY  │
 *   │ blue   │  │ orange │  │ yellow │
 *   └────────┘  └────────┘  └────────┘
 *
 * Each slot has three parts:
 *   1. Top eyebrow     — MY NUMBER / MY CITY / MY HERO
 *   2. Hero-sized value — the big thing the user sees first
 *   3. Bottom eyebrow  — one line of context (state, team, a sliver of meaning)
 *
 * Colour tells you which slot you're in at a glance:
 *   Number → sacred blue   (your identity)
 *   City   → heat orange   (where your teams play)
 *   Hero   → blaze yellow  (the one you'd never trade)
 *
 * Hero is stored as an array (up to 5) for backcompat; this view surfaces
 * the first hero and lets you replace it. The full roster lives elsewhere.
 */

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import './IdentityTiles.css'

export default function IdentityTiles({
  identity,
  citySuggestions,
  onSaveField,
  onSaveHero,
}) {
  const { number, city, heroes } = identity
  const hero = heroes && heroes.length ? heroes[0] : null

  return (
    <section className="id-row" aria-label="My identity">
      <NumberSlot value={number} onSave={v => onSaveField('number', v)} />
      <CitySlot   value={city}   suggestions={citySuggestions} onSave={v => onSaveField('city', v)} />
      <HeroSlot   value={hero}   onSave={onSaveHero} />
    </section>
  )
}

// ── Shared slot shell ──────────────────────────────────────────────────────

function Slot({ variant, label, subLabel, filled, interactive, children, onClick, ariaLabel }) {
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
      {subLabel && <span className="id-slot__sublabel">{subLabel}</span>}
    </Tag>
  )
}

// ── Slot 1: Number (blue) ──────────────────────────────────────────────────

function NumberSlot({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')
  useEffect(() => { setDraft(value || '') }, [value])

  function commit() {
    const trimmed = draft.trim().replace(/[^0-9]/g, '').slice(0, 2)
    onSave(trimmed || null)
    setEditing(false)
  }

  const sub = value ? 'THE ONE YOU\u2019D WEAR' : 'PICK A NUMBER'

  if (editing) {
    return (
      <Slot variant="number" label="MY NUMBER" subLabel={sub} filled>
        <input
          className="id-slot__input id-slot__input--big"
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
      <Slot variant="number" label="MY NUMBER" subLabel={sub} filled={false} interactive
            onClick={() => setEditing(true)} ariaLabel="Set my number">
        <Plus size={22} strokeWidth={2.5} className="id-slot__plus" />
      </Slot>
    )
  }

  return (
    <Slot variant="number" label="MY NUMBER" subLabel={sub} filled interactive
          onClick={() => setEditing(true)} ariaLabel={`Edit my number (${value})`}>
      <span className="id-slot__value">{value}</span>
    </Slot>
  )
}

// ── Slot 2: City (orange) ──────────────────────────────────────────────────

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

  const sub = value ? 'WHERE YOUR TEAMS PLAY' : 'PICK A CITY'

  if (editing) {
    return (
      <Slot variant="city" label="MY CITY" subLabel={sub} filled>
        <input
          className="id-slot__input id-slot__input--big"
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
      <Slot variant="city" label="MY CITY" subLabel={sub} filled={false} interactive
            onClick={() => setEditing(true)} ariaLabel="Set my city">
        <Plus size={22} strokeWidth={2.5} className="id-slot__plus" />
      </Slot>
    )
  }

  return (
    <Slot variant="city" label="MY CITY" subLabel={sub} filled interactive
          onClick={() => setEditing(true)} ariaLabel={`Edit my city (${value})`}>
      <span className="id-slot__value">{value}</span>
    </Slot>
  )
}

// ── Slot 3: Hero (yellow) ──────────────────────────────────────────────────

function HeroSlot({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')
  useEffect(() => { setDraft(value || '') }, [value])

  function commit() {
    const next = draft.trim().slice(0, 24)
    onSave(next || null)
    setEditing(false)
  }

  const sub = value ? 'THE ONE YOU\u2019D NEVER TRADE' : 'PICK A LEGEND'

  if (editing) {
    return (
      <Slot variant="hero" label="MY HERO" subLabel={sub} filled>
        <input
          className="id-slot__input id-slot__input--big"
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, 24))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={commit}
          placeholder="Your hero"
          autoFocus
        />
      </Slot>
    )
  }

  if (!value) {
    return (
      <Slot variant="hero" label="MY HERO" subLabel={sub} filled={false} interactive
            onClick={() => setEditing(true)} ariaLabel="Set my hero">
        <Plus size={22} strokeWidth={2.5} className="id-slot__plus" />
      </Slot>
    )
  }

  return (
    <Slot variant="hero" label="MY HERO" subLabel={sub} filled interactive
          onClick={() => setEditing(true)} ariaLabel={`Edit my hero (${value})`}>
      <span className="id-slot__value">{value}</span>
    </Slot>
  )
}
