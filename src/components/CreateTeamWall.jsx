/**
 * CreateTeamWall — Multi-step modal for starting a new team wall.
 * Steps: 1) School + location  2) Sport + year  3) Colors + coach
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Loader } from 'lucide-react'
import { TEAM_COLORS, TEAM_COLOR_KEYS, TEAM_PALETTES } from '../data/teamColors.js'
import { createTeamWall, slugify } from '../lib/teamWallStore.js'
import { checkProfanity } from '../lib/profanityFilter.js'
import './CreateTeamWall.css'

// Only team sports where players wear numbers
const SPORTS = [
  { id: 'baseball',      label: 'Baseball' },
  { id: 'basketball',    label: 'Basketball' },
  { id: 'football',      label: 'Football' },
  { id: 'hockey',        label: 'Hockey' },
  { id: 'soccer',        label: 'Soccer' },
  { id: 'lacrosse',      label: 'Lacrosse' },
  { id: 'volleyball',    label: 'Volleyball' },
  { id: 'softball',      label: 'Softball' },
  { id: 'field_hockey',  label: 'Field Hockey' },
  { id: 'rugby',         label: 'Rugby' },
  { id: 'water_polo',    label: 'Water Polo' },
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear - i)

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
  const [sport, setSport]     = useState('')
  const [year, setYear]       = useState('')

  // Step 3
  const [colorPrimary, setColorPrimary] = useState('red')
  const [coachName, setCoachName]       = useState('')
  const [coachFunFact, setCoachFunFact] = useState('')

  if (!open) return null

  const canProceed1 = school.trim() && city.trim() && state
  const canProceed2 = sport && year
  const canSubmit   = canProceed1 && canProceed2

  function handleNext() {
    setError(null)
    if (step === 1) {
      const check = checkProfanity(school)
      if (!check.clean) { setError(check.reason); return }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  function handleBack() {
    setError(null)
    setStep(s => Math.max(1, s - 1))
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
        year:   Number(year),
        colorPrimary,
        coachName:    coachName.trim() || null,
        coachFunFact: coachFunFact.trim() || null,
      })

      const slug = slugify(school.trim())
      onClose()
      navigate(`/walls/${slug}/${sport}/${year}`)
    } catch (err) {
      if (err?.code === '23505') {
        setError('A wall for this exact team + year already exists.')
      } else {
        setError('Something went wrong. Try again.')
      }
      console.error('CreateTeamWall error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ctw-overlay" onClick={onClose}>
      <div className="ctw-modal" onClick={e => e.stopPropagation()}>
        <button className="ctw-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="ctw-header">
          <span className="ctw-step-label">STEP {step} OF 3</span>
          <h2 className="ctw-title">
            {step === 1 && 'YOUR SCHOOL'}
            {step === 2 && 'YOUR TEAM'}
            {step === 3 && 'THE DETAILS'}
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
                className="ctw-input"
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
                className="ctw-input"
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

        {/* ── Step 2: Sport + Year ──────────────────────────── */}
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
                {SPORTS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="ctw-label">
              <span>Year</span>
              <select
                className="ctw-select"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="">Select year…</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* ── Step 3: Colors + Coach ────────────────────────── */}
        {step === 3 && (
          <div className="ctw-fields">
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
                className="ctw-input"
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
                  className="ctw-input"
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
            <button className="ctw-btn ctw-btn--back" onClick={handleBack}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="ctw-nav__spacer" />
          {step < 3 ? (
            <button
              className="ctw-btn ctw-btn--next"
              onClick={handleNext}
              disabled={step === 1 ? !canProceed1 : !canProceed2}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="ctw-btn ctw-btn--submit"
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
