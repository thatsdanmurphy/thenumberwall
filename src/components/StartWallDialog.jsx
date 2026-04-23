/**
 * StartWallDialog — full-screen dialog for starting a new team wall
 * from a pipeline path link. Reuses .tnw-overlay, .tw-confirm, .tw-add,
 * .tnw-input, PositionPicker — zero new primitives.
 *
 * One atomic action: creates team wall + legend ghost seed + user's
 * first crowd entry. If they cancel, nothing is created.
 *
 * Props:
 *   school   — full school name (e.g. "Junipero Serra High School")
 *   location — town/state (e.g. "San Mateo, CA")
 *   type     — 'highSchool' | 'college'
 *   sport    — sport slug from the legend entry (e.g. 'football')
 *   legendName   — name of the legend whose card triggered this
 *   legendNumber — jersey number of that legend on the Number Wall
 *   onClose  — callback to dismiss
 *   onCreated — callback({ schoolSlug, sport }) after wall is created
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader } from 'lucide-react'
import PositionPicker from './PositionPicker.jsx'
import { createTeamWall, addTeamEntry } from '../lib/teamWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import { track } from '@vercel/analytics'

function schoolToSlug(name) {
  return (name || '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function locationToTownState(loc) {
  if (!loc) return { town: '', state: '' }
  const parts = loc.split(',').map(s => s.trim())
  return { town: parts[0] || '', state: parts[1] || '' }
}

export default function StartWallDialog({
  school,
  location,
  type,
  sport,
  legendName,
  legendNumber,
  onClose,
  onCreated,
}) {
  const [name, setName]         = useState('')
  const [position, setPosition] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [funFact, setFunFact]   = useState('')
  const [wentPro, setWentPro]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState(null)

  const orgType = type === 'highSchool' ? 'public_hs' : 'college'
  const { town, state } = locationToTownState(location)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || submitting) return

    const nameCheck = checkProfanity(name)
    if (!nameCheck.clean) { setError(nameCheck.reason); return }
    if (funFact) {
      const factCheck = checkProfanity(funFact)
      if (!factCheck.clean) { setError(factCheck.reason); return }
    }

    setSubmitting(true)
    setError(null)

    try {
      const slug = schoolToSlug(school)

      // 1. Create the team wall
      const wall = await createTeamWall({
        school,
        existingSchoolSlug: null,
        orgType,
        town,
        state,
        sport: sport || 'football',
        colorPrimary: 'orange', // default — creator can change later
      })

      if (!wall?.id) throw new Error('Wall creation failed')

      // 2. Add the legend as a ghost seed (if we have info)
      if (legendName && legendNumber) {
        try {
          await addTeamEntry(wall.id, {
            number: legendNumber,
            name: legendName,
            position: null,
            funFact: null,
            wentPro: true,
          })
        } catch {
          // Non-fatal — wall still created, legend seed is nice-to-have
        }
      }

      // 3. Add the user's first crowd entry
      await addTeamEntry(wall.id, {
        number: null, // they didn't pick a number yet
        name: name.trim(),
        gradYear: gradYear ? Number(gradYear) : null,
        position: position.trim() || null,
        funFact: funFact.trim() || null,
        wentPro,
      })

      try {
        track('wall_started_from_pipeline', {
          school,
          type,
          sport,
          legendName,
        })
      } catch {}

      if (onCreated) {
        onCreated({ schoolSlug: wall.school_slug || slug, sport: wall.sport || sport })
      }
    } catch (err) {
      console.error('StartWallDialog error:', err)
      setError(err?.message || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="tnw-overlay" style={{ zIndex: 520 }} onClick={onClose}>
      <div
        className="tw-confirm"
        style={{ maxWidth: 360, padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        {/* School context */}
        <div className="start-wall__school-row">
          <svg className="start-wall__school-icon" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {type === 'highSchool'
              ? <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              : <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" /></>
            }
          </svg>
          <div>
            <div className="start-wall__school-name">{school}</div>
            {location && <div className="start-wall__school-loc">{location}</div>}
          </div>
        </div>

        <h3 className="tw-confirm__title">Know someone who played here?</h3>
        <p className="tw-confirm__body">
          Add a name to start this wall. You&rsquo;ll be the first.
        </p>

        <form className="tw-add" onSubmit={handleSubmit} style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
          <span className="tw-add__label">ADD PLAYER</span>
          {error && <span className="tw-add__error">{error}</span>}

          <input
            type="text"
            className="tnw-input tw-add__input"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="tw-add__row">
            <PositionPicker sport={sport} value={position} onChange={setPosition} />
            <input
              type="text"
              className="tnw-input tw-add__input tw-add__input--half"
              placeholder="Grad year"
              value={gradYear}
              onChange={e => setGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
            />
          </div>
          <input
            type="text"
            className="tnw-input tw-add__input"
            placeholder="Fun fact (optional)"
            value={funFact}
            onChange={e => setFunFact(e.target.value.slice(0, 140))}
            maxLength={140}
          />
          <label className="tw-add__toggle">
            <input type="checkbox" checked={wentPro} onChange={e => setWentPro(e.target.checked)} />
            <span>Went pro</span>
          </label>

          <div className="tw-confirm__actions">
            <button
              type="button"
              className="tnw-btn tnw-btn--ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tnw-btn tnw-btn--secondary tw-add__submit"
              disabled={!name.trim() || submitting}
            >
              {submitting ? <Loader size={12} className="tw-add__spinner" /> : 'Start this wall'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
