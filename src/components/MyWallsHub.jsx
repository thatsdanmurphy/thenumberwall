import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hash, MapPin, Star, ChevronRight, Plus } from 'lucide-react'
import { listMyWalls } from '../lib/myWallStore.js'
import { getIdentity, setIdentityField } from '../lib/identity.js'
import NewWallModal from './NewWallModal.jsx'

// ─── Identity Chip (inline editable) ──────────────────────────────────────

function IdentityChip({ field, label, emptyPrompt, colorClass, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value || '')

  const IconMap = { number: Hash, city: MapPin, hero: Star }
  const Icon = IconMap[field] || Hash

  function handleSave() {
    const trimmed = draft.trim()
    onSave(field, trimmed || null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={`id-chip id-chip--editing`}>
        <div className="id-chip__text">
          <span className="id-chip__label">{label}</span>
          <input
            className={`id-chip__input id-chip__input--${field}`}
            type="text"
            value={draft}
            onChange={e => setDraft(field === 'number' ? e.target.value.replace(/[^0-9]/g, '').slice(0, 2) : e.target.value.slice(0, 20))}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
            onBlur={handleSave}
            autoFocus
            inputMode={field === 'number' ? 'numeric' : 'text'}
            placeholder={field === 'number' ? '00' : field === 'city' ? 'City' : '#00'}
          />
        </div>
      </div>
    )
  }

  if (value) {
    return (
      <div className={`id-chip id-chip--filled id-chip--${field}`} onClick={() => setEditing(true)}>
        <div className="id-chip__text">
          <span className="id-chip__label">{label}</span>
          <span className={`id-chip__value id-chip__value--${field}`}>
            {field === 'number' || field === 'hero' ? `#${value}` : value}
          </span>
        </div>
      </div>
    )
  }

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

  const ownerToken = typeof window !== 'undefined' ? localStorage.getItem('tnw_my_wall_token') : null

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
