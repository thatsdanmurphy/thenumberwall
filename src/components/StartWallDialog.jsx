/**
 * StartWallDialog — dialog for starting a new team wall from a pipeline link.
 * Uses the Modal primitive for consistent overlay/close/animation behavior.
 *
 * One atomic action: creates team wall + legend ghost seed + user's
 * first crowd entry. If they cancel, nothing is created.
 */

import { useState } from 'react'
import { Loader } from 'lucide-react'
import Modal from './Modal.jsx'
import PositionPicker from './PositionPicker.jsx'
import { createTeamWall, addTeamEntry } from '../lib/teamWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import { trackEvent } from '../lib/analytics.js'
import './StartWallDialog.css'

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
      const wall = await createTeamWall({
        school,
        existingSchoolSlug: null,
        orgType,
        town,
        state,
        sport: sport || 'football',
        colorPrimary: 'orange',
      })

      if (!wall?.id) throw new Error('Wall creation failed')

      if (legendName && legendNumber) {
        try {
          await addTeamEntry(wall.id, {
            number: legendNumber,
            name: legendName,
            position: null,
            funFact: null,
            wentPro: true,
          })
        } catch {}
      }

      await addTeamEntry(wall.id, {
        number: null,
        name: name.trim(),
        gradYear: gradYear ? Number(gradYear) : null,
        position: position.trim() || null,
        funFact: funFact.trim() || null,
        wentPro,
      })

      trackEvent('wall_created', { school, type, sport, legendName, context: 'pipeline' })

      if (onCreated) {
        onCreated({ schoolSlug: wall.school_slug, sport: wall.sport || sport })
      }
    } catch (err) {
      console.error('StartWallDialog error:', err)
      setError(err?.message || 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} maxWidth={400} ariaLabel="Start a team wall">
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

      <h3 className="tnw-modal__title">Know someone who played here?</h3>
      <p className="tnw-modal__subtitle">Add a name to start this wall. You'll be the first.</p>

      <form className="tw-add" onSubmit={handleSubmit} style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
        <span className="tw-add__label">ADD PLAYER</span>
        {error && <span className="tw-add__error">{error}</span>}

        <input type="text" className="tnw-input tw-add__input" placeholder="Name"
          value={name} onChange={e => setName(e.target.value)} autoFocus />
        <div className="tw-add__row">
          <PositionPicker sport={sport} value={position} onChange={setPosition} />
          <input type="text" className="tnw-input tw-add__input tw-add__input--half" placeholder="Grad year"
            value={gradYear} onChange={e => setGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            inputMode="numeric" maxLength={4} />
        </div>
        <input type="text" className="tnw-input tw-add__input" placeholder="Fun fact (optional)"
          value={funFact} onChange={e => setFunFact(e.target.value.slice(0, 140))} maxLength={140} />
        <label className="tw-add__toggle">
          <input type="checkbox" checked={wentPro} onChange={e => setWentPro(e.target.checked)} />
          <span>Went pro</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <button type="button" className="tnw-btn tnw-btn--ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="tnw-btn tnw-btn--secondary tw-add__submit"
            disabled={!name.trim() || submitting}>
            {submitting ? <Loader size={12} className="tw-add__spinner" /> : 'Start this wall'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
