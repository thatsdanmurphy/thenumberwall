/**
 * AddEntry — modal for adding a player to a team wall.
 * Anyone can add anyone. Required: number, name, grad year.
 * Optional: position, fun fact (140 char max).
 */

import { useState, useEffect } from 'react'
import { X, Loader } from 'lucide-react'
import { addTeamEntry } from '../lib/teamWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import './AddEntry.css'

export default function AddEntry({ open, onClose, onAdded, wallId, wallYear, prefillNumber }) {
  const [number, setNumber]       = useState('')
  const [name, setName]           = useState('')
  const [gradYear, setGradYear]   = useState('')
  const [position, setPosition]   = useState('')
  const [funFact, setFunFact]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (open && prefillNumber != null) setNumber(String(prefillNumber))
  }, [open, prefillNumber])

  useEffect(() => {
    if (open && wallYear && !gradYear) setGradYear(String(wallYear))
  }, [open, wallYear])

  useEffect(() => {
    if (!open) {
      setNumber(''); setName(''); setGradYear(''); setPosition(''); setFunFact(''); setError(null)
    }
  }, [open])

  if (!open) return null

  const canSubmit = number.trim() && name.trim() && gradYear

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || submitting) return

    const nameCheck = checkProfanity(name)
    if (!nameCheck.clean) { setError(nameCheck.reason); return }
    const factCheck = checkProfanity(funFact)
    if (!factCheck.clean) { setError(factCheck.reason); return }

    setSubmitting(true)
    setError(null)

    try {
      await addTeamEntry(wallId, {
        number: number.trim(),
        name: name.trim(),
        gradYear: Number(gradYear),
        position: position.trim() || null,
        funFact: funFact.trim() || null,
      })
      onAdded()
    } catch (err) {
      setError('Something went wrong. Try again.')
      console.error('AddEntry error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="tnw-overlay ae-overlay" onClick={onClose}>
      <form className="ae-modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <button type="button" className="ae-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 className="ae-title">ADD A PLAYER</h2>
        <p className="ae-subtitle">Fill in a teammate's number — or your own.</p>

        {error && <p className="ae-error">{error}</p>}

        <div className="ae-fields">
          <div className="ae-row">
            <label className="ae-label ae-label--number">
              <span>#</span>
              <input
                type="text"
                className="tnw-input ae-input--number"
                placeholder="23"
                value={number}
                onChange={e => setNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                maxLength={2}
                autoFocus={!prefillNumber}
              />
            </label>
            <label className="ae-label ae-label--name">
              <span>Name</span>
              <input
                type="text"
                className="tnw-input"
                placeholder="Player name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus={!!prefillNumber}
              />
            </label>
          </div>

          <div className="ae-row">
            <label className="ae-label ae-label--small">
              <span>Grad Year</span>
              <input
                type="text"
                className="tnw-input"
                placeholder={String(wallYear || '2007')}
                value={gradYear}
                onChange={e => setGradYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                maxLength={4}
              />
            </label>
            <label className="ae-label ae-label--small">
              <span>Position <span className="ae-optional">(opt)</span></span>
              <input
                type="text"
                className="tnw-input"
                placeholder="CF"
                value={position}
                onChange={e => setPosition(e.target.value)}
                maxLength={20}
              />
            </label>
          </div>

          <label className="ae-label">
            <span>
              Fun Fact <span className="ae-optional">(opt)</span>
              {funFact.length > 0 && (
                <span className="ae-char-count">{140 - funFact.length}</span>
              )}
            </span>
            <input
              type="text"
              className="tnw-input"
              placeholder="One thing only your teammates would know"
              value={funFact}
              onChange={e => setFunFact(e.target.value.slice(0, 140))}
              maxLength={140}
            />
          </label>
        </div>

        <button
          type="submit"
          className="tnw-btn tnw-btn--primary ae-submit"
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <><Loader size={14} className="ae-spinner" /> Adding…</>
            : 'Add to Wall'
          }
        </button>
      </form>
    </div>
  )
}
