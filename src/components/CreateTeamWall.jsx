/**
 * CreateTeamWall — Three-step modal for starting a new team wall.
 *
 * Hierarchy: Town → Organization → Wall (one wall per org per sport)
 *
 *   Step 1  Your Town        City + State → query existing orgs
 *   Step 2  Your Org          Pick existing OR add new (org name + type, dedupe)
 *   Step 3  Your Team         Sport + color + coach → create
 *
 * Year is per-entry, not per-wall. One wall spans all years.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Loader, Plus, Check } from 'lucide-react'
import { TEAM_COLORS, TEAM_COLOR_KEYS, TEAM_PALETTES } from '../data/teamColors.js'
import { TEAM_SPORTS, getSportIcon } from '../data/sports.js'
import { ORG_TYPES, getOrgTypeLabel } from '../data/orgTypes.js'
import {
  createTeamWall, slugify, townSlugify,
  findOrgsInTown, findSimilarOrgsInTown,
} from '../lib/teamWallStore.js'
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

  // Step 1 — Town
  const [town, setTown]   = useState('')
  const [state, setState] = useState('')

  // Step 2 — Org (existing or new)
  const [existingOrgs, setExistingOrgs]     = useState([])
  const [loadingOrgs, setLoadingOrgs]       = useState(false)
  const [pickedOrg, setPickedOrg]           = useState(null)       // {school, school_slug, org_type, sports[]}
  const [addingNewOrg, setAddingNewOrg]     = useState(false)
  const [newOrgName, setNewOrgName]         = useState('')
  const [newOrgType, setNewOrgType]         = useState('public_hs')
  const [similarOrgs, setSimilarOrgs]       = useState([])         // dedupe suggestions

  // Step 3 — Team
  const [sport, setSport]                 = useState('')
  const [colorPrimary, setColorPrimary]   = useState('red')
  const [coachName, setCoachName]         = useState('')
  const [coachFunFact, setCoachFunFact]   = useState('')

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setStep(1); setError(null)
      setTown(''); setState('')
      setExistingOrgs([]); setPickedOrg(null); setAddingNewOrg(false)
      setNewOrgName(''); setNewOrgType('public_hs'); setSimilarOrgs([])
      setSport(''); setColorPrimary('red'); setCoachName(''); setCoachFunFact('')
    }
  }, [open])

  // Fuzzy dedupe check as user types new org name
  useEffect(() => {
    if (!addingNewOrg || !newOrgName.trim() || !town || !state) {
      setSimilarOrgs([])
      return
    }
    const townSlug = townSlugify(town, state)
    const t = setTimeout(() => {
      findSimilarOrgsInTown(newOrgName, townSlug)
        .then(setSimilarOrgs)
        .catch(() => setSimilarOrgs([]))
    }, 300)
    return () => clearTimeout(t)
  }, [addingNewOrg, newOrgName, town, state])

  if (!open) return null

  const canProceed1 = town.trim() && state
  const canProceed2 = pickedOrg || (addingNewOrg && newOrgName.trim() && newOrgType)
  const canSubmit   = canProceed1 && canProceed2 && sport

  // ── Step navigation ──────────────────────────────────────────────
  async function handleNext() {
    setError(null)

    if (step === 1) {
      const cityCheck = checkProfanity(town)
      if (!cityCheck.clean) { setError(cityCheck.reason); return }
      // Pre-fetch existing orgs in this town for Step 2
      setLoadingOrgs(true)
      try {
        const orgs = await findOrgsInTown(townSlugify(town, state))
        setExistingOrgs(orgs)
        // Default to "add new" if no existing orgs in town
        setAddingNewOrg(orgs.length === 0)
      } catch {
        setExistingOrgs([])
        setAddingNewOrg(true)
      } finally {
        setLoadingOrgs(false)
        setStep(2)
      }
      return
    }

    if (step === 2) {
      if (addingNewOrg) {
        const check = checkProfanity(newOrgName)
        if (!check.clean) { setError(check.reason); return }
      }
      setStep(3)
      return
    }
  }

  function handleBack() {
    setError(null)
    if (step === 3) setStep(2)
    else if (step === 2) setStep(1)
  }

  function pickExistingOrg(org) {
    setPickedOrg(org)
    setAddingNewOrg(false)
  }

  function startAddingOrg() {
    setPickedOrg(null)
    setAddingNewOrg(true)
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      // Decide org fields based on picked vs new
      const orgFields = pickedOrg
        ? {
            school: pickedOrg.school,
            orgType: pickedOrg.org_type || 'public_hs',
            existingSchoolSlug: pickedOrg.school_slug,
          }
        : {
            school: newOrgName.trim(),
            orgType: newOrgType,
          }

      // Block wall creation if this org already has this sport
      if (pickedOrg && pickedOrg.sports.includes(sport)) {
        setError(`${pickedOrg.school} already has a ${sport.replace(/_/g, ' ')} wall. Navigate to it instead!`)
        setSubmitting(false)
        return
      }

      await createTeamWall({
        ...orgFields,
        town:  town.trim(),
        state,
        sport,
        colorPrimary,
        coachName:    coachName.trim() || null,
        coachFunFact: coachFunFact.trim() || null,
      })

      const slug = orgFields.existingSchoolSlug || slugify(orgFields.school)
      onClose()
      navigate(`/walls/${slug}/${sport}`)
    } catch (err) {
      if (err?.code === '23505') {
        setError('A wall for this org + sport already exists. Search for it!')
      } else {
        setError('Something went wrong. Try again.')
      }
      console.error('CreateTeamWall error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="tnw-overlay ctw-overlay" onClick={onClose}>
      <div className="ctw-modal" onClick={e => e.stopPropagation()}>
        <button className="ctw-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="ctw-header">
          <span className="ctw-step-label">STEP {step} OF 3</span>
          <h2 className="ctw-title">
            {step === 1 && 'YOUR TOWN'}
            {step === 2 && 'YOUR ORGANIZATION'}
            {step === 3 && 'YOUR TEAM'}
          </h2>
        </div>

        {error && <p className="ctw-error">{error}</p>}

        {/* ── Step 1: Town ───────────────────────────────────── */}
        {step === 1 && (
          <div className="ctw-fields">
            <p className="ctw-hint">The town your team plays in. Orgs are grouped by town.</p>
            <label className="ctw-label">
              <span>Town or City</span>
              <input
                type="text"
                className="tnw-input ctw-input"
                placeholder="Newton"
                value={town}
                onChange={e => setTown(e.target.value)}
                autoFocus
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

        {/* ── Step 2: Org picker ─────────────────────────────── */}
        {step === 2 && (
          <div className="ctw-fields">
            {loadingOrgs && <p className="ctw-hint">Looking for existing orgs in {town}…</p>}

            {!loadingOrgs && existingOrgs.length > 0 && !addingNewOrg && (
              <>
                <p className="ctw-hint">Pick your org in {town}, {state}:</p>
                <div className="ctw-org-list">
                  {existingOrgs.map(org => {
                    const isActive = pickedOrg?.school_slug === org.school_slug
                    return (
                      <button
                        key={org.school_slug}
                        className={`ctw-org-card${isActive ? ' ctw-org-card--active' : ''}`}
                        onClick={() => pickExistingOrg(org)}
                        type="button"
                      >
                        <div className="ctw-org-card__head">
                          <span className="ctw-org-card__name">{org.school}</span>
                          {isActive && <Check size={14} className="ctw-org-card__check" />}
                        </div>
                        <div className="ctw-org-card__meta">
                          <span className="ctw-org-card__type">{getOrgTypeLabel(org.org_type)}</span>
                          <span className="ctw-org-card__sports">
                            {org.sports.length} sport{org.sports.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <button className="tnw-btn tnw-btn--ghost ctw-add-org-btn" onClick={startAddingOrg} type="button">
                  <Plus size={14} /> Add a new org
                </button>
              </>
            )}

            {!loadingOrgs && (addingNewOrg || existingOrgs.length === 0) && (
              <>
                {existingOrgs.length > 0 && (
                  <button className="tnw-btn tnw-btn--ghost ctw-back-link" onClick={() => setAddingNewOrg(false)} type="button">
                    <ChevronLeft size={14} /> Back to list
                  </button>
                )}
                <label className="ctw-label">
                  <span>Org Name</span>
                  <input
                    type="text"
                    className="tnw-input ctw-input"
                    placeholder="Newton North High School"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    autoFocus
                  />
                </label>

                {similarOrgs.length > 0 && (
                  <div className="ctw-dedupe">
                    <p className="ctw-dedupe__title">Did you mean one of these?</p>
                    {similarOrgs.map(org => (
                      <button
                        key={org.school_slug}
                        className="ctw-dedupe__item"
                        onClick={() => pickExistingOrg(org)}
                        type="button"
                      >
                        <span>{org.school}</span>
                        <span className="ctw-dedupe__type">{getOrgTypeLabel(org.org_type)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <label className="ctw-label">
                  <span>Org Type</span>
                  <div className="ctw-type-grid">
                    {ORG_TYPES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        className={`ctw-type-pill${newOrgType === t.id ? ' ctw-type-pill--active' : ''}`}
                        onClick={() => setNewOrgType(t.id)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </label>
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Sport + Colors + Coach ────────────────── */}
        {step === 3 && (
          <div className="ctw-fields">
            <p className="ctw-hint">
              {pickedOrg
                ? `Adding ${pickedOrg.school}'s next wall.`
                : `Creating the first wall for ${newOrgName || 'this org'}.`}
            </p>
            <label className="ctw-label">
              <span>Sport</span>
              <select
                className="ctw-select"
                value={sport}
                onChange={e => setSport(e.target.value)}
                autoFocus
              >
                <option value="">Select sport…</option>
                {TEAM_SPORTS.map(s => {
                  const disabled = pickedOrg?.sports?.includes(s.id)
                  return (
                    <option key={s.id} value={s.id} disabled={disabled}>
                      {s.label}{disabled ? ' — already exists' : ''}
                    </option>
                  )
                })}
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
                      type="button"
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
            <button className="tnw-btn tnw-btn--ghost ctw-btn--back" onClick={handleBack} type="button">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="ctw-nav__spacer" />
          {step < 3 ? (
            <button
              className="tnw-btn tnw-btn--secondary ctw-btn--next"
              onClick={handleNext}
              disabled={step === 1 ? !canProceed1 : !canProceed2}
              type="button"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="tnw-btn tnw-btn--primary ctw-btn--submit"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              type="button"
            >
              {submitting ? <><Loader size={14} className="ctw-spinner" /> Creating…</> : 'Start This Wall'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
