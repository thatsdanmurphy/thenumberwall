/**
 * PositionPicker — sport-aware position selector for team wall forms.
 *
 * Shows canonical position codes for the given sport as a native <select>,
 * which keeps the wall from collecting "LD", "D", "Defense", and "Defence"
 * for the same role. Picks an "Other…" escape hatch that reveals a free
 * text input for obscure positions, multi-role tags, or coaches who track
 * something unusual. Legacy free-text values (from before this picker
 * existed) are preselected in the dropdown if they match after alias
 * normalisation, otherwise they fall into the Other field so nothing
 * silently drops.
 */

import { useState, useEffect } from 'react'
import { getPositionsForSport, normalisePosition } from '../data/sports.js'

export default function PositionPicker({ sport, value, onChange, className = '' }) {
  const positions = getPositionsForSport(sport)
  const normalised = normalisePosition(value)
  const isKnown = positions.includes(normalised)

  // "Other" mode shows a free-text input so an unusual value isn't lost.
  // Keep a local flag rather than deriving it each render — otherwise
  // clearing the text briefly flips the select back off of "Other".
  const [otherMode, setOtherMode] = useState(!!value && !isKnown)
  useEffect(() => {
    if (value && !isKnown) setOtherMode(true)
  }, [value, isKnown])

  function handleSelect(e) {
    const v = e.target.value
    if (v === '__other__') {
      setOtherMode(true)
      onChange('')
    } else {
      setOtherMode(false)
      onChange(v)
    }
  }

  if (otherMode) {
    return (
      <div className={`tw-position-picker ${className}`}>
        <input
          type="text"
          className="tnw-input tw-add__input tw-add__input--half"
          placeholder="Position"
          value={value || ''}
          onChange={e => onChange(e.target.value.slice(0, 20))}
          maxLength={20}
        />
        <button
          type="button"
          className="tw-position-picker__back"
          onClick={() => { setOtherMode(false); onChange('') }}
          aria-label="Back to position list"
        >
          Use list
        </button>
      </div>
    )
  }

  if (positions.length === 0) {
    // Unknown sport — fall back to free text so we never block the save.
    return (
      <input
        type="text"
        className={`tnw-input tw-add__input tw-add__input--half ${className}`}
        placeholder="Position"
        value={value || ''}
        onChange={e => onChange(e.target.value.slice(0, 20))}
        maxLength={20}
      />
    )
  }

  return (
    <select
      className={`tnw-input tw-add__input tw-add__input--half tw-position-picker__select ${className}`}
      value={isKnown ? normalised : ''}
      onChange={handleSelect}
    >
      <option value="">Position</option>
      {positions.map(p => (
        <option key={p} value={p}>{p}</option>
      ))}
      <option value="__other__">Other…</option>
    </select>
  )
}
