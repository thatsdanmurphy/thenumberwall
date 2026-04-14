/**
 * CreateTeamWall — Two-step modal for starting a new team wall.
 * Steps: 1) School + location  2) Sport + colors + coach
 *
 * Year is no longer wall-level — it lives on each entry (grad year).
 * One wall per school per sport, accumulates across all years.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Loader } from 'lucide-react'
import { TEAM_COLORS, TEAM_COLOR_KEYS, TEAM_PALETTES } from '../data/teamColors.js'
import { TEAM_SPORTS } from '../data/sports.js'
import { createTeamWall, slugify } from '../lib/teamWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import './CreateTeamWall.css'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

export default function CreateTeamWall({ open, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Step 1
  const [school, setSchool]   = useState('')
  const [city, setCity]       = useState('')
  const [state, setState]     = useState('')

  // Step 2
  const [sport, setSport]                 = useState('')
  const [colorPrimary, setColorPrimary]   = useState('red')
  const [coachName, setCoachName]         = useState('')
  const [coachFunFact, setCoachFunFact]   = useState('')

  if (!open) return null

  const canProceed1 = school.trim() && city.trim() && state
  const canSubmit   = canProceed1 && sport

  function handleNext() {
    setError(null)
    if (step === 1) {
      const check = checkProfanity(school)
      if (!check.clean) { setError(check.reason); return }
      setStep(2)
    }
  }

  function handleBack() {
    setError(null)
    setStep(1)
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      await createTeamWall({
        school: school.trim(),
        city:   city.trim(),
        state,
        sport,
        colorPrimary,
        coachName:    coachName.trim() || null,
        coachFunFact: coachFunFact.trim() || null,
      })

      const slug = slugify(school.trim())
      onClose()
      navigate(`/walls/${slug}/${sport}`)
    } catch (err) {
      if (err?.code === '23505') {
        setError('A wall for this school + sport already exists. Search for it!')
      } else {
        setError('Something went wrong. Try again.')
      }
      console.error('CreateTeamWall error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="tnw-overlay ctw-overlay" onClick={onClose}>
      <div className="ctw-modal" onClick={e => e.stopPropagation()}>
        <button className="ctw-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="ctw-header">
          <span className="ctw-step-label">STEP {step} OF 2</span>
          <h2 className="ctw-title">
            {step === 1 && 'YOUR SCHOOL'}
            {step === 2 && 'YOUR TEAM'}
          </h2>
        </div>

        {error && <p className="ctw-error">{error}</p>}

        {/* ── Step 1: School + Location ─────────────────────── */}
        {step === 1 && (
          <div className="ctw-fields">
            <label className="ctw-label">
              <span>School Name</span>
              <input
                type="text"
                className="tnw-input ctw-input"
                placeholder="Newton North High School"
                value={school}
                onChange={e => setSchool(e.target.value)}
                autoFocus
              />
            </label>
            <label className="ctw-label">
              <span>City</span>
              <input
                type="text"
                className="tnw-input ctw-input"
                placeholder="Newton"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </label>
            <label className="ctw-label">
              <span>State</span>
              <select
                className="ctw-select"
                value={state}
                onChange={e => setState(e.target.value)}
              >
                <option value="">Select state…</option>
                {US_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* ── Step 2: Sport + Colors + Coach ───────────────── */}
        {step === 2 && (
          <div className="ctw-fields">
            <label className="ctw-label">
              <span>Sport</span>
              <select
                className="ctw-select"
                value={sport}
                onChange={e => setSport(e.target.value)}
                autoFocus
              >
                <option value="">Select sport…</option>
                {TEAM_SPORTS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="ctw-label">
              <span>Team Color</span>
              <div className="ctw-color-grid">
                {TEAM_COLOR_KEYS.map(key => {
                  const { label } = TEAM_COLORS[key]
                  const palette = TEAM_PALETTES[key]
                  const swatch = palette[3]
                  return (
                    <button
                      key={key}
                      className={`ctw-color-swatch${colorPrimary === key ? ' ctw-color-swatch--active' : ''}`}
                      style={{
                        background: swatch.bg,
                        border: `2px solid ${colorPrimary === key ? swatch.text : 'transparent'}`,
                        boxShadow: colorPrimary === key ? swatch.glow : 'none',
                      }}
                      onClick={() => setColorPrimary(key)}
                      title={label}
                    >
                      <span style={{ color: swatch.text, fontSize: '0.55rem', fontFamily: 'var(--font-scoreboard)' }}>
                        {label.toUpperCase()}
                      </span>
                    </button>
                  )
                })}
              </div>
            </label>
            <label className="ctw-label">
              <span>Head Coach <span className="ctw-optional">(optional)</span></span>
              <input
                type="text"
                className="tnw-input ctw-input"
                placeholder="Coach name"
                value={coachName}
                onChange={e => setCoachName(e.target.value)}
              />
            </label>
            {coachName && (
              <label className="ctw-label">
                <span>Coach Fun Fact <span className="ctw-optional">(optional)</span></span>
                <input
                  type="text"
                  className="tnw-input ctw-input"
                  placeholder="Never once raised his voice."
                  value={coachFunFact}
                  onChange={e => setCoachFunFact(e.target.value)}
                  maxLength={140}
                />
              </label>
            )}
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────── */}
        <div className="ctw-nav">
          {step > 1 && (
            <button className="tnw-btn tnw-btn--ghost ctw-btn--back" onClick={handleBack}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="ctw-nav__spacer" />
          {step === 1 ? (
            <button
              className="tnw-btn tnw-btn--secondary ctw-btn--next"
              onClick={handleNext}
              disabled={!canProceed1}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="tnw-btn tnw-btn--primary ctw-btn--submit"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? <><Loader size={14} className="ctw-spinner" /> Creating…</> : 'Start This Wall'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
