import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { listMyWalls } from '../lib/myWallStore.js'
import { getIdentity, setIdentityField } from '../lib/identity.js'
import IdentityTiles from './IdentityTiles.jsx'
import { HUB_WELCOMED, MY_WALL_TOKEN } from '../lib/storageKeys.js'
import { getCitySuggestions } from '../lib/cities.js'
import NewWallModal from './NewWallModal.jsx'

// ─── Welcome Placemat (first visit) ──────────────────────────────────────

function WelcomePlacemat({ onDismiss }) {
  return (
    <div className="hub-welcome">
      <div className="hub-welcome__content">
        <p className="hub-welcome__hook">Every fan has a number.</p>
        <h2 className="hub-welcome__heading">WHAT'S YOURS?</h2>
        <div className="hub-welcome__slots">
          {/* Preview labels match the live identity row (MY NUMBER / MY CITY)
              so the placemat reads as a preview, not a different system. */}
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
        </div>
        <p className="hub-welcome__sub">Claim your identity. Then build walls around what you care about.</p>
        <button className="btn-primary hub-welcome__cta" onClick={onDismiss}>
          CLAIM MINE
        </button>
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

      {/* Identity section — Number (square) + City (field). Each slot has its
          own MY ___ label inside the tile, so no outer heading is needed. */}
      <IdentityTiles
        identity={identity}
        citySuggestions={getCitySuggestions}
        onSaveField={handleIdentitySave}
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
