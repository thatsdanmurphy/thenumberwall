/**
 * SubmitLegend — inline form for suggesting a legend on the main / city walls.
 * POSTs to a Google Apps Script web app that appends to a Google Sheet.
 *
 * Props:
 *   number   – jersey number (pre-filled, read-only)
 *   wall     – 'global' | 'boston' | 'newyork' etc.
 *   onClose  – callback to collapse the form
 */

import { useState } from 'react'
import { checkProfanity } from '../lib/profanityFilter.js'
import './SubmitLegend.css'

const SUBMIT_URL = import.meta.env.VITE_SUBMIT_LEGEND_URL

export default function SubmitLegend({ number, wall = 'global', onClose }) {
  const [name, setName]     = useState('')
  const [sport, setSport]   = useState('')
  const [team, setTeam]     = useState('')
  const [reason, setReason] = useState('')
  const [error, setError]   = useState(null)
  const [sending, setSending] = useState(false)
  const [done, setDone]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // — validation —
    if (!name.trim()) { setError('Name is required.'); return }
    const nameCheck = checkProfanity(name)
    if (!nameCheck.clean) { setError(nameCheck.reason); return }
    if (reason) {
      const reasonCheck = checkProfanity(reason)
      if (!reasonCheck.clean) { setError(reasonCheck.reason); return }
    }

    if (!SUBMIT_URL) {
      setError('Submissions are not configured yet.')
      return
    }

    setSending(true)
    try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },   // avoid CORS preflight
        body: JSON.stringify({
          wall,
          number: String(number),
          name:   name.trim(),
          sport:  sport.trim(),
          team:   team.trim(),
          reason: reason.trim(),
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Submission failed')
      setDone(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong — try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="submit-legend submit-legend--done">
        <span className="submit-legend__check">✓</span>
        <span className="submit-legend__done-text">Submitted for review</span>
        <button className="submit-legend__close" onClick={onClose}>Close</button>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────
  return (
    <form className="submit-legend" onSubmit={handleSubmit}>
      <div className="submit-legend__header">
        <span className="submit-legend__title">Suggest a Legend for #{number}</span>
        <button type="button" className="submit-legend__close" onClick={onClose}>✕</button>
      </div>

      <input
        className="submit-legend__input"
        placeholder="Player name *"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={80}
        autoFocus
      />
      <div className="submit-legend__row">
        <input
          className="submit-legend__input submit-legend__input--half"
          placeholder="Sport"
          value={sport}
          onChange={e => setSport(e.target.value)}
          maxLength={40}
        />
        <input
          className="submit-legend__input submit-legend__input--half"
          placeholder="Team"
          value={team}
          onChange={e => setTeam(e.target.value)}
          maxLength={60}
        />
      </div>
      <textarea
        className="submit-legend__input submit-legend__textarea"
        placeholder="Why do they belong on the wall?"
        value={reason}
        onChange={e => setReason(e.target.value)}
        maxLength={280}
        rows={2}
      />

      {error && <span className="submit-legend__error">{error}</span>}

      <button
        type="submit"
        className="submit-legend__submit"
        disabled={sending || !name.trim()}
      >
        {sending ? 'Sending…' : 'Submit'}
      </button>
    </form>
  )
}
