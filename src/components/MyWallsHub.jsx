import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { listMyWalls } from '../lib/myWallStore.js'
import { getIdentity, setIdentityField, addHero, removeHero, updateHero } from '../lib/identity.js'
import IdentityTiles from './IdentityTiles.jsx'
import { wallData, bostonLegends } from '../data/index.js'
import { TIER_WEIGHT } from '../data/tiers.js'
import { HUB_WELCOMED, MY_WALL_TOKEN } from '../lib/storageKeys.js'
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

// ─── Number → legends lookup (for number chip autocomplete) ─────────────────

// Tier weights imported from data/tiers.js (single source of truth)

const NUMBER_TO_LEGENDS = (() => {
  const map = {}  // number string → [{ name, tier }] sorted by tier weight
  for (const entry of [...wallData, ...bostonLegends]) {
    if (entry.tier === 'UNWRITTEN' || !entry.name) continue
    const num = String(entry.number)
    if (!map[num]) map[num] = []
    // Dedupe by name
    if (!map[num].some(e => e.name.toLowerCase() === entry.name.toLowerCase())) {
      map[num].push({ name: entry.name, tier: entry.tier })
    }
  }
  // Sort each list by tier weight (highest first)
  for (const num of Object.keys(map)) {
    map[num].sort((a, b) => (TIER_WEIGHT[b.tier] || 0) - (TIER_WEIGHT[a.tier] || 0))
  }
  return map
})()

function getNumberLegends(numStr) {
  if (!numStr) return null
  const legends = NUMBER_TO_LEGENDS[numStr]
  if (!legends || legends.length === 0) return null
  // Return top 3 names as a hint string
  const names = legends.slice(0, 3).map(l => l.name.split(' ').pop())
  return names.join(', ') + (legends.length > 3 ? '...' : '')
}

// ─── Welcome Placemat (first visit) ──────────────────────────────────────

function WelcomePlacemat({ onDismiss }) {
  return (
    <div className="hub-welcome">
      <div className="hub-welcome__content">
        <p className="hub-welcome__hook">Every fan has a number.</p>
        <h2 className="hub-welcome__heading">WHAT'S YOURS?</h2>
        <div className="hub-welcome__slots">
          {/* Preview labels match the live identity row (MY NUMBER etc.) so
              the placemat reads as a preview, not a different system. */}
          <div className="hub-welcome__slot hub-welcome__slot--number">
            <span className="hub-welcome__slot-label">MY NUMBER</span>
            <span className="hub-welcome__slot-value">#12</span>
            <span className="hub-welcome__slot-sub">Brady</span>
          </div>
          <div className="hub-welcome__slot hub-welcome__slot--city">
            <span className="hub-welcome__slot-label">MY CITY</span>
            <span className="hub-welcome__slot-value">Boston</span>
            <span className="hub-welcome__slot-sub">Massachusetts</span>
          </div>
          <div className="hub-welcome__slot hub-welcome__slot--hero">
            <span className="hub-welcome__slot-label">MY HERO</span>
            <span className="hub-welcome__slot-value hub-welcome__slot-value--big">Brady</span>
          </div>
        </div>
        <p className="hub-welcome__sub">Claim your identity. Then build walls around what you care about.</p>
        <button className="btn-primary hub-welcome__cta" onClick={onDismiss}>
          CLAIM MINE
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
    const heroNum = field === 'hero' ? findHeroNumber(value) : null

    return (
      <div className={`id-chip id-chip--filled id-chip--${field}`} onClick={() => { setDraft(value); setEditing(true) }}>
        <div className="id-chip__text">
          <span className="id-chip__label">{label}</span>
          {field === 'hero' && heroNum ? (
            <span className="id-chip__value id-chip__value--hero">
              <span className="id-chip__hero-name">{value}</span>
              <span className="id-chip__hero-num">#{heroNum}</span>
            </span>
          ) : (
            <span className={`id-chip__value id-chip__value--${field}`}>
              {field === 'number' ? `#${value}` : value}
            </span>
          )}
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
    return !localStorage.getItem(HUB_WELCOMED)
  })

  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem(MY_WALL_TOKEN) : null

  function dismissWelcome() {
    localStorage.setItem(HUB_WELCOMED, '1')
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

      {/* Identity section — Triptych: number (square) + city (field) +
          heroes (roster of pill-chips). Each slot has its own MY ___ label
          inside the tile, so no outer heading is needed. */}
      <IdentityTiles
        identity={identity}
        heroLookup={ALL_PLAYER_NUMBERS}
        heroSuggestions={getHeroSuggestions}
        citySuggestions={getCitySuggestions}
        onSaveField={handleIdentitySave}
        onAddHero={(name) => {
          addHero(name)
          setIdentity(prev => ({
            ...prev,
            heroes: prev.heroes.includes(name) ? prev.heroes : [...prev.heroes, name].slice(0, 5),
          }))
        }}
        onUpdateHero={(oldName, newName) => {
          updateHero(oldName, newName)
          setIdentity(prev => ({
            ...prev,
            heroes: prev.heroes.map(h => (h === oldName ? newName : h)),
          }))
        }}
        onRemoveHero={(name) => {
          removeHero(name)
          setIdentity(prev => ({
            ...prev,
            heroes: prev.heroes.filter(h => h !== name),
          }))
        }}
      />

      <div className="hub-divider" />

      {/* Wall list */}
      {loading ? (
        <p className="hub-loading">Loading walls...</p>
      ) : walls.length > 0 ? (
        <>
          <span className="hub-section-label">MY WALLS</span>
          <div className="hub-wall-list">
            {walls.map(w => {
              const isPersonal = !w.theme
              return (
                <button
                  key={w.id}
                  className="hub-wall-row"
                  onClick={() => navigate(`/wall/${w.slug}`)}
                >
                  {/* Preview: mini 3x3 grid for all walls */}
                  <span className="hub-wall-row__theme-preview">
                    {isPersonal ? (
                      <>
                        <span className="prev-cell" />
                        <span className="prev-cell" />
                        <span className="prev-cell" />
                        <span className="prev-cell" />
                        <span className="prev-cell prev-cell--blue" />
                        <span className="prev-cell" />
                        <span className="prev-cell" />
                        <span className="prev-cell" />
                        <span className="prev-cell" />
                      </>
                    ) : (
                      <>
                        <span className="prev-cell prev-cell--lit" />
                        <span className="prev-cell" />
                        <span className="prev-cell prev-cell--hot" />
                        <span className="prev-cell" />
                        <span className="prev-cell prev-cell--lit" />
                        <span className="prev-cell" />
                        <span className="prev-cell prev-cell--sacred" />
                        <span className="prev-cell prev-cell--lit" />
                        <span className="prev-cell" />
                      </>
                    )}
                  </span>

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
          <p className="hub-empty__text">You haven't built any walls yet.</p>
          <button className="tnw-btn tnw-btn--secondary hub-empty__cta" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>BUILD YOUR FIRST WALL</span>
          </button>
        </div>
      )}

      {/* Build a new wall CTA — only show when user already has walls */}
      {walls.length > 0 && (
        <div className="hub-build-cta">
          <button className="hub-build-btn" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span className="hub-build-btn__text">BUILD A NEW WALL</span>
          </button>
        </div>
      )}

      <NewWallModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handlePromptSelect}
      />
    </div>
  )
}
