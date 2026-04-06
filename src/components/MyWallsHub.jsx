import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hash, MapPin, Star, ChevronRight, Plus, X } from 'lucide-react'
import { listMyWalls } from '../lib/myWallStore.js'
import { getIdentity, setIdentityField } from '../lib/identity.js'
import { wallData, bostonLegends } from '../data/index.js'
import { getCitySuggestions } from '../lib/cities.js'
import NewWallModal from './NewWallModal.jsx'

// ─── Player lookup for hero validation ──────────────────────────────────────

const ALL_PLAYER_NUMBERS = (() => {
  const map = {}  // lowercase name → number string
  for (const entry of [...wallData, ...bostonLegends]) {
    if (entry.tier === 'UNWRITTEN' || !entry.name) continue
    map[entry.name.toLowerCase()] = String(entry.number)
  }
  return map
})()

function findHeroNumber(query) {
  if (!query) return null
  const q = query.trim().toLowerCase()
  // Exact match
  if (ALL_PLAYER_NUMBERS[q]) return ALL_PLAYER_NUMBERS[q]
  // Last-name match (e.g. "Brady" → "Tom Brady")
  const lastNameMatch = Object.entries(ALL_PLAYER_NUMBERS).find(([name]) => {
    const parts = name.split(' ')
    return parts[parts.length - 1] === q
  })
  if (lastNameMatch) return lastNameMatch[1]
  // Partial match
  const partial = Object.entries(ALL_PLAYER_NUMBERS).find(([name]) => name.includes(q))
  return partial ? partial[1] : null
}

function getHeroSuggestions(query) {
  if (!query || query.length < 2) return []
  const q = query.trim().toLowerCase()
  return Object.entries(ALL_PLAYER_NUMBERS)
    .filter(([name]) => name.includes(q))
    .slice(0, 5)
    .map(([name, number]) => ({ name, number }))
}

// ─── Welcome Placemat (first visit) ──────────────────────────────────────

function WelcomePlacemat({ onDismiss }) {
  return (
    <div className="hub-welcome">
      <div className="hub-welcome__content">
        <h2 className="hub-welcome__heading">WELCOME TO MY WALLS</h2>
        <p className="hub-welcome__body">
          This is your corner of The Number Wall. Claim your number, rep your city, name your hero — then build walls around the things you care about.
        </p>
        <div className="hub-welcome__features">
          <div className="hub-welcome__feature">
            <Hash size={14} className="hub-welcome__feature-icon" />
            <span>Claim the number that means something to you</span>
          </div>
          <div className="hub-welcome__feature">
            <MapPin size={14} className="hub-welcome__feature-icon" />
            <span>Rep your city and its legends</span>
          </div>
          <div className="hub-welcome__feature">
            <Star size={14} className="hub-welcome__feature-icon" />
            <span>Name your all-time hero</span>
          </div>
          <div className="hub-welcome__feature">
            <Plus size={14} className="hub-welcome__feature-icon" />
            <span>Build themed walls and share them with friends</span>
          </div>
        </div>
        <button className="btn-primary hub-welcome__cta" onClick={onDismiss}>
          LET'S GO
        </button>
      </div>
    </div>
  )
}

// ─── Identity Chip (inline editable, fixed height) ──────────────────────────

