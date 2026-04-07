import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import './FirstVisitModal.css'

const STORAGE_KEY = 'nw_visited'

/**
 * FirstVisitModal — shown once to new visitors.
 * Explains what The Number Wall is in ~5 seconds of reading.
 * Dismissed on button click or backdrop click, sets localStorage flag.
 */
export default function FirstVisitModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Small delay so the wall loads first, then modal appears
    const alreadyVisited = localStorage.getItem(STORAGE_KEY)
    if (!alreadyVisited) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!show) return null

  return (
    <div className="fv-modal__backdrop" onClick={dismiss}>
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
          <h2 className="fv-modal__title">Every number has a legend.</h2>
          <p className="fv-modal__body">
            The Number Wall is a living archive of jersey number legends across
            basketball, football, baseball, hockey, and soccer. Click any number
            to see who defined it.
          </p>

          <div className="fv-modal__hints">
            <div className="fv-modal__hint">
              <span className="fv-modal__hint-icon">🔍</span>
              <span>Search by number or player name</span>
            </div>
            <div className="fv-modal__hint">
              <span className="fv-modal__hint-icon">🔥</span>
              <span>Brighter tiles = more legends</span>
            </div>
            <div className="fv-modal__hint">
              <span className="fv-modal__hint-icon">✨</span>
              <span>Pulsing tiles = debated numbers</span>
            </div>
          </div>

          <button className="fv-modal__cta" onClick={dismiss}>
            Explore the Wall
          </button>
        </div>
      </div>
    </div>
  )
}
