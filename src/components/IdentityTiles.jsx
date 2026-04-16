/**
 * IdentityTiles — Three-slot identity triptych for the MyWalls hub.
 *
 *   ┌────────┐  ┌────────┐  ┌────────┐
 *   │ NUMBER │  │  CITY  │  │  HERO  │
 *   │   18   │  │ BOSTON │  │   12   │
 *   │ blue   │  │ orange │  │ BRADY  │
 *   └────────┘  └────────┘  └────────┘
 *
 * Each slot has three parts:
 *   1. Top eyebrow     — MY NUMBER / MY CITY / MY HERO
 *   2. Hero-sized value — the big thing the user sees first
 *   3. Bottom eyebrow  — one line of context (descriptor OR, for HERO, the name)
 *
 * Hero is special: the big value is the jersey number and the sub-line is
 * the player's name. Both are editable — clicking either opens a single
 * search input that accepts a number OR a name and resolves against
 * wallData via searchHeroes().
 *
 * Colour:
 *   Number → sacred blue   (your identity)
 *   City   → heat orange   (where your teams play)
 *   Hero   → blaze yellow  (the one you'd never trade)
 */

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { searchHeroes } from '../data/index.js'
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

function Slot({ variant, label, subLabel, filled, interactive, children, onClick, ariaLabel, modifier }) {
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      className={`id-slot id-slot--${variant}${filled ? ' id-slot--filled' : ' id-slot--empty'}${modifier ? ' ' + modifier : ''}`}
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

  const sub = value ? 'THE ONE THAT\u2019S MINE' : 'PICK A NUMBER'

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
          aria-label="Enter your jersey number"
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
// `id-slot--autosize` lets the cell grow wider than 1fr when the value is
// long (Edmonton, Nashville, Indianapolis) rather than clipping with an
// ellipsis. The triptych still reads as three; the balance just shifts.

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

  const sub = value ? 'WHERE MY TEAMS PLAY' : 'PICK A CITY'
  // City cells stay at 1fr — no grid reflow. Long words (Nashville,
  // Indianapolis) shrink the value via `id-slot--shrink` instead of
  // widening the tile. Keeps the triptych balanced and the sublabel
  // hint text uncovered.
  const len = (editing ? draft : value || '').length
  const modifier =
    len > 10 ? 'id-slot--shrink-xs' :
    len > 7  ? 'id-slot--shrink-sm' :
    len > 5  ? 'id-slot--shrink'    : ''

  if (editing) {
    return (
      <Slot variant="city" label="MY CITY" subLabel={sub} filled modifier={modifier}>
        <input
          className="id-slot__input id-slot__input--big"
          type="text"
          value={draft}
          onChange={e => onDraftChange(e.target.value.slice(0, 24))}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={() => setTimeout(() => commit(), 150)}
          placeholder="My city"
          autoFocus
          aria-label="Enter your city"
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
    <Slot variant="city" label="MY CITY" subLabel={sub} filled interactive modifier={modifier}
          onClick={() => setEditing(true)} ariaLabel={`Edit my city (${value})`}>
      <span className="id-slot__value">{value}</span>
    </Slot>
  )
}

// ── Slot 3: Hero (yellow) ──────────────────────────────────────────────────
// Big value is the jersey number; the bottom sub-line carries the player's
// name. Editing opens ONE input that searches wallData bi-directionally —
// typing "12" finds Brady, typing "brady" finds #12. Picking a suggestion
// commits both number and name at once.

function HeroSlot({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const [results, setResults] = useState([])

  const heroNumber = value?.number || null
  const heroName   = value?.name   || null

  function openEdit() {
    setDraft(heroName || '')
    setResults(heroName ? searchHeroes(heroName) : [])
    setEditing(true)
  }

  function onDraftChange(v) {
    setDraft(v)
    setResults(searchHeroes(v))
  }

  function commitPick(pick) {
    onSave(pick ? { name: pick.name, number: pick.number } : null)
    setEditing(false)
    setResults([])
  }

  function commitFree() {
    // Free-text fallback: if the draft is a plain number we store just the
    // number; if text, we store as name with unknown number. Picking from
    // the dropdown is the preferred path.
    const q = draft.trim().slice(0, 40)
    if (!q) { commitPick(null); return }
    const isNum = /^\d{1,2}$/.test(q)
    if (isNum) {
      onSave({ name: heroName || q, number: q })
    } else {
      onSave({ name: q, number: heroNumber })
    }
    setEditing(false)
    setResults([])
  }

  const sub = heroName ? heroName.toUpperCase() : 'THE ONE I\u2019D NEVER TRADE'
  const hasValue = !!(heroNumber || heroName)

  if (editing) {
    return (
      <Slot variant="hero" label="MY HERO" subLabel={sub} filled>
        <input
          className="id-slot__input id-slot__input--big"
          type="text"
          value={draft}
          aria-label="Search for your hero player"
          onChange={e => onDraftChange(e.target.value.slice(0, 40))}
          onKeyDown={e => {
            if (e.key === 'Enter') { if (results[0]) commitPick(results[0]); else commitFree() }
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={() => setTimeout(() => { if (editing) commitFree() }, 180)}
          placeholder="00"
          autoFocus
        />
        {results.length > 0 && (
          <div className="id-slot__suggestions">
            {results.map(r => (
              <button
                key={`${r.number}-${r.name}`}
                className="id-slot__suggestion id-slot__suggestion--hero"
                onMouseDown={e => { e.preventDefault(); commitPick(r) }}
              >
                <span className="id-slot__suggestion-num">#{r.number}</span>
                <span className="id-slot__suggestion-name">{r.name}</span>
                {r.team && <span className="id-slot__suggestion-team">{r.team}</span>}
              </button>
            ))}
          </div>
        )}
      </Slot>
    )
  }

  if (!hasValue) {
    return (
      <Slot variant="hero" label="MY HERO" subLabel="PICK A LEGEND" filled={false} interactive
            onClick={openEdit} ariaLabel="Set my hero">
        <Plus size={22} strokeWidth={2.5} className="id-slot__plus" />
      </Slot>
    )
  }

  return (
    <Slot variant="hero" label="MY HERO" subLabel={sub} filled interactive
          onClick={openEdit} ariaLabel={`Edit my hero (${heroName || heroNumber})`}
          modifier="id-slot--hero-filled">
      <span className="id-slot__value">{heroNumber || '?'}</span>
    </Slot>
  )
}
