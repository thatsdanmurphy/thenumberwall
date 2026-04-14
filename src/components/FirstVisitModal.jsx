import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { SACRED_TILE } from '../data/index.js'
import { FIRST_VISITED } from '../lib/storageKeys.js'
import './FirstVisitModal.css'

/**
 * FirstVisitModal — shown once to new visitors.
 * Sells the concept in ~5 seconds. Uses actual mini tile visuals
 * to show heat levels instead of emojis.
 */

// Mini tile data — three real numbers at different heat levels
const TILES = [
  { number: '42', heat: 5, sacred: true,  label: 'SACRED'    },
  { number: '23', heat: 5, sacred: false, label: '6 legends' },
  { number: '87', heat: 1, sacred: false, label: '1 legend'  },
]

// Inline heat styles matching the data layer — just enough to render 3 tiles
const HEAT = [
  { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)', glow: 'none',                                              text: 'rgba(255,255,255,0.38)' },
  { bg: 'rgba(140,32,0,0.42)',    border: 'rgba(200,55,0,0.55)',    glow: '0 0 8px rgba(200,60,0,0.40)',                        text: 'rgba(220,110,50,0.85)' },
  { bg: 'rgba(170,42,0,0.52)',    border: 'rgba(225,70,5,0.65)',    glow: '0 0 12px rgba(240,80,10,0.50)',                      text: 'rgba(255,145,65,1)' },
  { bg: 'rgba(198,52,0,0.62)',    border: 'rgba(245,92,15,0.75)',   glow: '0 0 16px rgba(255,100,15,0.65)',                     text: 'rgba(255,170,85,1)' },
  { bg: 'rgba(212,88,0,0.72)',    border: 'rgba(245,130,20,0.85)',  glow: '0 0 20px rgba(245,140,20,0.78)',                     text: 'rgba(255,190,100,1)' },
  { bg: 'rgba(222,125,0,0.82)',   border: 'rgba(245,180,30,0.92)',  glow: '0 0 24px rgba(245,193,53,0.92), 0 0 48px rgba(255,130,0,0.50)', text: 'rgba(255,210,120,1)' },
]

// Sacred style imported from data/index.js (single source of truth)

function MiniTile({ number, heat, sacred }) {
  const s = sacred ? SACRED_TILE : HEAT[heat]
  return (
    <div
      className="fv-modal__tile"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: s.glow,
      }}
    >
      <span className="fv-modal__tile-num" style={{ color: s.text }}>{number}</span>
    </div>
  )
}

export default function FirstVisitModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const alreadyVisited = localStorage.getItem(FIRST_VISITED)
    if (!alreadyVisited) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem(FIRST_VISITED, '1')
  }

  if (!show) return null

  return (
    <div className="tnw-overlay fv-modal__backdrop" onClick={dismiss}>
      <div
        className="fv-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to The Number Wall"
      >
        <button className="fv-modal__close" onClick={dismiss} aria-label="Close">
          <X size={16} />
        </button>

        <div className="fv-modal__content">
          <h2 className="fv-modal__title">Every number has a story.</h2>
          <p className="fv-modal__subtitle">Do you know who defined yours?</p>

          <p className="fv-modal__body">
            The Number Wall is a living archive of the legends behind every jersey
            number across basketball, football, baseball, hockey, and soccer.
            Click any number. See who wore it.
          </p>

          {/* Actual tile visuals showing heat levels */}
          <div className="fv-modal__tiles-row">
            {TILES.map(t => (
              <div key={t.number} className="fv-modal__tile-group">
                <MiniTile number={t.number} heat={t.heat} sacred={t.sacred} />
                <span className="fv-modal__tile-label">{t.label}</span>
              </div>
            ))}
          </div>

          <p className="fv-modal__hook">
            The brighter the tile, the more legends wore it.
          </p>

          <button className="tnw-btn tnw-btn--primary fv-modal__cta" onClick={dismiss}>
            Explore the Wall
          </button>
        </div>
      </div>
    </div>
  )
}