function IdentityChip({ field, label, emptyPrompt, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')
  const [suggestions, setSuggestions] = useState([])

  function handleSave() {
    const trimmed = draft.trim()
    onSave(field, trimmed || null)
    setEditing(false)
    setSuggestions([])
  }

  function handleDraftChange(val) {
    setDraft(val)
    if (field === 'hero') {
      setSuggestions(getHeroSuggestions(val).map(s => ({ label: s.name, detail: `#${s.number}`, value: s.name })))
    } else if (field === 'city') {
      setSuggestions(getCitySuggestions(val).map(c => ({ label: c, detail: null, value: c })))
    } else {
      setSuggestions([])
    }
  }

  function handleSuggestionPick(value) {
    setDraft(value)
    setSuggestions([])
    onSave(field, value || null)
    setEditing(false)
  }

  // Editing state — same height container
  if (editing) {
    return (
      <div className={`id-chip id-chip--editing id-chip--${field}`}>
        <div className="id-chip__text">
          <span className="id-chip__label">{label}</span>
          <input
            className={`id-chip__input id-chip__input--${field}`}
            type="text"
            value={draft}
            onChange={e => handleDraftChange(field === 'number' ? e.target.value.replace(/[^0-9]/g, '').slice(0, 2) : e.target.value.slice(0, 24))}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setSuggestions([]) } }}
            onBlur={() => { setTimeout(() => { handleSave(); }, 150) }}
            autoFocus
            inputMode={field === 'number' ? 'numeric' : 'text'}
            placeholder={field === 'number' ? '00' : field === 'city' ? 'City' : 'Name'}
          />
        </div>
        {/* Autocomplete dropdown (hero + city) */}
        {suggestions.length > 0 && (
          <div className="id-chip__suggestions">
            {suggestions.map(s => (
              <button
                key={s.value}
                className="id-chip__suggestion"
                onMouseDown={e => { e.preventDefault(); handleSuggestionPick(s.value) }}
              >
                <span className="id-chip__suggestion-name">{s.label}</span>
                {s.detail && <span className="id-chip__suggestion-num">{s.detail}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Filled state
  if (value) {
    const displayValue = field === 'number' ? `#${value}`
      : field === 'hero' ? (() => {
          const num = findHeroNumber(value)
          return num ? `#${num}` : value
        })()
      : value

    return (
      <div className={`id-chip id-chip--filled id-chip--${field}`} onClick={() => { setDraft(value); setEditing(true) }}>
        <div className="id-chip__text">
          <span className="id-chip__label">{label}</span>
          <span className={`id-chip__value id-chip__value--${field}`}>
            {displayValue}
          </span>
        </div>
      </div>
    )
  }

  // Empty state
  return (
    <div className="id-chip id-chip--empty" onClick={() => { setDraft(''); setEditing(true) }}>
      <div className="id-chip__text">
        <span className="id-chip__label">{label}</span>
        <span className="id-chip__prompt">{emptyPrompt}</span>
      </div>
    </div>
  )
}

// ─── Hub ───────────────────────────────────────────────────────────────────

export default function MyWallsHub() {
  const navigate = useNavigate()
  const [walls, setWalls]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [identity, setIdentity]     = useState(getIdentity())
  const [showModal, setShowModal]   = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('tnw_hub_welcomed')
  })

  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem('tnw_my_wall_token') : null

  function dismissWelcome() {
    localStorage.setItem('tnw_hub_welcomed', '1')
    setShowWelcome(false)
  }

  useEffect(() => {
    if (!ownerToken) {
      setLoading(false)
      return
    }
    listMyWalls(ownerToken).then(result => {
      setWalls(result)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [ownerToken])

  function handleIdentitySave(field, value) {
    setIdentityField(field, value)
    setIdentity(prev => ({ ...prev, [field]: value }))
  }

  function handlePromptSelect(prompt) {
    setShowModal(false)
    // Navigate to onboarding with prompt pre-selected
    if (prompt) {
      navigate('/my-wall/new', { state: { prompt } })
    } else {
      navigate('/my-wall/new')
    }
  }

  // Collaborator initials as colored dots
  function CollabDots({ contributors }) {
    if (!contributors || contributors.length === 0) return null
    const colors = [
      'rgba(60, 130, 255, 0.30)',
      'rgba(232, 124, 42, 0.30)',
      'rgba(130, 200, 100, 0.30)',
      'rgba(200, 100, 200, 0.30)',
    ]
    const shown = contributors.slice(0, 3)
    const extra = contributors.length - shown.length
    return (
      <span className="wall-row__collabs">
        {shown.map((name, i) => (
          <span key={i} className="collab-dot" style={{ background: colors[i % colors.length] }}>
            {name.charAt(0).toUpperCase()}
          </span>
        ))}
        {extra > 0 && <span className="collab-more">+{extra}</span>}
      </span>
    )
  }

  return (
    <div className="my-walls-hub">
      {/* First-visit welcome placemat */}
      {showWelcome && <WelcomePlacemat onDismiss={dismissWelcome} />}

      {/* Identity row */}
      <div className="hub-identity-row">
        <IdentityChip
          field="number"
          label="Your Number"
          emptyPrompt="Got one?"
          value={identity.number}
          onSave={handleIdentitySave}
        />
        <IdentityChip
          field="city"
          label="Your City"
          emptyPrompt="Where from?"
          value={identity.city}
          onSave={handleIdentitySave}
        />
        <IdentityChip
          field="hero"
          label="Your Hero"
          emptyPrompt="All-time #1?"
          value={identity.hero}
          onSave={handleIdentitySave}
        />
      </div>

      <div className="hub-divider" />

      {/* Wall list */}
      {loading ? (
        <p className="hub-loading">Loading walls...</p>
      ) : walls.length > 0 ? (
        <>
          <span className="hub-section-label">YOUR WALLS</span>
          <div className="hub-wall-list">
            {walls.map(w => {
              const isPersonal = !w.theme
              return (
                <button
                  key={w.id}
                  className="hub-wall-row"
                  onClick={() => navigate(`/wall/${w.slug}`)}
                >
                  {/* Preview: your number for personal wall, mini grid for themed */}
                  {isPersonal && w.my_number ? (
                    <span className="hub-wall-row__number-preview">#{w.my_number}</span>
                  ) : (
                    <span className="hub-wall-row__theme-preview">
                      <span className="prev-cell prev-cell--lit" />
                      <span className="prev-cell" />
                      <span className="prev-cell prev-cell--hot" />
                      <span className="prev-cell" />
                      <span className="prev-cell prev-cell--lit" />
                      <span className="prev-cell" />
                      <span className="prev-cell prev-cell--sacred" />
                      <span className="prev-cell prev-cell--lit" />
                      <span className="prev-cell" />
                    </span>
                  )}

                  <span className="hub-wall-row__info">
                    <span className="hub-wall-row__name">
                      {isPersonal ? `${w.owner_name}'s Wall` : w.theme}
                    </span>
                    <span className="hub-wall-row__desc">
                      {isPersonal ? 'Your personal wall' : (w.theme_description || '')}
                    </span>
                    <span className="hub-wall-row__bottom">
                      <span className="hub-wall-row__count">{w.entryCount} PICKS</span>
                      <CollabDots contributors={w.contributors} />
                    </span>
                  </span>

                  <ChevronRight size={16} className="hub-wall-row__arrow" />
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="hub-empty">
          <p className="hub-empty__text">No walls yet. Build your first one.</p>
        </div>
      )}

      {/* Build a new wall CTA */}
      <div className="hub-build-cta">
        <button className="hub-build-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span className="hub-build-btn__text">BUILD A NEW WALL</span>
        </button>
      </div>

      <NewWallModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handlePromptSelect}
      />
    </div>
  )
}
